using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/schedules")]
    public class SchedulingController : ControllerBase
    {
        private readonly IDbConnection _db;
        public SchedulingController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] string? status = null)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = @"SELECT s.id, s.title, s.description, s.scheduled_date, s.duration_minutes, 
                               s.price, s.status, c.name AS client_name, sv.title AS service_title
                        FROM schedules s
                        LEFT JOIN clients c ON c.id = s.client_id
                        LEFT JOIN services sv ON sv.id = s.service_id
                        WHERE s.owner_user_id = @Owner
                        " + (status != null ? "AND s.status = @Status" : "") + " ORDER BY s.scheduled_date DESC";

            var rows = await _db.QueryAsync(sql, new { Owner = userId, Status = status });
            return Ok(rows);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateScheduleDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = @"INSERT INTO schedules (owner_user_id, client_id, service_id, title, description, scheduled_date, duration_minutes, price, status, created_at)
                        VALUES (@Owner, @ClientId, @ServiceId, @Title, @Desc, @Date, @Duration, @Price, 'pending', NOW());
                        SELECT LAST_INSERT_ID();";

            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                ClientId = dto.ClientId,
                ServiceId = dto.ServiceId,
                Title = dto.Title,
                Desc = dto.Description,
                Date = dto.ScheduledDate,
                Duration = dto.DurationMinutes,
                Price = dto.Price
            });

            var created = await _db.QueryFirstAsync("SELECT * FROM schedules WHERE id = @Id", new { Id = id });
            return Created($"/api/schedules/{id}", created);
        }

        [HttpPut("{id:long}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] StatusDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = "UPDATE schedules SET status=@Status, updated_at=NOW() WHERE id=@Id AND owner_user_id=@Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId, Status = dto.Status });
            if (rows == 0) return NotFound();

            return Ok(new { id, status = dto.Status });
        }

        [HttpDelete("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var rows = await _db.ExecuteAsync("DELETE FROM schedules WHERE id=@Id AND owner_user_id=@Owner", new { Id = id, Owner = userId });
            if (rows == 0) return NotFound();

            return NoContent();
        }

        public record CreateScheduleDto(long? ClientId, long? ServiceId, string Title, string? Description, DateTime ScheduledDate, int DurationMinutes, decimal Price);
        public record StatusDto(string Status);
    }
}
