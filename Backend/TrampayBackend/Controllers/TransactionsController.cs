using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/transactions")]
    public class TransactionsController : ControllerBase
    {
        private readonly IDbConnection _db;
        public TransactionsController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] string? type, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"SELECT * FROM transactions WHERE owner_user_id = @UserId
                        AND (@Type IS NULL OR type = @Type)
                        AND (@From IS NULL OR occurred_at >= @From)
                        AND (@To IS NULL OR occurred_at <= @To)
                        ORDER BY occurred_at DESC";

            var rows = await _db.QueryAsync(sql, new { UserId = userId, Type = type, From = from, To = to });
            return Ok(rows);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateTransactionDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"INSERT INTO transactions (owner_user_id, account_id, type, amount, currency, occurred_at, status, notes, created_at)
                        VALUES (@Owner, @Account, @Type, @Amount, @Currency, @Occurred, @Status, @Notes, NOW());
                        SELECT LAST_INSERT_ID();";

            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                Account = dto.AccountId,
                Type = dto.Type,
                Amount = dto.Amount,
                Currency = dto.Currency ?? "BRL",
                Occurred = dto.OccurredAt ?? DateTime.UtcNow,
                Status = dto.Status ?? "done",
                Notes = dto.Notes
            });

            var row = await _db.QueryFirstOrDefaultAsync("SELECT * FROM transactions WHERE id = @Id", new { Id = id });
            return Created($"/api/transactions/{id}", row);
        }

        public record CreateTransactionDto(long AccountId, string Type, decimal Amount, string? Currency, DateTime? OccurredAt, string? Status, string? Notes);
    }
}
