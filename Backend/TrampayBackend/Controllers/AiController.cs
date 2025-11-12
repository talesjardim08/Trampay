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
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!long.TryParse(userIdClaim, out var userId)) 
                    return Unauthorized(new { error = "Token inválido" });

                // Verificar se usuário é premium (obrigatório para usar IA)
                var isPremium = await _db.QueryFirstOrDefaultAsync<bool?>(
                    "SELECT is_premium FROM users WHERE id = @userId AND (premium_until IS NULL OR premium_until > NOW()) LIMIT 1",
                    new { userId });

                if (isPremium != true)
                    return Forbid(); // Ou retornar 403 com mensagem customizada

                // Validar mensagem
                if (string.IsNullOrWhiteSpace(request.Message))
                    return BadRequest(new { error = "Mensagem é obrigatória" });

                // Create or use chat_id
                long chatId = request.ChatId ?? 0;
                if (chatId == 0)
                {
                    var insertChatSql = "INSERT INTO ai_chats (user_id, title) VALUES (@userId, @title); SELECT LAST_INSERT_ID();";
                    chatId = await _db.ExecuteScalarAsync<long>(insertChatSql, new { userId, title = request.Title ?? "Chat IA" });
                }
                else
                {
                    // Verificar se o chat pertence ao usuário
                    var chatOwner = await _db.QueryFirstOrDefaultAsync<long?>(
                        "SELECT user_id FROM ai_chats WHERE id = @chatId LIMIT 1",
                        new { chatId });

                    if (chatOwner != userId)
                        return Forbid();
                }

                // Save user message
                var insertMsgSql = @"INSERT INTO ai_messages (chat_id, user_id, role, content, metadata) 
                                     VALUES (@chatId, @userId, @role, @content, @metadata)";
                await _db.ExecuteAsync(insertMsgSql, new { chatId, userId, role = "user", content = request.Message, metadata = (string?)null });

                // Call AI service to get response
                var aiResponse = await _aiService.GetChatResponseAsync(request.Message);

                // Save assistant response
                await _db.ExecuteAsync(insertMsgSql, new { chatId, userId = (long?)null, role = "assistant", content = aiResponse, metadata = (string?)null });

                // Update chat updated_at
                await _db.ExecuteAsync("UPDATE ai_chats SET updated_at = NOW() WHERE id = @chatId", new { chatId });

                return Ok(new { chatId, response = aiResponse });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AI/CHAT ERROR] {ex.Message}\n{ex.StackTrace}");
                return Problem(detail: ex.Message, title: "Erro ao processar chat");
            }
        }

        [Authorize]
        [HttpGet("chats")]
        public async Task<IActionResult> GetChats()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!long.TryParse(userIdClaim, out var userId)) 
                    return Unauthorized(new { error = "Token inválido" });

                var sql = @"SELECT c.id, c.title, c.created_at, c.updated_at, 
                                   (SELECT COUNT(*) FROM ai_messages m WHERE m.chat_id = c.id) as message_count
                            FROM ai_chats c
                            WHERE c.user_id = @userId
                            ORDER BY c.updated_at DESC";
                var chats = await _db.QueryAsync(sql, new { userId });
                return Ok(chats);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AI/CHATS ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao buscar chats");
            }
        }

        [Authorize]
        [HttpGet("chats/{chatId}")]
        public async Task<IActionResult> GetChat(long chatId)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!long.TryParse(userIdClaim, out var userId)) 
                    return Unauthorized(new { error = "Token inválido" });

                // Verificar se o chat pertence ao usuário
                var chat = await _db.QueryFirstOrDefaultAsync(
                    "SELECT * FROM ai_chats WHERE id = @chatId AND user_id = @userId LIMIT 1",
                    new { chatId, userId });

                if (chat == null)
                    return NotFound(new { error = "Chat não encontrado" });

                return Ok(chat);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AI/CHAT ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao buscar chat");
            }
        }

        [Authorize]
        [HttpGet("chats/{chatId}/messages")]
        public async Task<IActionResult> GetChatMessages(long chatId)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!long.TryParse(userIdClaim, out var userId)) 
                    return Unauthorized(new { error = "Token inválido" });

                // Verificar se o chat pertence ao usuário
                var chatOwner = await _db.QueryFirstOrDefaultAsync<long?>(
                    "SELECT user_id FROM ai_chats WHERE id = @chatId LIMIT 1",
                    new { chatId });

                if (chatOwner != userId)
                    return Forbid();

                var messagesSql = @"SELECT id, chat_id, user_id, role, content, metadata, created_at
                                    FROM ai_messages
                                    WHERE chat_id = @chatId
                                    ORDER BY id ASC";
                var messages = await _db.QueryAsync(messagesSql, new { chatId });
                return Ok(messages);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AI/MESSAGES ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao buscar mensagens");
            }
        }

        [Authorize]
        [HttpDelete("chats/{chatId}")]
        public async Task<IActionResult> DeleteChat(long chatId)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!long.TryParse(userIdClaim, out var userId)) 
                    return Unauthorized(new { error = "Token inválido" });

                // Deletar chat (cascade irá deletar mensagens automaticamente)
                var affected = await _db.ExecuteAsync(
                    "DELETE FROM ai_chats WHERE id = @chatId AND user_id = @userId",
                    new { chatId, userId });

                if (affected == 0)
                    return NotFound(new { error = "Chat não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AI/DELETE ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao deletar chat");
            }
        }

        [Authorize]
        [HttpPost("image")]
        public async Task<IActionResult> PostImage([FromForm] ImageAnalyzeRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!long.TryParse(userIdClaim, out var userId)) 
                    return Unauthorized(new { error = "Token inválido" });

                // Verificar se usuário é premium
                var isPremium = await _db.QueryFirstOrDefaultAsync<bool?>(
                    "SELECT is_premium FROM users WHERE id = @userId AND (premium_until IS NULL OR premium_until > NOW()) LIMIT 1",
                    new { userId });

                if (isPremium != true)
                    return Forbid();

                if (request.File == null || request.File.Length == 0)
                    return BadRequest(new { message = "Arquivo não enviado" });

                // Call AiService OCR
                var ocrResult = await _aiService.AnalyzeImageAsync(request.File);

                // Save OCR result as a chat
                var insertChatSql = "INSERT INTO ai_chats (user_id, title) VALUES (@userId, @title); SELECT LAST_INSERT_ID();";
                var chatId = await _db.ExecuteScalarAsync<long>(insertChatSql, new { userId, title = "OCR - " + DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") });

                var insertMsgSql = @"INSERT INTO ai_messages (chat_id, user_id, role, content, metadata) 
                                     VALUES (@chatId, @userId, @role, @content, @metadata)";
                await _db.ExecuteAsync(insertMsgSql, new { chatId, userId, role = "user", content = "[Imagem enviada para OCR]", metadata = (string?)null });
                await _db.ExecuteAsync(insertMsgSql, new { chatId, userId = (long?)null, role = "assistant", content = ocrResult, metadata = (string?)null });

                return Ok(new { chatId, ocr = ocrResult });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AI/IMAGE ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao processar imagem");
            }
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