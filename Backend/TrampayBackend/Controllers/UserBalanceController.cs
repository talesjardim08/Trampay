using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using Dapper;
using System.Threading.Tasks;

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

        // GET /api/users/balance - Obtém saldo em mãos do usuário
        [Authorize]
        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance([FromQuery] string currency = "BRL")
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { error = "Usuário não autenticado" });

            if (!long.TryParse(userIdClaim, out long userId))
                return BadRequest(new { error = "ID de usuário inválido" });

            // Normalize currency
            currency = currency.Trim().ToUpper();
            if (currency.Length != 3)
                return BadRequest(new { error = "Currency deve ter 3 caracteres (ex: BRL, USD)" });

            try
            {
                var balance = await _db.QueryFirstOrDefaultAsync<decimal?>(@"
                    SELECT balance 
                    FROM user_balance 
                    WHERE user_id = @UserId AND currency = @Currency 
                    LIMIT 1",
                    new { UserId = userId, Currency = currency });

                // Se não existir registro, retorna 0
                return Ok(new { 
                    balance = balance ?? 0.00m, 
                    currency = currency,
                    userId = userId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserBalance] Erro ao buscar saldo: {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao buscar saldo");
            }
        }

        // PUT /api/users/balance - Atualiza saldo em mãos do usuário (override completo)
        [Authorize]
        [HttpPut("balance")]
        public async Task<IActionResult> UpdateBalance([FromBody] UpdateBalanceDto dto)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { error = "Usuário não autenticado" });

            if (!long.TryParse(userIdClaim, out long userId))
                return BadRequest(new { error = "ID de usuário inválido" });

            if (dto == null)
                return BadRequest(new { error = "Dados inválidos" });

            // Normalize currency
            var currency = string.IsNullOrEmpty(dto.Currency) ? "BRL" : dto.Currency.Trim().ToUpper();
            if (currency.Length != 3)
                return BadRequest(new { error = "Currency deve ter 3 caracteres (ex: BRL, USD)" });

            try
            {
                // Usa INSERT ... ON DUPLICATE KEY UPDATE para criar ou atualizar
                var sql = @"
                    INSERT INTO user_balance (user_id, balance, currency, updated_at) 
                    VALUES (@UserId, @Balance, @Currency, NOW())
                    ON DUPLICATE KEY UPDATE 
                        balance = @Balance, 
                        updated_at = NOW()";

                await _db.ExecuteAsync(sql, new
                {
                    UserId = userId,
                    Balance = dto.Balance,
                    Currency = currency
                });

                return Ok(new
                {
                    success = true,
                    balance = dto.Balance,
                    currency = currency,
                    userId = userId,
                    message = "Saldo atualizado com sucesso"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserBalance] Erro ao atualizar saldo: {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao atualizar saldo");
            }
        }

        // PATCH /api/users/balance/adjust - Ajusta saldo (adiciona ou subtrai) - ATOMIC
        [Authorize]
        [HttpPatch("balance/adjust")]
        public async Task<IActionResult> AdjustBalance([FromBody] AdjustBalanceDto dto)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { error = "Usuário não autenticado" });

            if (!long.TryParse(userIdClaim, out long userId))
                return BadRequest(new { error = "ID de usuário inválido" });

            if (dto == null || dto.Amount == 0)
                return BadRequest(new { error = "Valor de ajuste inválido" });

            // Normalize currency: uppercase, 3 chars
            var currency = string.IsNullOrEmpty(dto.Currency) ? "BRL" : dto.Currency.Trim().ToUpper();
            if (currency.Length != 3)
                return BadRequest(new { error = "Currency deve ter 3 caracteres (ex: BRL, USD)" });

            try
            {
                // ATOMIC update: increment/decrement balance directly in SQL
                var sql = @"
                    INSERT INTO user_balance (user_id, balance, currency, updated_at) 
                    VALUES (@UserId, @Amount, @Currency, NOW())
                    ON DUPLICATE KEY UPDATE 
                        balance = balance + @Amount, 
                        updated_at = NOW()";

                await _db.ExecuteAsync(sql, new
                {
                    UserId = userId,
                    Amount = dto.Amount,
                    Currency = currency
                });

                // Fetch updated balance for response
                var newBalance = await _db.QueryFirstOrDefaultAsync<decimal>(@"
                    SELECT balance 
                    FROM user_balance 
                    WHERE user_id = @UserId AND currency = @Currency 
                    LIMIT 1",
                    new { UserId = userId, Currency = currency });

                return Ok(new
                {
                    success = true,
                    adjustment = dto.Amount,
                    newBalance = newBalance,
                    currency = currency,
                    userId = userId,
                    message = dto.Amount > 0 ? "Saldo adicionado" : "Saldo subtraído"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserBalance] Erro ao ajustar saldo: {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao ajustar saldo");
            }
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
