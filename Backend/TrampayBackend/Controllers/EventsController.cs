using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        private readonly IDbConnection _db;
        public EventsController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? type = null, [FromQuery] string? status = null)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var offset = (page - 1) * pageSize;
            var whereClause = "WHERE owner_user_id = @Owner";
            if (!string.IsNullOrEmpty(type)) whereClause += " AND type = @Type";
            if (!string.IsNullOrEmpty(status)) whereClause += " AND status = @Status";

            var sql = $@"SELECT id, client_id, title, description, event_date, event_time, type, priority, location, amount, recurring, frequency, reminder_minutes, status, created_at, updated_at
                        FROM events
                        {whereClause}
                        ORDER BY event_date DESC, event_time DESC
                        LIMIT @Limit OFFSET @Offset";
            var rows = await _db.QueryAsync(sql, new { Owner = userId, Type = type, Status = status, Limit = pageSize, Offset = offset });
            return Ok(new { page, pageSize, items = rows });
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Get(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "SELECT * FROM events WHERE id = @Id AND owner_user_id = @Owner LIMIT 1";
            var evt = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id, Owner = userId });
            if (evt == null) return NotFound();
            return Ok(evt);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"INSERT INTO events (owner_user_id, client_id, title, description, event_date, event_time, type, priority, location, amount, recurring, frequency, reminder_minutes, status, created_at)
                        VALUES (@Owner, @ClientId, @Title, @Description, @EventDate, @EventTime, @Type, @Priority, @Location, @Amount, @Recurring, @Frequency, @ReminderMinutes, @Status, NOW());
                        SELECT LAST_INSERT_ID();";
            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                ClientId = dto.ClientId,
                Title = dto.Title,
                Description = dto.Description,
                EventDate = dto.EventDate,
                EventTime = dto.EventTime,
                Type = dto.Type ?? "other",
                Priority = dto.Priority ?? "medium",
                Location = dto.Location,
                Amount = dto.Amount,
                Recurring = dto.Recurring ?? false,
                Frequency = dto.Frequency ?? "none",
                ReminderMinutes = dto.ReminderMinutes ?? 15,
                Status = dto.Status ?? "pending"
            });
            var created = await _db.QueryFirstOrDefaultAsync("SELECT * FROM events WHERE id = @Id", new { Id = id });
            return Created($"/api/events/{id}", created);
        }

        [HttpPut("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateEventDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"UPDATE events 
                        SET client_id=@ClientId, title=@Title, description=@Description, event_date=@EventDate, event_time=@EventTime, 
                            type=@Type, priority=@Priority, location=@Location, amount=@Amount, recurring=@Recurring, frequency=@Frequency, 
                            reminder_minutes=@ReminderMinutes, status=@Status, updated_at=NOW()
                        WHERE id=@Id AND owner_user_id=@Owner";
            var rows = await _db.ExecuteAsync(sql, new
            {
                Id = id,
                Owner = userId,
                ClientId = dto.ClientId,
                Title = dto.Title,
                Description = dto.Description,
                EventDate = dto.EventDate,
                EventTime = dto.EventTime,
                Type = dto.Type,
                Priority = dto.Priority,
                Location = dto.Location,
                Amount = dto.Amount,
                Recurring = dto.Recurring,
                Frequency = dto.Frequency,
                ReminderMinutes = dto.ReminderMinutes,
                Status = dto.Status
            });
            if (rows == 0) return NotFound();
            var updated = await _db.QueryFirstOrDefaultAsync("SELECT * FROM events WHERE id = @Id", new { Id = id });
            return Ok(updated);
        }

        [HttpDelete("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "DELETE FROM events WHERE id = @Id AND owner_user_id = @Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId });
            if (rows == 0) return NotFound();
            return NoContent();
        }

        [HttpGet("upcoming")]
        [Authorize]
        public async Task<IActionResult> GetUpcoming([FromQuery] int days = 7)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"SELECT * FROM events 
                        WHERE owner_user_id = @Owner 
                        AND event_date >= CURDATE() 
                        AND event_date <= DATE_ADD(CURDATE(), INTERVAL @Days DAY)
                        AND status = 'pending'
                        ORDER BY event_date ASC, event_time ASC";
            var events = await _db.QueryAsync(sql, new { Owner = userId, Days = days });
            return Ok(events);
        }

        public record CreateEventDto(long? ClientId, string Title, string? Description, DateTime EventDate, TimeSpan? EventTime, string? Type, string? Priority, string? Location, decimal? Amount, bool? Recurring, string? Frequency, int? ReminderMinutes, string? Status);
        public record UpdateEventDto(long? ClientId, string Title, string? Description, DateTime EventDate, TimeSpan? EventTime, string? Type, string? Priority, string? Location, decimal? Amount, bool? Recurring, string? Frequency, int? ReminderMinutes, string? Status);
    }
}
