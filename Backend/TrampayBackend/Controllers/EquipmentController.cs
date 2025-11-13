using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/equipment")]
    public class EquipmentController : ControllerBase
    {
        private readonly IDbConnection _db;
        public EquipmentController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? status = null)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var offset = (page - 1) * pageSize;
            var sql = @"SELECT id, name, description, category, purchase_date, purchase_price, status, photo_url, created_at, updated_at
                        FROM equipment
                        WHERE owner_user_id = @Owner" +
                        (string.IsNullOrEmpty(status) ? "" : " AND status = @Status") +
                        @" ORDER BY created_at DESC
                        LIMIT @Limit OFFSET @Offset";
            var rows = await _db.QueryAsync(sql, new { Owner = userId, Status = status, Limit = pageSize, Offset = offset });
            return Ok(new { page, pageSize, items = rows });
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Get(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "SELECT * FROM equipment WHERE id = @Id AND owner_user_id = @Owner LIMIT 1";
            var item = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id, Owner = userId });
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateEquipmentDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"INSERT INTO equipment (owner_user_id, name, description, category, purchase_date, purchase_price, status, photo_url, created_at)
                        VALUES (@Owner, @Name, @Description, @Category, @PurchaseDate, @PurchasePrice, @Status, @PhotoUrl, NOW());
                        SELECT LAST_INSERT_ID();";
            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category ?? "Equipamento",
                PurchaseDate = dto.PurchaseDate,
                PurchasePrice = dto.PurchasePrice ?? 0,
                Status = dto.Status ?? "active",
                PhotoUrl = dto.PhotoUrl
            });
            var created = await _db.QueryFirstOrDefaultAsync("SELECT * FROM equipment WHERE id = @Id", new { Id = id });
            return Created($"/api/equipment/{id}", created);
        }

        [HttpPut("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateEquipmentDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"UPDATE equipment 
                        SET name=@Name, description=@Description, category=@Category, purchase_date=@PurchaseDate, 
                            purchase_price=@PurchasePrice, status=@Status, photo_url=@PhotoUrl, updated_at=NOW()
                        WHERE id=@Id AND owner_user_id=@Owner";
            var rows = await _db.ExecuteAsync(sql, new
            {
                Id = id,
                Owner = userId,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                PurchaseDate = dto.PurchaseDate,
                PurchasePrice = dto.PurchasePrice,
                Status = dto.Status,
                PhotoUrl = dto.PhotoUrl
            });
            if (rows == 0) return NotFound();
            var updated = await _db.QueryFirstOrDefaultAsync("SELECT * FROM equipment WHERE id = @Id", new { Id = id });
            return Ok(updated);
        }

        [HttpDelete("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "DELETE FROM equipment WHERE id = @Id AND owner_user_id = @Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId });
            if (rows == 0) return NotFound();
            return NoContent();
        }

        public record CreateEquipmentDto(string Name, string? Description, string? Category, DateTime? PurchaseDate, decimal? PurchasePrice, string? Status, string? PhotoUrl);
        public record UpdateEquipmentDto(string Name, string? Description, string? Category, DateTime? PurchaseDate, decimal? PurchasePrice, string? Status, string? PhotoUrl);
    }
}
