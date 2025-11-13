using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/inventory")]
    public class InventoryController : ControllerBase
    {
        private readonly IDbConnection _db;
        public InventoryController(IDbConnection db) => _db = db;

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? category = null)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var offset = (page - 1) * pageSize;
            var sql = @"SELECT id, name, description, category, quantity, unit, cost_price, selling_price, min_stock, photo_url, created_at, updated_at
                        FROM inventory_items
                        WHERE owner_user_id = @Owner" +
                        (string.IsNullOrEmpty(category) ? "" : " AND category = @Category") +
                        @" ORDER BY created_at DESC
                        LIMIT @Limit OFFSET @Offset";
            var rows = await _db.QueryAsync(sql, new { Owner = userId, Category = category, Limit = pageSize, Offset = offset });
            return Ok(new { page, pageSize, items = rows });
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Get(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "SELECT * FROM inventory_items WHERE id = @Id AND owner_user_id = @Owner LIMIT 1";
            var item = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id, Owner = userId });
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateInventoryDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"INSERT INTO inventory_items (owner_user_id, name, description, category, quantity, unit, cost_price, selling_price, min_stock, photo_url, created_at)
                        VALUES (@Owner, @Name, @Description, @Category, @Quantity, @Unit, @CostPrice, @SellingPrice, @MinStock, @PhotoUrl, NOW());
                        SELECT LAST_INSERT_ID();";
            var id = await _db.ExecuteScalarAsync<long>(sql, new
            {
                Owner = userId,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category ?? "Geral",
                Quantity = dto.Quantity ?? 0,
                Unit = dto.Unit ?? "un",
                CostPrice = dto.CostPrice ?? 0,
                SellingPrice = dto.SellingPrice ?? 0,
                MinStock = dto.MinStock ?? 0,
                PhotoUrl = dto.PhotoUrl
            });
            var created = await _db.QueryFirstOrDefaultAsync("SELECT * FROM inventory_items WHERE id = @Id", new { Id = id });
            return Created($"/api/inventory/{id}", created);
        }

        [HttpPut("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateInventoryDto dto)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"UPDATE inventory_items 
                        SET name=@Name, description=@Description, category=@Category, quantity=@Quantity, unit=@Unit, 
                            cost_price=@CostPrice, selling_price=@SellingPrice, min_stock=@MinStock, photo_url=@PhotoUrl, updated_at=NOW()
                        WHERE id=@Id AND owner_user_id=@Owner";
            var rows = await _db.ExecuteAsync(sql, new
            {
                Id = id,
                Owner = userId,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                Quantity = dto.Quantity,
                Unit = dto.Unit,
                CostPrice = dto.CostPrice,
                SellingPrice = dto.SellingPrice,
                MinStock = dto.MinStock,
                PhotoUrl = dto.PhotoUrl
            });
            if (rows == 0) return NotFound();
            var updated = await _db.QueryFirstOrDefaultAsync("SELECT * FROM inventory_items WHERE id = @Id", new { Id = id });
            return Ok(updated);
        }

        [HttpDelete("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = "DELETE FROM inventory_items WHERE id = @Id AND owner_user_id = @Owner";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, Owner = userId });
            if (rows == 0) return NotFound();
            return NoContent();
        }

        [HttpGet("low-stock")]
        [Authorize]
        public async Task<IActionResult> GetLowStock()
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"SELECT * FROM inventory_items 
                        WHERE owner_user_id = @Owner AND quantity <= min_stock 
                        ORDER BY quantity ASC";
            var items = await _db.QueryAsync(sql, new { Owner = userId });
            return Ok(items);
        }

        public record CreateInventoryDto(string Name, string? Description, string? Category, int? Quantity, string? Unit, decimal? CostPrice, decimal? SellingPrice, int? MinStock, string? PhotoUrl);
        public record UpdateInventoryDto(string Name, string? Description, string? Category, int? Quantity, string? Unit, decimal? CostPrice, decimal? SellingPrice, int? MinStock, string? PhotoUrl);
    }
}
