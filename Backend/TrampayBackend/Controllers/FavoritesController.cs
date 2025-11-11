using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/favorites")]
    public class FavoritesController : ControllerBase
    {
        private readonly IDbConnection _db;
        public FavoritesController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List()
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = @"SELECT f.id, f.service_id, s.title, s.description, s.base_price
                        FROM favorites f
                        JOIN services s ON s.id = f.service_id
                        WHERE f.owner_user_id = @Owner";
            var favs = await _db.QueryAsync(sql, new { Owner = userId });
            return Ok(favs);
        }

        [HttpPost("toggle")]
        [Authorize]
        public async Task<IActionResult> Toggle([FromBody] ToggleFavoriteDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var exists = await _db.QueryFirstOrDefaultAsync<long?>(
                "SELECT id FROM favorites WHERE owner_user_id = @Owner AND service_id = @Service LIMIT 1",
                new { Owner = userId, Service = dto.ServiceId });

            if (exists != null)
            {
                await _db.ExecuteAsync("DELETE FROM favorites WHERE id = @Id", new { Id = exists });
                return Ok(new { favorite = false });
            }
            else
            {
                await _db.ExecuteAsync("INSERT INTO favorites (owner_user_id, service_id, created_at) VALUES (@Owner, @Service, NOW())",
                    new { Owner = userId, Service = dto.ServiceId });
                return Ok(new { favorite = true });
            }
        }

        public record ToggleFavoriteDto(long ServiceId);
    }
}
