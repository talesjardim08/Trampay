using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using Dapper;
using System.Threading.Tasks;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthProfileController : ControllerBase
    {
        private readonly IDbConnection _db;
        public AuthProfileController(IDbConnection db)
        {
            _db = db;
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            var user = await _db.QueryFirstOrDefaultAsync(@"
                SELECT id, email, display_name AS displayName, phone, is_premium AS isPremium, premium_until AS premiumUntil
                FROM users WHERE id = @id LIMIT 1", new { id = userIdClaim });

            if (user == null) return NotFound();
            return Ok(user);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateDto body)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            if (body == null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.DisplayName))
                return BadRequest(new { error = "Campos obrigatórios faltando." });

            await _db.ExecuteAsync(@"UPDATE users SET 
                email=@Email, display_name=@DisplayName, phone=@Phone, updated_at=NOW() 
                WHERE id=@Id",
                new { Email = body.Email, DisplayName = body.DisplayName, Phone = body.Phone, Id = userIdClaim });

            var updated = await _db.QueryFirstAsync(@"
                SELECT id, email, display_name AS displayName, phone, is_premium AS isPremium, premium_until AS premiumUntil 
                FROM users WHERE id = @Id LIMIT 1", new { Id = userIdClaim });

            return Ok(updated);
        }
    }

    public class ProfileUpdateDto
    {
        public string Email { get; set; }
        public string DisplayName { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; } // opcional
    }
}
