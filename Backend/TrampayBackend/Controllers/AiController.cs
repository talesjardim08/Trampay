using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TrampayBackend.Services;
using System.Data;
using Dapper;
using System;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly AiService _aiService;
        private readonly IDbConnection _db;

        public AiController(AiService aiService, IDbConnection db)
        {
            _aiService = aiService;
            _db = db;
        }

        [Authorize]
        [HttpPost("chat")]
        public async Task<IActionResult> PostChat([FromBody] AiChatRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!long.TryParse(userIdClaim, out var userId)) return Unauthorized();

            // Create or use chat_id
            long chatId = request.ChatId ?? 0;
            if (chatId == 0)
            {
                // create chat
                var insertChatSql = "INSERT INTO ai_chats (user_id, title) VALUES (@userId, @title); SELECT LAST_INSERT_ID();";
                chatId = await _db.ExecuteScalarAsync<long>(insertChatSql, new { userId, title = request.Title ?? "Chat IA" });
            }

            // Save user message
            var insertMsgSql = @"INSERT INTO ai_messages (chat_id, user_id, role, content, metadata) 
                                 VALUES (@chatId, @userId, @role, @content, @metadata)";
            await _db.ExecuteAsync(insertMsgSql, new { chatId, userId, role = "user", content = request.Message, metadata = (string?)null });

            // Call AI service to get response
            var aiResponse = await _aiService.GetChatResponseAsync(request.Message);

            // Save assistant response
            await _db.ExecuteAsync(insertMsgSql, new { chatId, userId = (long?)null, role = "assistant", content = aiResponse, metadata = (string?)null });

            return Ok(new { chatId, response = aiResponse });
        }

        [Authorize]
        [HttpGet("chats")]
        public async Task<IActionResult> GetChats()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!long.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var sql = @"SELECT c.id, c.title, c.created_at, c.updated_at, 
                               (SELECT COUNT(*) FROM ai_messages m WHERE m.chat_id = c.id) as message_count
                        FROM ai_chats c
                        WHERE c.user_id = @userId
                        ORDER BY c.updated_at DESC";
            var chats = await _db.QueryAsync(sql, new { userId });
            return Ok(chats);
        }

        [Authorize]
        [HttpGet("chats/{chatId}/messages")]
        public async Task<IActionResult> GetChatMessages(long chatId)
        {
            // Optionally check ownership
            var messagesSql = @"SELECT id, chat_id, user_id, role, content, metadata, created_at
                                FROM ai_messages
                                WHERE chat_id = @chatId
                                ORDER BY id ASC";
            var messages = await _db.QueryAsync(messagesSql, new { chatId });
            return Ok(messages);
        }

        [Authorize]
        [HttpPost("image")]
        public async Task<IActionResult> PostImage([FromForm] ImageAnalyzeRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!long.TryParse(userIdClaim, out var userId)) return Unauthorized();

            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { message = "Arquivo não enviado" });

            // Call AiService OCR
            var ocrResult = await _aiService.AnalyzeImageAsync(request.File);

            // You may want to save the OCR as a message in a chat
            // Create chat and message
            var insertChatSql = "INSERT INTO ai_chats (user_id, title) VALUES (@userId, @title); SELECT LAST_INSERT_ID();";
            var chatId = await _db.ExecuteScalarAsync<long>(insertChatSql, new { userId, title = "OCR - " + DateTime.UtcNow.ToString("s") });

            var insertMsgSql = @"INSERT INTO ai_messages (chat_id, user_id, role, content, metadata) 
                                 VALUES (@chatId, @userId, @role, @content, @metadata)";
            await _db.ExecuteAsync(insertMsgSql, new { chatId, userId, role = "user", content = "[Imagem enviada para OCR]", metadata = (string?)null });
            await _db.ExecuteAsync(insertMsgSql, new { chatId, userId = (long?)null, role = "assistant", content = ocrResult, metadata = (string?)null });

            return Ok(new { chatId, ocr = ocrResult });
        }
    }

    // Request DTOs
    public class AiChatRequest
    {
        public long? ChatId { get; set; } 
        public string? Title { get; set; }
        public string Message { get; set; } = null!;
    }

    public class ImageAnalyzeRequest
    {
        public Microsoft.AspNetCore.Http.IFormFile? File { get; set; }
    }
}
