using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IDbConnection _db;
        public PaymentsController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] string? status = null)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"SELECT p.id, p.amount, p.method, p.status, p.paid_at, s.title AS schedule_title
                        FROM payments p
                        LEFT JOIN schedules s ON s.id = p.schedule_id
                        WHERE p.owner_user_id = @Owner " +
                        (status != null ? "AND p.status = @Status " : "") +
                        "ORDER BY p.created_at DESC";

            var list = await _db.QueryAsync(sql, new { Owner = userId, Status = status });
            return Ok(list);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreatePaymentDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"INSERT INTO payments (owner_user_id, schedule_id, amount, method, status, created_at)
                        VALUES (@Owner, @ScheduleId, @Amount, @Method, 'pending', NOW());
                        SELECT LAST_INSERT_ID();";
            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                ScheduleId = dto.ScheduleId,
                Amount = dto.Amount,
                Method = dto.Method
            });

            var created = await _db.QueryFirstAsync("SELECT * FROM payments WHERE id = @Id", new { Id = id });
            return Created($"/api/payments/{id}", created);
        }

        [HttpPut("{id:long}/pay")]
        [Authorize]
        public async Task<IActionResult> MarkAsPaid(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"UPDATE payments SET status='paid', paid_at=NOW()
                        WHERE id=@Id AND owner_user_id=@Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId });
            if (rows == 0) return NotFound();

            return Ok(new { id, status = "paid" });
        }

        [HttpGet("simulate")]
        [Authorize]
        public async Task<IActionResult> Simulate([FromQuery] int days = 30)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"SELECT SUM(price) as total
                        FROM schedules
                        WHERE owner_user_id=@Owner AND status IN ('confirmed','pending')
                        AND scheduled_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL @Days DAY)";
            var total = await _db.ExecuteScalarAsync<decimal?>(sql, new { Owner = userId, Days = days });

            return Ok(new
            {
                range_days = days,
                simulated_income = total ?? 0
            });
        }

        public record CreatePaymentDto(long? ScheduleId, decimal Amount, string Method);
    }
}
