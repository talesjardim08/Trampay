using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/accounts")]
    public class AccountsController : ControllerBase
    {
        private readonly IDbConnection _db;
        public AccountsController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List()
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();
            var sql = "SELECT id, owner_user_id, name, currency, balance, metadata, created_at, updated_at FROM accounts WHERE owner_user_id = @UserId";
            var rows = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(rows);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateAccountDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();
            var sql = @"INSERT INTO accounts (owner_user_id, name, currency, balance, metadata, created_at) 
                        VALUES (@Owner, @Name, @Currency, @Balance, @Metadata, NOW()); SELECT LAST_INSERT_ID();";

            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                Name = dto.Name,
                Currency = dto.Currency ?? "BRL",
                Balance = dto.Balance,
                Metadata = dto.Metadata
            });

            var created = await _db.QueryFirstOrDefaultAsync("SELECT * FROM accounts WHERE id = @Id", new { Id = id });
            return CreatedAtAction(nameof(GetById), new { id }, created);
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();
            var sql = "SELECT * FROM accounts WHERE id = @Id AND owner_user_id = @UserId LIMIT 1";
            var acc = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id, UserId = userId });
            if (acc == null) return NotFound();
            return Ok(acc);
        }

        public record CreateAccountDto(string Name, string? Currency, decimal Balance = 0, string? Metadata = null);
    }
}
