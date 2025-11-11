using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace TrampayBackend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _cfg;
        public EmailService(IConfiguration cfg) { _cfg = cfg; }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            // se tiver SendGrid configurado, usa SendGrid
            var sendGridKey = _cfg["SendGrid:ApiKey"] ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            if (!string.IsNullOrEmpty(sendGridKey))
            {
                await SendWithSendGrid(sendGridKey, toEmail, subject, body);
                return;
            }

            // caso contrário usa SMTP (configurado via env vars)
            var smtpHost = _cfg["Smtp:Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST");
            var smtpPort = int.TryParse(_cfg["Smtp:Port"], out var p) ? p : (int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var p2) ? p2 : 587);
            var smtpUser = _cfg["Smtp:User"] ?? Environment.GetEnvironmentVariable("SMTP_USER");
            var smtpPass = _cfg["Smtp:Pass"] ?? Environment.GetEnvironmentVariable("SMTP_PASS");
            var from = _cfg["Smtp:From"] ?? Environment.GetEnvironmentVariable("SMTP_FROM") ?? "noreply@trampay.local";

            if (string.IsNullOrEmpty(smtpHost)) throw new InvalidOperationException("SMTP não configurado");

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var mail = new MailMessage(from, toEmail, subject, body);
            mail.IsBodyHtml = false;
            await client.SendMailAsync(mail);
        }

        private async Task SendWithSendGrid(string apiKey, string toEmail, string subject, string body)
        {
            // implementação mínima SendGrid sem pacote nuget: usa HTTP call
            using var http = new System.Net.Http.HttpClient();
            http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            var payload = new
            {
                personalizations = new[] { new { to = new[] { new { email = toEmail } } } },
                from = new { email = _cfg["SendGrid:From"] ?? "noreply@trampay.local" },
                subject,
                content = new[] { new { type = "text/plain", value = body } }
            };
            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            var res = await http.PostAsync("https://api.sendgrid.com/v3/mail/send", new System.Net.Http.StringContent(json, Encoding.UTF8, "application/json"));
            if (!res.IsSuccessStatusCode)
            {
                var txt = await res.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"SendGrid error: {res.StatusCode} - {txt}");
            }
        }
    }
}
