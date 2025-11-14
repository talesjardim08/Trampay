// project/Trampay-main/Backend/TrampayBackend/Controllers/TransactionsController.cs
using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

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

        private async Task EnsureTransactionSchema()
        {
            var titleExists = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND COLUMN_NAME='title'");
            if (titleExists == 0)
            {
                await _db.ExecuteAsync("ALTER TABLE transactions ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Transação'");
            }

            var dateExists = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND COLUMN_NAME='transaction_date'");
            if (dateExists == 0)
            {
                await _db.ExecuteAsync("ALTER TABLE transactions ADD COLUMN transaction_date DATE NOT NULL DEFAULT (CURRENT_DATE())");
                var indexExists = await _db.ExecuteScalarAsync<int>(
                    "SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='transactions' AND INDEX_NAME='idx_transactions_transaction_date'"
                );
                if (indexExists == 0)
                {
                    await _db.ExecuteAsync("CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date)");
                }
            }
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] string? type, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            await EnsureTransactionSchema();

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

            await EnsureTransactionSchema();

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

            // Atualizar saldo em mãos automaticamente
            var adjustmentAmount = dto.Type == "income" ? dto.Amount : -dto.Amount;
            var balanceSql = @"
                INSERT INTO user_balance (user_id, balance, currency, updated_at) 
                VALUES (@UserId, @Amount, @Currency, NOW())
                ON DUPLICATE KEY UPDATE 
                    balance = balance + @Amount, 
                    updated_at = NOW()";

            await _db.ExecuteAsync(balanceSql, new
            {
                UserId = userId,
                Amount = adjustmentAmount,
                Currency = dto.Currency ?? "BRL"
            });

            var row = await _db.QueryFirstOrDefaultAsync("SELECT * FROM transactions WHERE id = @Id", new { Id = id });
            return Created($"/api/transactions/{id}", row);
        }

        public record CreateTransactionDto(long AccountId, string Type, decimal Amount, string? Currency, DateTime? TransactionDate, string? Status, string? Title, string? Category);
    }
}