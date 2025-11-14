using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using TrampayBackend.Models;

namespace TrampayBackend.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _cfg;
        private readonly string _jwtSecret;
        private readonly int _jwtExpiryMinutes;
        private readonly IDbConnection _db;

        public AuthService(IConfiguration cfg, IDbConnection db)
        {
            _cfg = cfg ?? throw new ArgumentNullException(nameof(cfg));
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _jwtSecret = _cfg["Jwt:Secret"] ?? Environment.GetEnvironmentVariable("JWT_SECRET") ?? "change_this_secret";
            _jwtExpiryMinutes = int.TryParse(_cfg["Jwt:ExpireMinutes"], out var m) ? m : 60;
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        public string GenerateJwtToken(long userId, string? email, string? role = "user")
        {
            var keyBytes = Encoding.UTF8.GetBytes(_jwtSecret);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email ?? string.Empty),
                new Claim(ClaimTypes.Role, role ?? "user"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _cfg["Jwt:Issuer"],
                audience: _cfg["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<(bool Success, string Message, string? Token)> AuthenticateAsync(string email, string password)
        {
            try
            {
                var user = await _db.QueryFirstOrDefaultAsync<User>(
                    "SELECT * FROM users WHERE Email = @Email LIMIT 1", new { Email = email });

                if (user == null)
                    return (false, "Usuário não encontrado", null);

                if (string.IsNullOrEmpty(user.PasswordHash))
                    return (false, "Usuário sem senha configurada", null);

                if (!VerifyPassword(password, user.PasswordHash))
                    return (false, "Senha incorreta", null);

                var token = GenerateJwtToken(user.Id, user.Email, "user");
                return (true, "Autenticação bem-sucedida", token);
            }
            catch (Exception ex)
            {
                return (false, $"Erro ao autenticar: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message, string? Token)> RegisterAsync(User newUser, string password)
        {
            try
            {
                var existing = await _db.QueryFirstOrDefaultAsync<User>(
                    "SELECT * FROM users WHERE Email = @Email LIMIT 1", new { newUser.Email });

                if (existing != null)
                    return (false, "E-mail já registrado", null);

                var hash = HashPassword(password);
                newUser.PasswordHash = hash;
                newUser.CreatedAt = DateTime.UtcNow;
                newUser.UpdatedAt = DateTime.UtcNow;
                newUser.IsActive = true;

                const string sql = @"
                    INSERT INTO users (AccountType, DocumentType, DocumentNumber, LegalName, DisplayName, BirthDate, Email, Phone, PasswordHash, IsActive, IsVerified, CreatedAt, UpdatedAt)
                    VALUES (@AccountType, @DocumentType, @DocumentNumber, @LegalName, @DisplayName, @BirthDate, @Email, @Phone, @PasswordHash, @IsActive, @IsVerified, @CreatedAt, @UpdatedAt);
                    SELECT LAST_INSERT_ID();";

                var id = await _db.ExecuteScalarAsync<long>(sql, newUser);
                newUser.Id = id;

                var token = GenerateJwtToken(id, newUser.Email, "user");
                return (true, "Usuário registrado com sucesso", token);
            }
            catch (Exception ex)
            {
                return (false, $"Erro ao registrar: {ex.Message}", null);
            }
        }
    }
}