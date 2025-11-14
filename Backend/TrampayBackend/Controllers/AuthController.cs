// project/Trampay-main/Backend/TrampayBackend/Controllers/AuthController.cs
using System;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IDbConnection db, IConfiguration config, ILogger<AuthController> logger)
        {
            _db = db;
            _config = config;
            _logger = logger;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto body)
        {
            try
            {
                if (body == null) return BadRequest(new { error = "Payload inválido." });

                if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                    return BadRequest(new { error = "Email e senha são obrigatórios." });
                if (!string.IsNullOrWhiteSpace(body.ConfirmPassword) && body.Password != body.ConfirmPassword)
                    return BadRequest(new { error = "As senhas não conferem." });

                var existingEmail = _db.QueryFirstOrDefault<long?>("SELECT id FROM users WHERE email = @Email LIMIT 1", new { Email = body.Email.Trim().ToLower() });
                if (existingEmail.HasValue)
                    return BadRequest(new { error = "E-mail já cadastrado." });

                if (!string.IsNullOrWhiteSpace(body.DocumentNumber))
                {
                    var existingDoc = _db.QueryFirstOrDefault<long?>("SELECT id FROM users WHERE document_number = @Doc LIMIT 1", new { Doc = body.DocumentNumber.Trim() });
                    if (existingDoc.HasValue)
                        return BadRequest(new { error = "CPF/CNPJ já cadastrado." });
                }

                var hashed = BCrypt.Net.BCrypt.HashPassword(body.Password);

                var sql = @"
                    INSERT INTO users (display_name, email, password_hash, phone, account_type, document_type, document_number, created_at)
                    VALUES (@DisplayName, @Email, @PasswordHash, @Phone, @AccountType, @DocumentType, @DocumentNumber, NOW());
                    SELECT LAST_INSERT_ID();";

                var newId = _db.ExecuteScalar<long>(sql, new
                {
                    DisplayName = body.Name?.Trim(),
                    Email = body.Email.Trim().ToLower(),
                    PasswordHash = hashed,
                    Phone = body.Phone,
                    AccountType = string.IsNullOrWhiteSpace(body.AccountType) ? "pf" : body.AccountType.Trim().ToLower(),
                    DocumentType = string.IsNullOrWhiteSpace(body.DocumentType) ? "CPF" : body.DocumentType.Trim().ToUpper(),
                    DocumentNumber = string.IsNullOrWhiteSpace(body.DocumentNumber) ? null : body.DocumentNumber.Trim()
                });

                return Ok(new { message = "Registro concluído com sucesso.", id = newId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no register");
                return StatusCode(500, new { error = "Erro interno ao registrar usuário." });
            }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                    return BadRequest(new { error = "Email e senha são obrigatórios." });

                var sql = "SELECT id AS Id, email, password_hash AS PasswordHash FROM users WHERE email = @Email LIMIT 1";
                var user = _db.QueryFirstOrDefault<LoginUserDto>(sql, new { Email = body.Email.Trim().ToLower() });

                if (user == null)
                    return NotFound(new { error = "Usuário não encontrado." });

                var ok = BCrypt.Net.BCrypt.Verify(body.Password, user.PasswordHash);
                if (!ok)
                    return Unauthorized(new { error = "Senha incorreta." });

                var token = GenerateJwtToken(user.Id.ToString(), user.Email);
                var refreshToken = GenerateRefreshToken();

                return Ok(new
                {
                    token,
                    refreshToken,
                    user = new { id = user.Id, email = user.Email }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no login");
                return StatusCode(500, new { error = "Erro interno ao efetuar login." });
            }
        }

        [HttpPost("refresh")]
        public IActionResult Refresh([FromBody] RefreshDto body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.RefreshToken))
                    return BadRequest(new { error = "Refresh token obrigatório." });

                var sql = "SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = @Token LIMIT 1";
                var rt = _db.QueryFirstOrDefault<dynamic>(sql, new { Token = body.RefreshToken });

                if (rt == null) return Unauthorized(new { error = "Refresh token inválido." });

                DateTime expiresAt = rt.expires_at;
                if (expiresAt < DateTime.UtcNow) return Unauthorized(new { error = "Refresh token expirado." });

                var userId = rt.user_id.ToString();
                var email = _db.ExecuteScalar<string>("SELECT email FROM users WHERE id = @Id LIMIT 1", new { Id = userId });

                var newToken = GenerateJwtToken(userId, email);
                var newRefresh = GenerateRefreshToken();

                var insertSql = @"
                    INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
                    VALUES (@UserId, @Token, DATE_ADD(NOW(), INTERVAL @Days DAY), NOW());
                ";
                int refreshDays = int.TryParse(_config["Jwt:RefreshExpiryDays"], out var d) ? d : 30;
                _db.Execute(insertSql, new { UserId = userId, Token = newRefresh, Days = refreshDays });

                _db.Execute("DELETE FROM refresh_tokens WHERE id = @Id", new { Id = (long)rt.id });

                return Ok(new { token = newToken, refreshToken = newRefresh });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no refresh token");
                return StatusCode(500, new { error = "Erro interno ao atualizar token." });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout([FromBody] LogoutDto body)
        {
            try
            {
                if (body != null && !string.IsNullOrEmpty(body.RefreshToken))
                {
                    _db.Execute("DELETE FROM refresh_tokens WHERE token = @Token", new { Token = body.RefreshToken });
                }
                else
                {
                    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                    if (!string.IsNullOrEmpty(userId))
                    {
                        _db.Execute("DELETE FROM refresh_tokens WHERE user_id = @UserId", new { UserId = userId });
                    }
                }

                return Ok(new { message = "Logout realizado com sucesso." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no logout");
                return StatusCode(500, new { error = "Erro interno ao deslogar." });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized();
                var sql = "SELECT id AS Id, display_name AS name, email, phone, created_at FROM users WHERE id = @Id LIMIT 1";
                var user = _db.QueryFirstOrDefault<dynamic>(sql, new { Id = userId });

                if (user == null) return NotFound(new { error = "Usuário não encontrado." });

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no endpoint /me");
                return StatusCode(500, new { error = "Erro interno ao obter perfil." });
            }
        }

        private string GenerateJwtToken(string userId, string email)
        {
            var key = _config["Jwt:Secret"];
            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];
            int minutes = int.TryParse(_config["Jwt:ExpireMinutes"], out var m) ? m : 60;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim("id", userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(minutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var random = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(random));
        }
    }

    public class RegisterDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
        public string Phone { get; set; }
        public string AccountType { get; set; }
        public string DocumentType { get; set; }
        public string DocumentNumber { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginUserDto
    {
        public long Id { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
    }

    public class RefreshDto
    {
        public string RefreshToken { get; set; }
    }

    public class LogoutDto
    {
        public string RefreshToken { get; set; }
    }
}