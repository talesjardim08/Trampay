using Microsoft.Extensions.Configuration;
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

        public AiService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _config = config;
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
            var hfKey = _config["Ai:HuggingFaceApiKey"] ?? Environment.GetEnvironmentVariable("API__KEY");
            if (string.IsNullOrEmpty(hfKey))
            {
                return $"[Resposta automática] Recebi: {input}";
            }

            var url = "https://router.huggingface.co/v1/chat/completions";
            var payload = new
            {
                model = "mistralai/Mistral-7B-Instruct", // continue usando, mas trate erros abaixo
                messages = new[] { new { role = "user", content = input } },
                temperature = 0.2
            };
            var json = JsonSerializer.Serialize(payload);

            try
            {
                var (success, body, contentType) = await PostJsonAsync(url, json, hfKey);

                if (!success)
                {
                    // If HTML returned, strip tags and provide helpful message
                    if (contentType.Contains("html") || body.TrimStart().StartsWith("<"))
                    {
                        var text = StripHtml(body);
                        return $"[Erro no modelo] Resposta HTML do provedor: {text}";
                    }

                    // try parse json error
                    try
                    {
                        using var docErr = JsonDocument.Parse(body);
                        if (docErr.RootElement.TryGetProperty("error", out var errProp))
                        {
                            return $"[Erro no modelo] {errProp.GetString()}";
                        }
                    }
                    catch { /* ignore parse errors */ }

                    return $"[Erro no modelo] Status não OK. Conteúdo: {body}";
                }

                // success path: parse response
                try
                {
                    using var doc = JsonDocument.Parse(body);
                    // Attempt to support multiple shapes returned by different HF endpoints
                    if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                        choices.ValueKind == JsonValueKind.Array &&
                        choices.GetArrayLength() > 0)
                    {
                        var first = choices[0];
                        if (first.TryGetProperty("message", out var messageProp))
                        {
                            if (messageProp.TryGetProperty("content", out var contentProp))
                            {
                                return contentProp.GetString() ?? body;
                            }
                        }
                        // fallback to "text" or "delta" style
                        if (first.TryGetProperty("text", out var textProp))
                        {
                            return textProp.GetString() ?? body;
                        }
                    }

                    // Some routers return top-level "result" or "output"
                    if (doc.RootElement.TryGetProperty("result", out var resProp))
                    {
                        return resProp.ToString();
                    }

                    // If nothing matched, return raw body
                    return body;
                }
                catch (Exception ex)
                {
                    // If parsing fails but body is HTML, strip tags
                    if (body.TrimStart().StartsWith("<"))
                    {
                        var text = StripHtml(body);
                        return $"[Erro] Resposta do provedor (HTML): {text}";
                    }
                    // fallback
                    return $"[Erro] Não foi possível interpretar a resposta do modelo. Conteúdo: {body}";
                }
            }
            catch (Exception ex)
            {
                // network or unexpected
                return $"[Erro interno] {ex.Message}";
            }
        }

        public async Task<string> GetChatResponseAsync(IList<ChatMessage> messages)
        {
            var hfKey = _config["Ai:HuggingFaceApiKey"] ?? Environment.GetEnvironmentVariable("API__KEY");
            if (string.IsNullOrEmpty(hfKey))
            {
                if (messages != null && messages.Count > 0)
                {
                    var last = messages[messages.Count - 1].content;
                    return $"[Resposta automática] Recebi: {last}";
                }
                return "[Resposta automática]";
            }

            var url = "https://router.huggingface.co/v1/chat/completions";
            var payload = new
            {
                model = "mistralai/Mistral-7B-Instruct",
                messages = messages,
                temperature = 0.2
            };
            var json = JsonSerializer.Serialize(payload);

            try
            {
                var (success, body, contentType) = await PostJsonAsync(url, json, hfKey);

                if (!success)
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
                            return $"[Erro no modelo] {errProp.GetString()}";
                        }
                    }
                    catch { }

                    return $"[Erro no modelo] Status não OK. Conteúdo: {body}";
                }

                try
                {
                    using var doc = JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                        choices.ValueKind == JsonValueKind.Array &&
                        choices.GetArrayLength() > 0)
                    {
                        var first = choices[0];
                        if (first.TryGetProperty("message", out var messageProp))
                        {
                            if (messageProp.TryGetProperty("content", out var contentProp))
                            {
                                return contentProp.GetString() ?? body;
                            }
                        }
                        if (first.TryGetProperty("text", out var textProp))
                        {
                            return textProp.GetString() ?? body;
                        }
                    }

                    if (doc.RootElement.TryGetProperty("result", out var resProp))
                    {
                        return resProp.ToString();
                    }

                    return body;
                }
                catch (Exception ex)
                {
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
