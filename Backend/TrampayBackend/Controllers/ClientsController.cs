using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/clients")]
    public class ClientsController : ControllerBase
    {
        private readonly IDbConnection _db;
        public ClientsController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var offset = (page - 1) * pageSize;
            var sql = @"SELECT id, name, contact_email, contact_phone, notes, created_at, updated_at
                        FROM clients
                        WHERE owner_user_id = @Owner
                        ORDER BY created_at DESC
                        LIMIT @Limit OFFSET @Offset";
            var rows = await _db.QueryAsync(sql, new { Owner = userId, Limit = pageSize, Offset = offset });
            return Ok(new { page, pageSize, items = rows });
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Get(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "SELECT * FROM clients WHERE id = @Id AND owner_user_id = @Owner LIMIT 1";
            var c = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id, Owner = userId });
            if (c == null) return NotFound();
            return Ok(c);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"INSERT INTO clients (owner_user_id, name, contact_email, contact_phone, notes, created_at)
                        VALUES (@Owner, @Name, @Email, @Phone, @Notes, NOW());
                        SELECT LAST_INSERT_ID();";
            var id = await _db.ExecuteScalarAsync<long>(sql, new { Owner = userId, Name = dto.Name, Email = dto.ContactEmail, Phone = dto.ContactPhone, Notes = dto.Notes });
            var created = await _db.QueryFirstOrDefaultAsync("SELECT * FROM clients WHERE id = @Id", new { Id = id });
            return Created($"/api/clients/{id}", created);
        }

        [HttpPut("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateClientDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"UPDATE clients SET name=@Name, contact_email=@Email, contact_phone=@Phone, notes=@Notes, updated_at=NOW()
                        WHERE id=@Id AND owner_user_id=@Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId, Name = dto.Name, Email = dto.ContactEmail, Phone = dto.ContactPhone, Notes = dto.Notes });
            if (rows == 0) return NotFound();
            var updated = await _db.QueryFirstOrDefaultAsync("SELECT * FROM clients WHERE id = @Id", new { Id = id });
            return Ok(updated);
        }

        [HttpDelete("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "DELETE FROM clients WHERE id = @Id AND owner_user_id = @Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId });
            if (rows == 0) return NotFound();
            return NoContent();
        }

        public record CreateClientDto(string Name, string? ContactEmail, string? ContactPhone, string? Notes);
        public record UpdateClientDto(string Name, string? ContactEmail, string? ContactPhone, string? Notes);
    }
}
