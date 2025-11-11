using System.Data;
using MySqlConnector;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using TrampayBackend.Middleware;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
// Use builder.Services (evitar modificar app.Services após Build)
var services = builder.Services;

// ---------------------------
// Connection string (MySQL)
// ---------------------------
// Preferir variável de ambiente "MYSQL_CONNECTION" ou ConnectionStrings:DefaultConnection
var connStr = configuration.GetConnectionString("DefaultConnection")
           ?? Environment.GetEnvironmentVariable("MYSQL_CONNECTION")
           ?? "Server=mysql-trampay.alwaysdata.net;Database=trampay_tcc;User=YOUR_USER;Password=YOUR_PASS;";

// ---------------------------
// Registros de serviços (todos ANTES do Build)
// ---------------------------

// DB connection factory (se seu código usa IDbConnection diretamente)
services.AddTransient<IDbConnection>(_ => new MySqlConnection(connStr));

// Authentication - JWT (exemplo mínimo; ajuste issuer/secret conforme necessário)
var jwtSecret = configuration["Jwt:Secret"] ?? Environment.GetEnvironmentVariable("JWT_SECRET") ?? "troque-essa-chave-por-uma-segura";
var jwtIssuer = configuration["Jwt:Issuer"] ?? "TrampayBackend";
var key = Encoding.ASCII.GetBytes(jwtSecret);

services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
    };
});

// CORS - permitir frontend (ajuste conforme seu domínio)
services.AddCors(o => o.AddPolicy("FrontendPolicy", p =>
{
    p.AllowAnyHeader()
     .AllowAnyMethod()
     .AllowAnyOrigin();
}));

// Swagger / OpenAPI
services.AddEndpointsApiExplorer();
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Trampay API", Version = "v1" });
    // JWT auth in swagger (opcional)
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT Bearer token **_only_**",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        { securityScheme, new string[] { } }
    });
});

// Controllers
services.AddControllers();

// Se seu projeto tem IEmailService/EmailService, registrar aqui (antes do Build)
services.AddSingleton<TrampayBackend.Services.IEmailService, TrampayBackend.Services.EmailService>();

// Configurar FormOptions para upload (se usa upload multipart grande)
services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 1024 * 1024 * 200; // 200 MB (ajuste)
    options.BufferBody = false;
});

// Qualquer outro service registration que seu projeto precisar:
 // services.AddScoped<...>();
 // services.AddTransient<...>();
 // services.AddHttpClient();


// ---------------------------
// Agora construímos o app (Build)
// ---------------------------
var app = builder.Build();


// ---------------------------
// Middlewares (após Build)
// ---------------------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Em produção, você pode querer um handler de erros customizado
    app.UseExceptionHandler("/error");
}

// Habilitar CORS, Auth e Authorization
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

// Registrar middleware global de erros se você tiver (referência do seu projeto)
app.UseMiddleware<ErrorHandlerMiddleware>();
app.UseErrorHandler(); // se essa extensão existir no seu projeto

// Permitir upload e servir arquivos estáticos
var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsDir))
    Directory.CreateDirectory(uploadsDir);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads"
});

// Mapear controllers e endpoints
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { ok = true, now = DateTime.UtcNow }));

app.Run();
