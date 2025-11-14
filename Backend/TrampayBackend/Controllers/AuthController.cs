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
    /*
     * AuthController.cs
     * -----------------
     * Controller único responsável por:
     *  - register (POST /api/auth/register)
     *  - login    (POST /api/auth/login)
     *  - me       (GET  /api/auth/me)  <-- este endpoint permanece aqui para compatibilidade
     *  - refresh  (POST /api/auth/refresh)
     *  - logout   (POST /api/auth/logout)
     *
     * Observações:
     *  - Usa Dapper + IDbConnection (injeção de dependência) para consultas simples.
     *  - Usa BCrypt.Net para hash de senhas (assegure que o package BCrypt.Net-Next está instalado).
     *  - JWT é gerado com parâmetros via IConfiguration (appsettings.json).
     *  - Refresh token aqui é tratado de forma simples (armazenado na tabela refresh_tokens).
     *    Se você já tem outra implementação (Redis, Identity, etc.), eu adapto quando você mandar o arquivo original.
     *
     * Segurança:
     *  - Nunca logue senhas em texto.
     *  - Tokens sensíveis devem ser armazenados com segurança no client (SecureStorage).
     */
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthController> _logger;

        // Config keys usados:
        // Jwt:Key, Jwt:Issuer, Jwt:Audience, Jwt:ExpiryMinutes, Jwt:RefreshExpiryDays
        public AuthController(IDbConnection db, IConfiguration config, ILogger<AuthController> logger)
        {
            _db = db;
            _config = config;
            _logger = logger;
        }

        // -----------------------------
        // POST /api/auth/register
        // Registra um usuário (PF/PJ handling deve ser feita no body do cliente)
        // -----------------------------
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto body)
        {
            try
            {
                if (body == null) return BadRequest(new { error = "Payload inválido." });

                // Validações simples -- expandir conforme necessidade
                if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                    return BadRequest(new { error = "Email e senha são obrigatórios." });

                // Verifica se o email já existe
                var existing = _db.QueryFirstOrDefault<int?>("SELECT id_user FROM users WHERE email = @Email LIMIT 1", new { Email = body.Email.Trim().ToLower() });
                if (existing.HasValue)
                    return BadRequest(new { error = "Email já cadastrado." });

                // Faz hash da senha
                var hashed = BCrypt.Net.BCrypt.HashPassword(body.Password);

                // Insere usuário (adapte colunas conforme seu schema; use id_user se for o seu padrão)
                var sql = @"
                    INSERT INTO users (name, email, password, phone, created_at)
                    VALUES (@Name, @Email, @Password, @Phone, NOW());
                    SELECT LAST_INSERT_ID();
                ";

                var newId = _db.ExecuteScalar<long>(sql, new
                {
                    Name = body.Name?.Trim(),
                    Email = body.Email.Trim().ToLower(),
                    Password = hashed,
                    Phone = body.Phone
                });

                // Opcional: criar registro inicial em outras tabelas (balance, profile, settings)
                // Ex.: INSERT INTO balance (user_id, balance) VALUES (@Id, 0);

                return Ok(new { message = "Registro concluído com sucesso.", id = newId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no register");
                return StatusCode(500, new { error = "Erro interno ao registrar usuário." });
            }
        }

        // -----------------------------
        // POST /api/auth/login
        // Faz login e retorna token JWT + refresh token
        // -----------------------------
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                    return BadRequest(new { error = "Email e senha são obrigatórios." });

                // Recupera usuário por email
                var sql = "SELECT id_user AS Id, email, password FROM users WHERE email = @Email LIMIT 1";
                var user = _db.QueryFirstOrDefault<LoginUserDto>(sql, new { Email = body.Email.Trim().ToLower() });

                if (user == null)
                    return Unauthorized(new { error = "Credenciais inválidas." });

                // Verifica senha
                var ok = BCrypt.Net.BCrypt.Verify(body.Password, user.Password);
                if (!ok)
                    return Unauthorized(new { error = "Credenciais inválidas." });

                // Gera JWT
                var token = GenerateJwtToken(user.Id.ToString(), user.Email);
                // Gera refresh token e salva no BD
                var refreshToken = GenerateRefreshToken();
                var insertRefreshSql = @"
                    INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
                    VALUES (@UserId, @Token, DATE_ADD(NOW(), INTERVAL @Days DAY), NOW());
                ";
                int refreshDays = int.TryParse(_config["Jwt:RefreshExpiryDays"], out var d) ? d : 30;
                _db.Execute(insertRefreshSql, new { UserId = user.Id, Token = refreshToken, Days = refreshDays });

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

        // -----------------------------
        // POST /api/auth/refresh
        // Recebe refresh token e retorna novo par (token, refreshToken)
        // -----------------------------
        [HttpPost("refresh")]
        public IActionResult Refresh([FromBody] RefreshDto body)
        {
            try
            {
                if (body == null || string.IsNullOrWhiteSpace(body.RefreshToken))
                    return BadRequest(new { error = "Refresh token obrigatório." });

                // Busca refresh token no banco
                var sql = "SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = @Token LIMIT 1";
                var rt = _db.QueryFirstOrDefault<dynamic>(sql, new { Token = body.RefreshToken });

                if (rt == null) return Unauthorized(new { error = "Refresh token inválido." });

                DateTime expiresAt = rt.expires_at;
                if (expiresAt < DateTime.UtcNow) return Unauthorized(new { error = "Refresh token expirado." });

                // Gera novo token e novo refresh token (rotating)
                var userId = rt.user_id.ToString();
                var email = _db.ExecuteScalar<string>("SELECT email FROM users WHERE id_user = @Id LIMIT 1", new { Id = userId });

                var newToken = GenerateJwtToken(userId, email);
                var newRefresh = GenerateRefreshToken();

                // Salva novo refresh e remove/invalidar o antigo
                var insertSql = @"
                    INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
                    VALUES (@UserId, @Token, DATE_ADD(NOW(), INTERVAL @Days DAY), NOW());
                ";
                int refreshDays = int.TryParse(_config["Jwt:RefreshExpiryDays"], out var d) ? d : 30;
                _db.Execute(insertSql, new { UserId = userId, Token = newRefresh, Days = refreshDays });

                // Invalida o antigo (pode ser delete ou marcar como revoked)
                _db.Execute("DELETE FROM refresh_tokens WHERE id = @Id", new { Id = (long)rt.id });

                return Ok(new { token = newToken, refreshToken = newRefresh });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no refresh token");
                return StatusCode(500, new { error = "Erro interno ao atualizar token." });
            }
        }

        // -----------------------------
        // POST /api/auth/logout
        // Invalida refresh token do usuário (logout)
        // -----------------------------
        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout([FromBody] LogoutDto body)
        {
            try
            {
                // Se o client enviar o refresh token, removemos. Caso contrário, removemos todos do user.
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

        // -----------------------------
        // GET /api/auth/me
        // Retorna dados do usuário logado (mantido aqui para compatibilidade)
        // -----------------------------
        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var sql = "SELECT id_user AS Id, name, email, phone, created_at FROM users WHERE id_user = @Id LIMIT 1";
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

        // -----------------------------
        // Helpers (privados)
        // -----------------------------
        private string GenerateJwtToken(string userId, string email)
        {
            var key = _config["Jwt:Key"];
            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];
            int minutes = int.TryParse(_config["Jwt:ExpiryMinutes"], out var m) ? m : 60;

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
            // refresh token simples: GUID + base64 (pode melhorar para tokens criptograficamente seguros)
            var random = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(random));
        }
    }

    // -----------------------------
    // DTOs usados por este controller
    // -----------------------------
    public class RegisterDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Phone { get; set; }
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
        public string Password { get; set; }
    }

    public class RefreshDto
    {
        public string RefreshToken { get; set; }
    }

    public class LogoutDto
    {
        public string RefreshToken { get; set; } // opcional
    }
}
