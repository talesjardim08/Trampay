using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Net.Http.Headers;
using System;
using System.Text.RegularExpressions;
using System.Collections.Generic;

namespace TrampayBackend.Services
{
    public class AiService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<AiService> _logger;

        public AiService(HttpClient http, IConfiguration config, ILogger<AiService> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }

        public class ChatMessage
        {
            public string role { get; set; } = "user";
            public string content { get; set; } = string.Empty;
        }

        // helper: strip html tags if server returned an HTML error page
        private string StripHtml(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;
            // Remove scripts/styles first
            var noScripts = Regex.Replace(input, @"<script[\s\S]*?</script>", "", RegexOptions.IgnoreCase);
            noScripts = Regex.Replace(noScripts, @"<style[\s\S]*?</style>", "", RegexOptions.IgnoreCase);
            // Strip tags
            var text = Regex.Replace(noScripts, @"<[^>]+>", " ");
            // Decode some HTML entities (basic)
            text = System.Net.WebUtility.HtmlDecode(text);
            // Collapse whitespace
            text = Regex.Replace(text, @"\s+", " ").Trim();
            return text;
        }

        private async Task<(bool success, string body, string contentType)> PostJsonAsync(string url, string json, string apiKey)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, url);
            // prefer json
            req.Headers.Accept.Clear();
            req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var res = await _http.SendAsync(req);
            var body = await res.Content.ReadAsStringAsync();
            var contentType = res.Content.Headers.ContentType?.MediaType ?? "";

            if (!res.IsSuccessStatusCode)
            {
                // Return body anyway for upstream handling
                return (false, body, contentType);
            }
            return (true, body, contentType);
        }

        public async Task<string> GetChatResponseAsync(string input)
        {
            var geminiKey = _config["Ai:GeminiApiKey"] 
                ?? Environment.GetEnvironmentVariable("API__KEY__GEMINI")
                ?? Environment.GetEnvironmentVariable("Ai__GeminiApiKey");
            
            Console.WriteLine($"[AiService.GetChatResponseAsync] Checking Gemini key: Config={!string.IsNullOrEmpty(_config["Ai:GeminiApiKey"])}, Env_API__KEY={!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("API__KEY__GEMINI"))}, Env_Ai__Key={!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("Ai__GeminiApiKey"))}, Final={!string.IsNullOrEmpty(geminiKey)}");
            
            if (string.IsNullOrEmpty(geminiKey))
            {
                Console.WriteLine($"[AiService.GetChatResponseAsync] ⚠️ NO GEMINI KEY FOUND - returning automatic response");
                _logger?.LogWarning("Gemini API key not configured - returning automatic response for input length {Length}", input?.Length ?? 0);
                return $"[Resposta automática] Recebi: {input}";
            }
            
            Console.WriteLine($"[AiService.GetChatResponseAsync] ✅ Gemini key found (length={geminiKey.Length})");

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={geminiKey}";
            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = input } }
                    }
                }
            };
            var json = JsonSerializer.Serialize(payload);

            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, url);
                req.Headers.Accept.Clear();
                req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                req.Content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger?.LogDebug("Sending request to Gemini endpoint. Url: {Url} - payload size: {Size} bytes", url, json?.Length ?? 0);
                var res = await _http.SendAsync(req);
                var body = await res.Content.ReadAsStringAsync();
                var contentType = res.Content.Headers.ContentType?.MediaType ?? "";
                Console.WriteLine($"[AiService.Gemini] Response: Status={(int)res.StatusCode}, ContentType={contentType}");
                _logger?.LogDebug("Gemini response status: {Status}. Content-Type: {ContentType}. Body (truncated): {Body}", (int)res.StatusCode, contentType, (body ?? string.Empty).Length > 1000 ? (body ?? string.Empty).Substring(0, 1000) + "..." : body);

                if (!res.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[AiService.Gemini] ⚠️ Error response from Gemini: {(int)res.StatusCode}");
                    if (contentType.Contains("html") || body.TrimStart().StartsWith("<"))
                    {
                        var text = StripHtml(body);
                        return $"[Erro no modelo] Resposta HTML do provedor: {text}";
                    }

                    try
                    {
                        using var docErr = JsonDocument.Parse(body);
                        if (docErr.RootElement.TryGetProperty("error", out var errProp))
                        {
                            if (errProp.TryGetProperty("message", out var msgProp))
                            {
                                return $"[Erro no modelo] {msgProp.GetString()}";
                            }
                            return $"[Erro no modelo] {errProp.GetString()}";
                        }
                    }
                    catch { }

                    return $"[Erro no modelo] Status não OK. Conteúdo: {body}";
                }

                try
                {
                    using var doc = JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("candidates", out var candidates) &&
                        candidates.ValueKind == JsonValueKind.Array &&
                        candidates.GetArrayLength() > 0)
                    {
                        var first = candidates[0];
                        if (first.TryGetProperty("content", out var content))
                        {
                            if (content.TryGetProperty("parts", out var parts) &&
                                parts.ValueKind == JsonValueKind.Array &&
                                parts.GetArrayLength() > 0)
                            {
                                var firstPart = parts[0];
                                if (firstPart.TryGetProperty("text", out var textProp))
                                {
                                    return textProp.GetString() ?? "[Sem resposta]";
                                }
                            }
                        }
                    }

                    return $"[Erro] Formato de resposta inesperado: {body}";
                }
                catch (Exception ex)
                {
                    _logger?.LogError(ex, "Erro ao interpretar resposta do Gemini");
                    if (body.TrimStart().StartsWith("<"))
                    {
                        var text = StripHtml(body);
                        return $"[Erro] Resposta do provedor (HTML): {text}";
                    }
                    return $"[Erro] Não foi possível interpretar a resposta do modelo. Conteúdo: {body}";
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Internal error while calling Gemini");
                return $"[Erro interno] {ex.Message}";
            }
        }

        public async Task<string> GetChatResponseAsync(IList<ChatMessage> messages)
        {
            var geminiKey = _config["Ai:GeminiApiKey"] 
                ?? Environment.GetEnvironmentVariable("API__KEY__GEMINI")
                ?? Environment.GetEnvironmentVariable("Ai__GeminiApiKey");
            
            Console.WriteLine($"[AiService.GetChatResponseAsync-History] Checking Gemini key: Config={!string.IsNullOrEmpty(_config["Ai:GeminiApiKey"])}, Env_API__KEY={!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("API__KEY__GEMINI"))}, Env_Ai__Key={!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("Ai__GeminiApiKey"))}, Final={!string.IsNullOrEmpty(geminiKey)}");
            
            if (string.IsNullOrEmpty(geminiKey))
            {
                Console.WriteLine($"[AiService.GetChatResponseAsync-History] ⚠️ NO GEMINI KEY FOUND - returning automatic response");
                _logger?.LogWarning("Gemini API key not configured - returning automatic response for chat messages count {Count}", messages?.Count ?? 0);
                if (messages != null && messages.Count > 0)
                {
                    var last = messages[messages.Count - 1].content;
                    return $"[Resposta automática] Recebi: {last}";
                }
                return "[Resposta automática]";
            }
            
            Console.WriteLine($"[AiService.GetChatResponseAsync-History] ✅ Gemini key found (length={geminiKey.Length})");

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={geminiKey}";
            
            // Convert chat history to Gemini format
            var contents = new List<object>();
            foreach (var msg in messages)
            {
                contents.Add(new
                {
                    role = msg.role == "assistant" ? "model" : "user",
                    parts = new[] { new { text = msg.content } }
                });
            }

            var payload = new { contents = contents.ToArray() };
            var json = JsonSerializer.Serialize(payload);

            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, url);
                req.Headers.Accept.Clear();
                req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                req.Content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger?.LogDebug("Sending chat history to Gemini endpoint. Url: {Url} - payload size: {Size} bytes - messages: {Count}", url, json?.Length ?? 0, messages?.Count ?? 0);
                var res = await _http.SendAsync(req);
                var body = await res.Content.ReadAsStringAsync();
                var contentType = res.Content.Headers.ContentType?.MediaType ?? "";
                _logger?.LogDebug("Gemini response status: {Status}. Content-Type: {ContentType}. Body (truncated): {Body}", (int)res.StatusCode, contentType, (body ?? string.Empty).Length > 1000 ? (body ?? string.Empty).Substring(0, 1000) + "..." : body);

                if (!res.IsSuccessStatusCode)
                {
                    if (contentType.Contains("html") || body.TrimStart().StartsWith("<"))
                    {
                        var text = StripHtml(body);
                        return $"[Erro no modelo] Resposta HTML do provedor: {text}";
                    }

                    try
                    {
                        using var docErr = JsonDocument.Parse(body);
                        if (docErr.RootElement.TryGetProperty("error", out var errProp))
                        {
                            if (errProp.TryGetProperty("message", out var msgProp))
                            {
                                return $"[Erro no modelo] {msgProp.GetString()}";
                            }
                            return $"[Erro no modelo] {errProp.GetString()}";
                        }
                    }
                    catch { }

                    return $"[Erro no modelo] Status não OK. Conteúdo: {body}";
                }

                try
                {
                    using var doc = JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("candidates", out var candidates) &&
                        candidates.ValueKind == JsonValueKind.Array &&
                        candidates.GetArrayLength() > 0)
                    {
                        var first = candidates[0];
                        if (first.TryGetProperty("content", out var content))
                        {
                            if (content.TryGetProperty("parts", out var parts) &&
                                parts.ValueKind == JsonValueKind.Array &&
                                parts.GetArrayLength() > 0)
                            {
                                var firstPart = parts[0];
                                if (firstPart.TryGetProperty("text", out var textProp))
                                {
                                    return textProp.GetString() ?? "[Sem resposta]";
                                }
                            }
                        }
                    }

                    return $"[Erro] Formato de resposta inesperado: {body}";
                }
                catch (Exception ex)
                {
                    _logger?.LogError(ex, "Erro ao interpretar resposta do Gemini");
                    if (body.TrimStart().StartsWith("<"))
                    {
                        var text = StripHtml(body);
                        return $"[Erro] Resposta do provedor (HTML): {text}";
                    }
                    return $"[Erro] Não foi possível interpretar a resposta do modelo. Conteúdo: {body}";
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Internal error while calling Gemini");
                return $"[Erro interno] {ex.Message}";
            }
        }

        // OCR via OCR.Space (mantive igual, só reorganizei)
        public async Task<string> AnalyzeImageAsync(IFormFile file)
        {
            var ocrUrl = _config["Ai:OcrSpaceApiUrl"];
            var ocrKey = _config["Ai:OcrSpaceApiKey"];

            if (string.IsNullOrEmpty(ocrKey) || string.IsNullOrEmpty(ocrUrl))
            {
                return "[OCR não configurado]";
            }

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Seek(0, SeekOrigin.Begin);

            using var content = new MultipartFormDataContent();
            var bytes = ms.ToArray();
            var byteContent = new ByteArrayContent(bytes);
            byteContent.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType ?? "application/octet-stream");
            content.Add(byteContent, "file", file.FileName);

            content.Add(new StringContent("true"), "isOverlayRequired");
            content.Add(new StringContent("por"), "language");
            content.Add(new StringContent("2"), "OCREngine");

            var request = new HttpRequestMessage(HttpMethod.Post, ocrUrl);
            request.Headers.Add("apikey", ocrKey);
            request.Content = content;

            var res = await _http.SendAsync(request);
            var resText = await res.Content.ReadAsStringAsync();

            try
            {
                using var doc = JsonDocument.Parse(resText);
                if (doc.RootElement.TryGetProperty("ParsedResults", out var parsed) && parsed.ValueKind == JsonValueKind.Array)
                {
                    var sb = new StringBuilder();
                    foreach (var p in parsed.EnumerateArray())
                    {
                        if (p.TryGetProperty("ParsedText", out var parsedText))
                        {
                            sb.AppendLine(parsedText.GetString());
                        }
                    }
                    return sb.ToString().Trim();
                }
            }
            catch
            {
            }

            return resText;
        }
    }
}
