using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace TrampayBackend.Middleware
{
    public class ErrorHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlerMiddleware> _logger;

        public ErrorHandlerMiddleware(RequestDelegate next, ILogger<ErrorHandlerMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (MySqlException sqlEx)
            {
                _logger.LogError(sqlEx, "[MySQL ERROR] Erro de banco de dados capturado.");

                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    error = "Erro de banco de dados.",
                    detail = sqlEx.Message
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "[AUTH ERROR] Acesso não autorizado.");

                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    error = "Você não tem permissão para acessar este recurso.",
                    detail = ex.Message
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SERVER ERROR] Erro não tratado.");

                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    error = "Ocorreu um erro inesperado.",
                    detail = ex.Message
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
    }

    public static class ErrorHandlerExtension
    {
        public static IApplicationBuilder UseErrorHandler(this IApplicationBuilder app)
        {
            return app.UseMiddleware<ErrorHandlerMiddleware>();
        }
    }
}