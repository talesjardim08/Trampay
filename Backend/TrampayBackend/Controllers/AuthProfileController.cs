using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using Dapper;
using System.Threading.Tasks;
using System;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/auth/profile")]
    public class AuthProfileController : ControllerBase
    {
        private readonly IDbConnection _db;

        public AuthProfileController(IDbConnection db)
        {
            _db = db;
        }

        /// <summary>
        /// Retorna o perfil completo do usuário logado
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Token inválido ou expirado." });

                var sql = @"
                    SELECT 
                        id AS id, 
                        display_name AS displayName, 
                        email, 
                        phone, 
                        created_at
                    FROM users 
                    WHERE id = @id LIMIT 1";

                var profile = await _db.QueryFirstOrDefaultAsync(sql, new { id = userId });

                if (profile == null)
                    return NotFound(new { error = "Usuário não encontrado." });

                return Ok(profile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Erro interno ao obter o perfil.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza nome, email ou telefone
        /// </summary>
        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] dynamic body)
        {
            try
            {
                var userId = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Token inválido ou expirado." });

                string displayName = body?.displayName ?? body?.name;
                string email = body?.email;
                string phone = body?.phone;

                var sql = @"
                    UPDATE users 
                    SET 
                        display_name = COALESCE(@displayName, display_name),
                        email = COALESCE(@email, email),
                        phone = COALESCE(@phone, phone),
                        updated_at = NOW()
                    WHERE id = @id";

                await _db.ExecuteAsync(sql, new
                {
                    id = userId,
                    displayName,
                    email,
                    phone
                });

                var select = @"SELECT id AS id, display_name AS displayName, email, phone, created_at, updated_at FROM users WHERE id = @id LIMIT 1";
                var updated = await _db.QueryFirstOrDefaultAsync(select, new { id = userId });
                return Ok(updated);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Erro interno ao atualizar o perfil.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza a senha do usuário
        /// </summary>
        [HttpPut("password")]
        [Authorize]
        public async Task<IActionResult> UpdatePassword([FromBody] dynamic body)
        {
            try
            {
                var userId = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Token inválido ou expirado." });

                string currentPassword = body?.currentPassword;
                string newPassword = body?.newPassword;

                if (string.IsNullOrWhiteSpace(newPassword))
                    return BadRequest(new { error = "Nova senha é obrigatória." });

                var sqlGet = "SELECT password_hash FROM users WHERE id = @id LIMIT 1";
                var storedHash = await _db.ExecuteScalarAsync<string>(sqlGet, new { id = userId });
                if (storedHash == null)
                    return Unauthorized(new { error = "Usuário não encontrado." });

                if (!string.IsNullOrWhiteSpace(currentPassword))
                {
                    bool valid = BCrypt.Net.BCrypt.Verify(currentPassword, storedHash);
                    if (!valid)
                        return BadRequest(new { error = "Senha atual incorreta." });
                }

                string newHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
                var sqlUpdate = "UPDATE users SET password_hash = @hash, updated_at = NOW() WHERE id = @id";
                await _db.ExecuteAsync(sqlUpdate, new { id = userId, hash = newHash });

                return Ok(new { message = "Senha atualizada com sucesso." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Erro interno ao atualizar a senha.", detail = ex.Message });
            }
        }

        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> DeleteAccount()
        {
            try
            {
                var userId = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Token inválido ou expirado." });

                var affected = await _db.ExecuteAsync("DELETE FROM users WHERE id = @id", new { id = userId });
                if (affected == 0)
                    return NotFound(new { error = "Usuário não encontrado." });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Erro interno ao deletar a conta.", detail = ex.Message });
            }
        }
    }
}
