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
                        AND (@From IS NULL OR transaction_date >= @From)
                        AND (@To IS NULL OR transaction_date <= @To)
                        ORDER BY transaction_date DESC";

            var rows = await _db.QueryAsync(sql, new { UserId = userId, Type = type, From = from, To = to });
            return Ok(rows);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateTransactionDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"INSERT INTO transactions (owner_user_id, account_id, title, type, amount, category, currency, transaction_date, status, created_at)
                        VALUES (@Owner, @Account, @Title, @Type, @Amount, @Category, @Currency, @Date, @Status, NOW());
                        SELECT LAST_INSERT_ID();";

            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                Account = dto.AccountId,
                Title = dto.Title ?? "Transação",
                Type = dto.Type,
                Amount = dto.Amount,
                Category = dto.Category ?? "Outros",
                Currency = dto.Currency ?? "BRL",
                Date = dto.TransactionDate?.Date ?? DateTime.UtcNow.Date,
                Status = dto.Status ?? "concluído"
            });

            var row = await _db.QueryFirstOrDefaultAsync("SELECT * FROM transactions WHERE id = @Id", new { Id = id });
            return Created($"/api/transactions/{id}", row);
        }

        public record CreateTransactionDto(long AccountId, string Type, decimal Amount, string? Currency, DateTime? TransactionDate, string? Status, string? Title, string? Category);
    }
}