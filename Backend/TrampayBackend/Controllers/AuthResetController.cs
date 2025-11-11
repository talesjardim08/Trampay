using System.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;
using TrampayBackend.Services;


namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthResetController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly IEmailService _email;
        private readonly IConfiguration _cfg;
        public AuthResetController(IDbConnection db, IEmailService email, IConfiguration cfg)
        {
            _db = db;
            _email = email;
            _cfg = cfg;
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> Forgot([FromBody] ForgotDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest(new { error = "Email obrigatório" });

            var user = await _db.QueryFirstOrDefaultAsync<UserRow>("SELECT id, email FROM users WHERE email = @Email LIMIT 1", new { dto.Email });
            if (user == null) return Ok(new { ok = true }); // não vaza existência

            // gerar token seguro
            var token = GenerateToken();
            var expires = DateTime.UtcNow.AddHours(2);

            var insert = @"INSERT INTO password_resets (user_id, token, expires_at, used, created_at)
                           VALUES (@UserId, @Token, @Expires, 0, NOW())";
            await _db.ExecuteAsync(insert, new { UserId = user.id, Token = token, Expires = expires });

            // enviar email com link (frontend precisa de endpoint para reset)
            var frontendUrl = _cfg["Frontend:Url"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://seu-front.com";
            var resetUrl = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.email)}";

            var subject = "Recuperação de senha — Trampay";
            var body = $"Olá,\n\nRecebemos uma solicitação para redefinir sua senha. Clique no link abaixo (válido por 2 horas):\n\n{resetUrl}\n\nSe não solicitou, ignore.\n\n— Trampay";

            await _email.SendEmailAsync(user.email, subject, body);

            return Ok(new { ok = true });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> Reset([FromBody] ResetDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword) || string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { error = "Campos obrigatórios ausentes" });

            var row = await _db.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT pr.id, pr.user_id, pr.token, pr.used, pr.expires_at, u.email FROM password_resets pr JOIN users u ON u.id = pr.user_id WHERE pr.token = @Token AND u.email = @Email LIMIT 1",
                new { Token = dto.Token, Email = dto.Email });

            if (row == null) return BadRequest(new { error = "Token inválido" });
            if (row.used == 1) return BadRequest(new { error = "Token já utilizado" });
            if (row.expires_at < DateTime.UtcNow) return BadRequest(new { error = "Token expirado" });

            var hash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _db.ExecuteAsync("UPDATE users SET password_hash = @Hash, updated_at = NOW() WHERE id = @UserId", new { Hash = hash, UserId = (long)row.user_id });
            await _db.ExecuteAsync("UPDATE password_resets SET used = 1 WHERE id = @Id", new { Id = (long)row.id });

            return Ok(new { ok = true });
        }

        private string GenerateToken()
        {
            var b = RandomNumberGenerator.GetBytes(48);
            return Convert.ToBase64String(b).Replace("+", "").Replace("/", "").Replace("=", "");
        }

        public record ForgotDto(string Email);
        public record ResetDto(string Email, string Token, string NewPassword);

       private class UserRow
{
    public long id { get; set; }
    public string? email { get; set; } // string anulável
}

    }
}
