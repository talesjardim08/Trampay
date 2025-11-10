using Dapper;
using MySqlConnector;
using System.Data;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

public class UserService : IUserService
{
    private readonly IConfiguration _config;
    private readonly string _connStr;

    public UserService(IConfiguration config)
    {
        _config = config;
        _connStr = _config.GetConnectionString("Default") ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default")!;
    }

    private IDbConnection GetConnection() => new MySqlConnection(_connStr);

    // ---------------------- CREATE USER ----------------------
    public async Task<ulong> CreateUserAsync(registerDto dto)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
        using var db = GetConnection();

        var sql = @"
INSERT INTO users
(account_type, document_type, document_number, legal_name, display_name, birth_date, email, phone, password_hash,
 address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip,
 is_active, is_verified, created_at, updated_at)
VALUES
(@AccountType, @DocumentType, @DocumentNumber, @LegalName, @DisplayName, @BirthDate, @Email, @Phone, @PasswordHash,
 @AddressStreet, @AddressNumber, @AddressComplement, @AddressNeighborhood, @AddressCity, @AddressState, @AddressZip,
 1, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP());
SELECT LAST_INSERT_ID();";

        var id = await db.ExecuteScalarAsync<ulong>(sql, new
        {
            dto.AccountType,
            dto.DocumentType,
            dto.DocumentNumber,
            dto.LegalName,
            dto.DisplayName,
            dto.BirthDate,
            dto.Email,
            dto.Phone,
            PasswordHash = hash,
            dto.AddressStreet,
            dto.AddressNumber,
            dto.AddressComplement,
            dto.AddressNeighborhood,
            dto.AddressCity,
            dto.AddressState,
            dto.AddressZip
        });

        return id;
    }

    // ---------------------- GET USER BY EMAIL ----------------------
    public async Task<User?> GetByEmailAsync(string email)
    {
        if (string.IsNullOrEmpty(email)) return null;
        using var db = GetConnection();
        var sql = "SELECT * FROM users WHERE email = @Email LIMIT 1";
        return await db.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
    }

    // ---------------------- GET USER BY ID ----------------------
    public async Task<User?> GetByIdAsync(ulong id)
    {
        using var db = GetConnection();
        var sql = "SELECT * FROM users WHERE id = @Id LIMIT 1";
        return await db.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
    }

    // ---------------------- VALIDATE LOGIN ----------------------
    public async Task<string?> ValidateAndGenerateTokenAsync(string email, string password)
    {
        var user = await GetByEmailAsync(email);
        if (user == null) return null;

        if (string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        var jwtKey = _config["Jwt:Key"] ?? Environment.GetEnvironmentVariable("Jwt__Key");
        var issuer = _config["Jwt:Issuer"] ?? "TrampayApi";
        var audience = _config["Jwt:Audience"] ?? "TrampayApp";
        var expireMinutes = int.Parse(_config["Jwt:ExpireMinutes"] ?? "1440");

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtKey!);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty)
            }),
            Expires = DateTime.UtcNow.AddMinutes(expireMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    // ---------------------- FORGOT PASSWORD ----------------------
    public async Task<string?> CreatePasswordResetTokenAsync(string email)
    {
        var user = await GetByEmailAsync(email);
        if (user == null) return null;

        // Gera token aleatório e expira em 2 horas
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "");

        var expiresAt = DateTime.UtcNow.AddHours(2);

        using var db = GetConnection();
        var sql = @"INSERT INTO password_resets (user_id, token, expires_at, created_at)
                    VALUES (@UserId, @Token, @ExpiresAt, UTC_TIMESTAMP());";
        await db.ExecuteAsync(sql, new { UserId = user.Id, Token = token, ExpiresAt = expiresAt });

        return token;
    }

    // ---------------------- RESET PASSWORD ----------------------
    public async Task<bool> ResetPasswordWithTokenAsync(string token, string newPassword)
    {
        if (string.IsNullOrEmpty(token)) return false;

        using var db = GetConnection();
        var sql = @"SELECT * FROM password_resets WHERE token = @Token AND used_at IS NULL LIMIT 1";
        var reset = await db.QueryFirstOrDefaultAsync<dynamic>(sql, new { Token = token });
        if (reset == null) return false;

        DateTime expiresAt = reset.expires_at;
        if (expiresAt < DateTime.UtcNow) return false;

        var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        var userId = (ulong)reset.user_id;

        // Atualiza a senha
        var upd = @"UPDATE users SET password_hash = @Hash, updated_at = UTC_TIMESTAMP() WHERE id = @UserId";
        await db.ExecuteAsync(upd, new { Hash = newHash, UserId = userId });

        // Marca token como usado
        var usedSql = @"UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE id = @Id";
        await db.ExecuteAsync(usedSql, new { Id = (ulong)reset.id });

        return true;
    }
}
