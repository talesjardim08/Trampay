using Dapper;
using MySqlConnector;
using System.Data;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;

public class UserService : IUserService
{
    private readonly IConfiguration _config;
    public UserService(IConfiguration config) => _config = config;

    private IDbConnection GetConnection() =>
        new MySqlConnection(_config.GetConnectionString("Default"));

    public async Task<ulong> CreateUserAsync(RegisterDto dto)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
        using var db = GetConnection();
        var sql = @"INSERT INTO users 
        (account_type, document_type, document_number, legal_name, display_name, birth_date, email, phone, password_hash, is_active, is_verified, created_at)
        VALUES (@AccountType,@DocumentType,@DocumentNumber,@LegalName,@DisplayName,@BirthDate,@Email,@Phone,@PasswordHash,1,0,UTC_TIMESTAMP());
        SELECT LAST_INSERT_ID();";

        return await db.ExecuteScalarAsync<ulong>(sql, new {
            dto.AccountType,
            dto.DocumentType,
            dto.DocumentNumber,
            dto.LegalName,
            dto.DisplayName,
            dto.BirthDate,
            dto.Email,
            dto.Phone,
            PasswordHash = hash
        });
    }

    public async Task<User> GetByEmailAsync(string email)
    {
        using var db = GetConnection();
        var sql = "SELECT * FROM users WHERE email = @Email LIMIT 1";
        return await db.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
    }

    public async Task<string> ValidateAndGenerateTokenAsync(string email, string password)
    {
        var user = await GetByEmailAsync(email);
        if (user == null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;

        var jwtKey = _config["Jwt:Key"];
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];
        var expireMinutes = int.Parse(_config["Jwt:ExpireMinutes"] ?? "1440");

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? "")
            }),
            Expires = DateTime.UtcNow.AddMinutes(expireMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
