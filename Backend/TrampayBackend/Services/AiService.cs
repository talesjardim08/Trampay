using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Net.Http.Headers;

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

        // Chat response via Hugging Face Inference API (text generation)
        public async Task<string> GetChatResponseAsync(string input)
        {
            var hfUrl = _config["Ai:HuggingFaceApiUrl"];
            var hfKey = _config["Ai:HuggingFaceApiKey"];

            if (string.IsNullOrEmpty(hfUrl) || string.IsNullOrEmpty(hfKey))
            {
                // fallback simple echo if no API key provided (safety)
                return $"[Resposta automática] Recebi: {input}";
            }

            var requestBody = new { inputs = input, options = new { wait_for_model = true } };
            var requestJson = JsonSerializer.Serialize(requestBody);

            using var req = new HttpRequestMessage(HttpMethod.Post, hfUrl);
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", hfKey);
            req.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var res = await _http.SendAsync(req);
            if (!res.IsSuccessStatusCode)
            {
                var txt = await res.Content.ReadAsStringAsync();
                return $"[Erro no modelo] {res.StatusCode}: {txt}";
            }

            var content = await res.Content.ReadAsStringAsync();

            // Hugging Face returns array or object depending on model; try to parse
            try
            {
                using var doc = JsonDocument.Parse(content);
                // Many models return [{"generated_text":"..."}]
                if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                {
                    var first = doc.RootElement[0];
                    if (first.TryGetProperty("generated_text", out var gen))
                    {
                        return gen.GetString() ?? content;
                    }
                }
                // other models might return plain text or object
                return content;
            }
            catch
            {
                return content;
            }
        }

        // OCR via OCR.Space
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
            content.Add(new StringContent("por"), "language"); // por = portuguese (3-letter code)
            content.Add(new StringContent("2"), "OCREngine"); // Engine 2 supports Portuguese

            var request = new HttpRequestMessage(HttpMethod.Post, ocrUrl);
            request.Headers.Add("apikey", ocrKey); // OCR.Space uses apikey header
            request.Content = content;

            var res = await _http.SendAsync(request);
            var resText = await res.Content.ReadAsStringAsync();

            // Try to parse result
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
                // ignore
            }

            return resText;
        }
    }
}
