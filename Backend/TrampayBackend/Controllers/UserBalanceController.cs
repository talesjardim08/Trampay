using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using Dapper;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserBalanceController : ControllerBase
    {
        private readonly IDbConnection _db;

        public UserBalanceController(IDbConnection db)
        {
            _db = db;
        }

        // ================================
        // GET /api/users/balance
        // ================================
        [Authorize]
        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance([FromQuery] string currency = "BRL")
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { error = "Usuário não autenticado" });

            currency = NormalizeCurrency(currency);

            var balance = await _db.QueryFirstOrDefaultAsync<decimal?>(@"
                SELECT balance 
                FROM user_balance
                WHERE user_id = @UserId AND currency = @Currency
                LIMIT 1
            ", new { UserId = userId, Currency = currency });

            return Ok(new
            {
                balance = balance ?? 0.00m,
                currency,
                userId
            });
        }

        // ================================
        // PUT /api/users/balance  (SET saldo)
        // ================================
        [Authorize]
        [HttpPut("balance")]
        public async Task<IActionResult> UpdateBalance([FromBody] UpdateBalanceDto dto)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { error = "Usuário não autenticado" });

            if (dto == null)
                return BadRequest(new { error = "Dados inválidos" });

            var currency = NormalizeCurrency(dto.Currency ?? "BRL");

            await _db.ExecuteAsync(@"
                INSERT INTO user_balance (user_id, balance, currency)
                VALUES (@UserId, @Balance, @Currency)
                ON DUPLICATE KEY UPDATE
                    balance = @Balance,
                    updated_at = NOW()
            ", new { UserId = userId, dto.Balance, Currency = currency });

            return Ok(new
            {
                success = true,
                balance = dto.Balance,
                currency,
                userId,
                message = "Saldo atualizado com sucesso"
            });
        }

        // ================================
        // PATCH /api/users/balance/adjust  (ADD / SUB saldo)
        // ================================
        [Authorize]
        [HttpPatch("balance/adjust")]
        public async Task<IActionResult> AdjustBalance([FromBody] AdjustBalanceDto dto)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { error = "Usuário não autenticado" });

            if (dto == null || dto.Amount == 0)
                return BadRequest(new { error = "Valor inválido" });

            var currency = NormalizeCurrency(dto.Currency ?? "BRL");

            await _db.ExecuteAsync(@"
                INSERT INTO user_balance (user_id, balance, currency)
                VALUES (@UserId, @Amount, @Currency)
                ON DUPLICATE KEY UPDATE
                    balance = balance + @Amount,
                    updated_at = NOW()
            ", new { UserId = userId, dto.Amount, Currency = currency });

            var newBalance = await _db.QueryFirstOrDefaultAsync<decimal>(@"
                SELECT balance
                FROM user_balance
                WHERE user_id = @UserId AND currency = @Currency
                LIMIT 1
            ", new { UserId = userId, Currency = currency });

            return Ok(new
            {
                success = true,
                adjustment = dto.Amount,
                newBalance,
                currency,
                userId,
                message = dto.Amount > 0 ? "Saldo adicionado" : "Saldo subtraído"
            });
        }

        // ================================
        // FUNÇÕES AUXILIARES
        // ================================
        private long? GetUserId()
        {
            var claim = User.FindFirst("id")?.Value;
            if (long.TryParse(claim, out var id))
                return id;
            return null;
        }

        private string NormalizeCurrency(string currency)
        {
            currency = currency.Trim().ToUpper();
            if (currency.Length != 3)
                throw new Exception("Moeda deve ter 3 caracteres (BRL, USD...)");
            return currency;
        }
    }

    public class UpdateBalanceDto
    {
        public decimal Balance { get; set; }
        public string? Currency { get; set; }
    }

    public class AdjustBalanceDto
    {
        public decimal Amount { get; set; }
        public string? Currency { get; set; }
    }
}
