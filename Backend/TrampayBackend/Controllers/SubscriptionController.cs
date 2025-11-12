using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly IConfiguration _configuration;

        public SubscriptionController(IDbConnection db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        // POST api/subscription/activate
        // Simula ativação (marca user.is_premium = 1 e premium_until = now + 1 year)
        [Authorize]
        [HttpPost("activate")]
        public async Task<IActionResult> Activate()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            if (!long.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var sql = @"UPDATE users 
                        SET is_premium = 1, premium_until = @until 
                        WHERE id = @userId";

            var until = DateTime.UtcNow.AddYears(1);

            var affected = await _db.ExecuteAsync(sql, new { until, userId });

            if (affected > 0)
            {
                return Ok(new { success = true, premium_until = until });
            }

            return BadRequest(new { success = false, message = "Não foi possível ativar a assinatura." });
        }

        // GET api/subscription/status
        [Authorize]
        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            if (!long.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var sql = @"SELECT is_premium, premium_until FROM users WHERE id = @userId LIMIT 1";
            var result = await _db.QueryFirstOrDefaultAsync(sql, new { userId });

            if (result == null) return NotFound();

            bool isPremium = Convert.ToBoolean(result.is_premium);
            DateTime? premiumUntil = result.premium_until == null ? (DateTime?)null : Convert.ToDateTime(result.premium_until);

            return Ok(new { isPremium, premiumUntil });
        }
    }
}
