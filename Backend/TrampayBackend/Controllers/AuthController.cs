using System;
using System.Data;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text.Json;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly IConfiguration _cfg;

        public AuthController(IDbConnection db, IConfiguration cfg)
        {
            _db = db;
            _cfg = cfg;
        }

        // ---------- LOGIN
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] JsonElement body)
        {
            try
            {
                string email = GetString(body, "Email") ?? GetString(body, "email");
                string senha = GetString(body, "Senha") ?? GetString(body, "senha") ?? GetString(body, "Password") ?? GetString(body, "password");

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(senha))
                    return BadRequest(new { error = "Email e senha são obrigatórios" });

                var sql = "SELECT id, email, password_hash, is_active FROM users WHERE email = @Email LIMIT 1";
                var user = await _db.QueryFirstOrDefaultAsync<UserRow>(sql, new { Email = email });

                if (user == null || user.is_active != 1)
                    return BadRequest(new { error = "Credenciais inválidas" });

                if (string.IsNullOrEmpty(user.password_hash) || !BCrypt.Net.BCrypt.Verify(senha, user.password_hash))
                    return BadRequest(new { error = "Credenciais inválidas" });

                var token = GenerateJwt(user.id);
                return Ok(new { token, user = new { id = user.id, email = user.email } });
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message);
            }
        }

        // ---------- REGISTER
       [HttpPost("register")]
public async Task<IActionResult> Register([FromBody] JsonElement body)
{
    try
    {
        string accountType = GetString(body, "AccountType") ?? GetString(body, "accountType") ?? "pf";
        string documentType = GetString(body, "DocumentType") ?? GetString(body, "documentType") ?? "CPF";
        string documentNumber = GetString(body, "DocumentNumber") ?? GetString(body, "documentNumber") ?? "00000000000";
        string legalName = GetString(body, "LegalName") ?? GetString(body, "legalName") ?? GetString(body, "Name") ?? "Usuário";
        string displayName = GetString(body, "DisplayName") ?? GetString(body, "displayName") ?? legalName;
        string email = GetString(body, "Email") ?? GetString(body, "email");
        string phone = GetString(body, "Phone") ?? GetString(body, "phone") ?? "00000000000";
        string senha = GetString(body, "Senha") ?? GetString(body, "senha") ?? GetString(body, "Password") ?? GetString(body, "password");

        // 🚨 Campos obrigatórios
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha))
            return BadRequest(new { error = "Email e senha são obrigatórios." });

        // 🔍 Checa duplicação de e-mail
        var exists = await _db.QueryFirstOrDefaultAsync<int?>(
            "SELECT id FROM users WHERE email = @Email LIMIT 1", new { Email = email });

        if (exists != null)
            return BadRequest(new { error = "Email já cadastrado." });

        // 🔐 Hash seguro da senha
        var hash = BCrypt.Net.BCrypt.HashPassword(senha);

        // ✅ Insert compatível com o banco
        var insert = @"
            INSERT INTO users 
              (account_type, document_type, document_number, legal_name, display_name, email, phone, password_hash, is_active, is_verified, created_at)
            VALUES
              (@AccountType, @DocumentType, @DocumentNumber, @LegalName, @DisplayName, @Email, @Phone, @PasswordHash, 1, 1, NOW());
            SELECT LAST_INSERT_ID();";

        var id = await _db.ExecuteScalarAsync<long>(insert, new
        {
            AccountType = accountType,
            DocumentType = documentType,
            DocumentNumber = documentNumber,
            LegalName = legalName,
            DisplayName = displayName,
            Email = email,
            Phone = phone,
            PasswordHash = hash
        });

        // 🔑 Gera token JWT
        var token = GenerateJwt(id);

        return Ok(new
        {
            token,
            user = new
            {
                id,
                email,
                displayName,
                legalName,
                accountType,
                documentType
            }
        });
    }
    catch (Exception ex)
    {
        // Log mais detalhado no servidor
        Console.WriteLine($"[REGISTER ERROR] {ex.Message}");
        return Problem(detail: ex.Message, title: "Erro interno ao registrar usuário");
    }
}

        // ---------- Helpers ----------
        private string GenerateJwt(long userId)
        {
            var key = _cfg["Jwt:Key"] ?? Environment.GetEnvironmentVariable("Jwt__Key") ?? "troquesecreta_dev_mude";
            var issuer = _cfg["Jwt:Issuer"] ?? "trampay.local";
            var audience = _cfg["Jwt:Audience"] ?? "trampay.local";
            var keyBytes = Encoding.UTF8.GetBytes(key);

            var claims = new[] { new Claim("id", userId.ToString()) };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ✅ Método fixo para leitura segura de campos no JSON
        private string? GetString(JsonElement body, string name)
        {
            try
            {
                if (body.ValueKind != JsonValueKind.Object)
                    return null;

                // Tenta buscar exatamente
                if (body.TryGetProperty(name, out JsonElement prop))
                {
                    if (prop.ValueKind == JsonValueKind.String) return prop.GetString();
                    else return prop.ToString();
                }

                // Tenta buscar ignorando maiúsculas/minúsculas
                foreach (var p in body.EnumerateObject())
                {
                    if (string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase))
                        return p.Value.ValueKind == JsonValueKind.String ? p.Value.GetString() : p.Value.ToString();
                }
            }
            catch { }
            return null;
        }

        private class UserRow
        {
            public long id { get; set; }
            public string? email { get; set; }
            public string? password_hash { get; set; }
            public int is_active { get; set; }
        }
    }
}
