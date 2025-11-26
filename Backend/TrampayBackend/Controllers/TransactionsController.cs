using System;
using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/transactions")]
    public class TransactionsController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly ILogger<TransactionsController> _logger;

        public TransactionsController(IDbConnection db, ILogger<TransactionsController> logger)
        {
            _db = db;
            _logger = logger;
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

        // ---------------------------------------------------------------------
        // CALCULAR SALDO
        // ---------------------------------------------------------------------
        [HttpGet("calculate-balance")]
        [Authorize]
        public async Task<IActionResult> CalculateBalance()
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = @"
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'income' AND status = 'concluído' THEN amount ELSE 0 END), 0) as TotalIncome,
                    COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'concluído' THEN ABS(amount) ELSE 0 END), 0) as TotalExpenses
                FROM transactions
                WHERE owner_user_id = @UserId AND currency = 'BRL'";

            var result = await _db.QueryFirstOrDefaultAsync<dynamic>(sql, new { UserId = userId });

            decimal totalIncome = result?.TotalIncome ?? 0;
            decimal totalExpenses = result?.TotalExpenses ?? 0;
            decimal calculatedBalance = totalIncome - totalExpenses;

            await _db.ExecuteAsync(@"
                CREATE TABLE IF NOT EXISTS user_balance (
                    user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
                    balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    currency CHAR(3) NOT NULL DEFAULT 'BRL',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )");

            await _db.ExecuteAsync(@"
                INSERT INTO user_balance (user_id, balance, currency, updated_at) 
                VALUES (@UserId, @Balance, 'BRL', NOW())
                ON DUPLICATE KEY UPDATE 
                    balance = @Balance, 
                    updated_at = NOW()",
                new { UserId = userId, Balance = calculatedBalance });

            return Ok(new
            {
                totalIncome,
                totalExpenses,
                balance = calculatedBalance,
                currency = "BRL"
            });
        }

        // ---------------------------------------------------------------------
        // LISTAR TRANSAÇÕES - CORRIGIDO: Usa 'title' e 'notes' ao invés de 'description'
        // ---------------------------------------------------------------------
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] string? type, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            await EnsureTransactionSchema();

            var sql = @"SELECT id, owner_user_id, account_id, title, notes, type, amount, category, 
                               currency, transaction_date, status, created_at, updated_at 
                        FROM transactions 
                        WHERE owner_user_id = @UserId
                        AND (@Type IS NULL OR type = @Type)
                        AND (@From IS NULL OR transaction_date >= @From)
                        AND (@To IS NULL OR transaction_date <= @To)
                        ORDER BY transaction_date DESC, created_at DESC";

            var rows = await _db.QueryAsync(sql, new { UserId = userId, Type = type, From = from, To = to });
            
            // Mapear para formato esperado pelo frontend
            var mapped = rows.Select(r => new
            {
                id = r.id,
                owner_user_id = r.owner_user_id,
                account_id = r.account_id,
                title = r.title,
                description = r.notes ?? r.title, // CORREÇÃO: mapeia notes para description
                type = r.type,
                amount = r.amount,
                category = r.category,
                currency = r.currency,
                transaction_date = r.transaction_date,
                status = r.status,
                created_at = r.created_at,
                updated_at = r.updated_at
            });

            return Ok(mapped);
        }

        // ---------------------------------------------------------------------
        // CRIAR TRANSAÇÃO - CORRIGIDO: Sinais corretos e mapeamento de campos
        // ---------------------------------------------------------------------
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateTransactionDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            await EnsureTransactionSchema();

            // CORREÇÃO CRÍTICA: Garantir sinais corretos
            decimal amount = Math.Abs(dto.Amount); // Sempre trabalhar com valor absoluto
            
            // Income = positivo, Expense = negativo no banco
            if (dto.Type == "expense")
            {
                amount = -amount;
            }

            var sql = @"INSERT INTO transactions (owner_user_id, account_id, title, notes, type, amount, 
                                              category, currency, transaction_date, status, created_at)
                        VALUES (@Owner, @Account, @Title, @Notes, @Type, @Amount, @Category, @Currency, 
                                @Date, @Status, NOW());
                        SELECT LAST_INSERT_ID();";

            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                Account = dto.AccountId,
                Title = dto.Title ?? dto.Description ?? "Transação",
                Notes = dto.Description ?? dto.Title ?? "", // CORREÇÃO: mapeia description para notes
                Type = dto.Type,
                Amount = amount, // Usa o amount já com sinal correto
                Category = dto.Category ?? "Outros",
                Currency = dto.Currency ?? "BRL",
                Date = dto.TransactionDate?.Date ?? DateTime.UtcNow.Date,
                Status = "concluído"
            });

            // AJUSTAR SALDO - CORREÇÃO: Usa valor absoluto para cálculo
            if ((dto.Currency ?? "BRL") == "BRL")
            {
                var adjustmentAmount = dto.Type == "income" ? Math.Abs(dto.Amount) : -Math.Abs(dto.Amount);

                await _db.ExecuteAsync(@"
                    CREATE TABLE IF NOT EXISTS user_balance (
                        user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
                        balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                        currency CHAR(3) NOT NULL DEFAULT 'BRL',
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )");

                var balanceSql = @"
                    INSERT INTO user_balance (user_id, balance, currency, updated_at) 
                    VALUES (@UserId, @Amount, 'BRL', NOW())
                    ON DUPLICATE KEY UPDATE 
                        balance = balance + @Amount, 
                        updated_at = NOW()";

                await _db.ExecuteAsync(balanceSql, new
                {
                    UserId = userId,
                    Amount = adjustmentAmount
                });

                _logger.LogInformation($"Saldo ajustado: userId={userId}, adjustment={adjustmentAmount}");
            }

            var row = await _db.QueryFirstOrDefaultAsync("SELECT * FROM transactions WHERE id = @Id", new { Id = id });
            
            // Mapear resposta para formato esperado pelo frontend
            var response = new
            {
                id = row.id,
                owner_user_id = row.owner_user_id,
                account_id = row.account_id,
                title = row.title,
                description = row.notes ?? row.title, // CORREÇÃO
                type = row.type,
                amount = row.amount,
                category = row.category,
                currency = row.currency,
                transaction_date = row.transaction_date,
                status = row.status,
                created_at = row.created_at,
                updated_at = row.updated_at
            };

            return Created($"/api/transactions/{id}", response);
        }

        // ---------------------------------------------------------------------
        // OBTER TRANSAÇÃO POR ID
        // ---------------------------------------------------------------------
        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var sql = "SELECT * FROM transactions WHERE id = @Id AND owner_user_id = @UserId LIMIT 1";
            var transaction = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id, UserId = userId });

            if (transaction == null) return NotFound();

            // Mapear para formato esperado
            var response = new
            {
                id = transaction.id,
                owner_user_id = transaction.owner_user_id,
                account_id = transaction.account_id,
                title = transaction.title,
                description = transaction.notes ?? transaction.title,
                type = transaction.type,
                amount = transaction.amount,
                category = transaction.category,
                currency = transaction.currency,
                transaction_date = transaction.transaction_date,
                status = transaction.status,
                created_at = transaction.created_at,
                updated_at = transaction.updated_at
            };

            return Ok(response);
        }

        // ---------------------------------------------------------------------
        // DELETAR TRANSAÇÃO
        // ---------------------------------------------------------------------
        [HttpDelete("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            var transaction = await _db.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT amount, type, currency, status FROM transactions WHERE id = @Id AND owner_user_id = @UserId",
                new { Id = id, UserId = userId });

            if (transaction == null) return NotFound();

            await _db.ExecuteAsync(
                "DELETE FROM transactions WHERE id = @Id AND owner_user_id = @UserId",
                new { Id = id, UserId = userId });

            if (transaction.currency == "BRL" && transaction.status == "concluído")
            {
                // CORREÇÃO: Reverter ajuste de saldo corretamente
                var adjustmentAmount = transaction.type == "income" ? -Math.Abs((decimal)transaction.amount) : Math.Abs((decimal)transaction.amount);

                await _db.ExecuteAsync(@"
                    UPDATE user_balance 
                    SET balance = balance + @Amount, updated_at = NOW()
                    WHERE user_id = @UserId AND currency = 'BRL'",
                    new { Amount = adjustmentAmount, UserId = userId }
                );
            }

            return NoContent();
        }

        // ---------------------------------------------------------------------
        // DTO - CORRIGIDO
        // ---------------------------------------------------------------------
        public record CreateTransactionDto(
            long? AccountId,
            string? Title,
            string? Description,
            string Type,
            decimal Amount,
            string? Currency,
            DateTime? TransactionDate,
            string? Status,
            string? Category,
            string? Metadata
        );
    }
}