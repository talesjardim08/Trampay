using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/services")]
    public class ServicesController : ControllerBase
    {
        private readonly IDbConnection _db;
        public ServicesController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List()
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = @"SELECT id, title, description, base_price, duration_minutes, is_active, created_at
                        FROM services WHERE owner_user_id = @Owner ORDER BY created_at DESC";
            var services = await _db.QueryAsync(sql, new { Owner = userId });
            return Ok(services);
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = "SELECT * FROM services WHERE id = @Id AND owner_user_id = @Owner LIMIT 1";
            var service = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id, Owner = userId });
            if (service == null) return NotFound();

            return Ok(service);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateServiceDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = @"INSERT INTO services (owner_user_id, title, description, duration_minutes, base_price, currency, is_active, created_at)
                        VALUES (@Owner, @Title, @Description, @Duration, @BasePrice, @Currency, 1, NOW());
                        SELECT LAST_INSERT_ID();";

            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                Title = dto.Title,
                Description = dto.Description,
                Duration = dto.DurationMinutes,
                BasePrice = dto.BasePrice,
                Currency = dto.Currency ?? "BRL"
            });

            var created = await _db.QueryFirstOrDefaultAsync("SELECT * FROM services WHERE id = @Id", new { Id = id });
            return Created($"/api/services/{id}", created);
        }

        [HttpPut("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateServiceDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = @"UPDATE services 
                        SET title=@Title, description=@Description, duration_minutes=@Duration, base_price=@BasePrice, is_active=@Active, updated_at=NOW()
                        WHERE id=@Id AND owner_user_id=@Owner";
            var rows = await _db.ExecuteAsync(sql, new
            {
                Id = id,
                Owner = userId,
                Title = dto.Title,
                Description = dto.Description,
                Duration = dto.DurationMinutes,
                BasePrice = dto.BasePrice,
                Active = dto.IsActive
            });

            if (rows == 0) return NotFound();
            var updated = await _db.QueryFirstOrDefaultAsync("SELECT * FROM services WHERE id = @Id", new { Id = id });
            return Ok(updated);
        }

        [HttpDelete("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = "DELETE FROM services WHERE id = @Id AND owner_user_id = @Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId });
            if (rows == 0) return NotFound();

            return NoContent();
        }

        public record CreateServiceDto(string Title, string? Description, decimal BasePrice, int DurationMinutes, string? Currency);
        public record UpdateServiceDto(string Title, string? Description, decimal BasePrice, int DurationMinutes, bool IsActive);
    }
}
