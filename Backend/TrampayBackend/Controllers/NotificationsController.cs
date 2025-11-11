using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly IDbConnection _db;
        public NotificationsController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();
            var offset = (page - 1) * pageSize;
            var sql = @"SELECT id, title, body, type, payload, is_read, created_at
                        FROM notifications
                        WHERE user_id = @User
                        ORDER BY created_at DESC
                        LIMIT @Limit OFFSET @Offset";
            var rows = await _db.QueryAsync(sql, new { User = userId, Limit = pageSize, Offset = offset });
            return Ok(new { page, pageSize, items = rows });
        }

        [HttpPost("mark-read/{id:long}")]
        [Authorize]
        public async Task<IActionResult> MarkRead(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();
            var rows = await _db.ExecuteAsync("UPDATE notifications SET is_read = 1 WHERE id = @Id AND user_id = @User", new { Id = id, User = userId });
            if (rows == 0) return NotFound();
            return Ok(new { id, read = true });
        }

        // endpoint para criar notificações (usado internamente por outras rotas)
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateNotificationDto dto)
        {
            var sql = @"INSERT INTO notifications (user_id, title, body, type, payload, is_read, created_at)
                        VALUES (@UserId, @Title, @Body, @Type, @Payload, 0, NOW());
                        SELECT LAST_INSERT_ID();";
            var id = await _db.ExecuteScalarAsync<long>(sql, new { UserId = dto.UserId, Title = dto.Title, Body = dto.Body, Type = dto.Type, Payload = dto.Payload });
            var created = await _db.QueryFirstOrDefaultAsync("SELECT * FROM notifications WHERE id = @Id", new { Id = id });
            return Created($"/api/notifications/{id}", created);
        }

        public record CreateNotificationDto(long UserId, string Title, string? Body, string? Type, string? Payload);
    }
}
