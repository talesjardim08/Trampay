using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using Dapper;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly string _uploadsPath;

        public FilesController(IDbConnection db)
        {
            _db = db;
            _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(_uploadsPath))
                Directory.CreateDirectory(_uploadsPath);
        }

        [HttpPost("upload")]
        [Authorize]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId))
                return Unauthorized();

            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Nenhum arquivo enviado" });

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(_uploadsPath, fileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var sql = @"INSERT INTO files (owner_user_id, file_name, file_path, mime_type, file_size, created_at)
                        VALUES (@Owner, @Name, @Path, @Type, @Size, NOW());";
            await _db.ExecuteAsync(sql, new
            {
                Owner = userId,
                Name = file.FileName,
                Path = $"/uploads/{fileName}",
                Type = file.ContentType,
                Size = file.Length
            });

            return Ok(new
            {
                file = new
                {
                    url = $"/uploads/{fileName}",
                    name = file.FileName,
                    size = file.Length
                }
            });
        }
    }
}
