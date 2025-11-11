using System.Data;
using MySqlConnector;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using TrampayBackend.Middleware;


var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var services = builder.Services;

// ------------------------------------------------------
// CONFIGURAÇÕES DO BANCO DE DADOS
// ------------------------------------------------------
var connStr = configuration.GetConnectionString("Default")
              ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default")
              ?? "Server=127.0.0.1;Port=3306;Database=trampay_tcc;Uid=root;Pwd=root;";

services.AddTransient<IDbConnection>(_ => new MySqlConnection(connStr));

// ------------------------------------------------------
// CONFIGURAÇÕES JWT
// ------------------------------------------------------
var jwtKey = configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("Jwt__Key") ?? "troquesecreta_dev_mude";
var jwtIssuer = configuration["Jwt:Issuer"] ?? "trampay.local";
var jwtAudience = configuration["Jwt:Audience"] ?? "trampay.local";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

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
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

// ------------------------------------------------------
// CONFIGURAÇÕES CORS E SWAGGER
// ------------------------------------------------------
services.AddCors(o => o.AddPolicy("FrontendPolicy", p =>
{
    p.AllowAnyHeader()
     .AllowAnyMethod()
     .AllowAnyOrigin(); // Em produção, troque por .WithOrigins("https://seu-front.render.com")
}));

services.AddEndpointsApiExplorer();
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Trampay API", Version = "v1" });

    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Autenticação JWT (Bearer token)"
    };

    c.AddSecurityDefinition("Bearer", jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtScheme, Array.Empty<string>() }
    });
});

services.AddControllers();

var app = builder.Build();

// registrar EmailService
services.AddSingleton<TrampayBackend.Services.IEmailService, TrampayBackend.Services.EmailService>();

// permitir form file large uploads (ajuste se necessário)
services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50 MB
});


// ------------------------------------------------------
// PIPELINE
// ------------------------------------------------------
app.UseRouting();

app.UseErrorHandler(); // middleware global - coloque antes de outras middlewares


app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

// Permitir upload e servir arquivos estáticos
var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsDir))
    Directory.CreateDirectory(uploadsDir);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads"
});


if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { ok = true, now = DateTime.UtcNow }));

app.Run();
