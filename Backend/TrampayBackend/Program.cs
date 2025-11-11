using System.Data;
using MySqlConnector;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using TrampayBackend.Middleware;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var services = builder.Services;

// -----------------------------
// CONNECTION (MySQL)
// -----------------------------
var connStr = configuration.GetConnectionString("DefaultConnection")
              ?? Environment.GetEnvironmentVariable("MYSQL_CONNECTION")
              ?? "Server=mysql-trampay.alwaysdata.net;Database=trampay_tcc;User=YOUR_USER;Password=YOUR_PASS;";

// disponibiliza IDbConnection (se o projeto usa Dapper / conexões manuais)
services.AddTransient<IDbConnection>(_ => new MySqlConnection(connStr));

// -----------------------------
// JWT / Authentication
// -----------------------------
var jwtSecret = configuration["Jwt:Secret"] ?? Environment.GetEnvironmentVariable("JWT_SECRET") ?? "troque-essa-chave-por-uma-segura";
var jwtIssuer = configuration["Jwt:Issuer"] ?? "Trampay";
var jwtAudience = configuration["Jwt:Audience"] ?? "TrampayAudience";
var keyBytes = Encoding.ASCII.GetBytes(jwtSecret);

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

// -----------------------------
// Application services - registre AQUI (antes do Build)
services.AddScoped<TrampayBackend.Services.IAuthService, TrampayBackend.Services.AuthService>();

// registrar EmailService se existir (mantive a sua referência)
if (Type.GetType("TrampayBackend.Services.EmailService, TrampayBackend") != null)
{
   services.AddSingleton<TrampayBackend.Services.IEmailService, TrampayBackend.Services.EmailService>();

}
if (Type.GetType("TrampayBackend.Services.EmailService, TrampayBackend") != null)
{
    services.AddSingleton<TrampayBackend.Services.IEmailService, TrampayBackend.Services.EmailService>();

}

// Controllers, CORS, Swagger
services.AddControllers();
services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", p =>
    {
        p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});

services.AddEndpointsApiExplorer();
services.AddSwaggerGen(c =>
{
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira 'Bearer {token}'"
    };
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Trampay API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtScheme, Array.Empty<string>() }
    });
});

// permitir upload grandes (configurar antes do Build)
services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50 MB
});

// registrar AuthService e EmailService (antes do Build)
builder.Services.AddSingleton<TrampayBackend.Services.IAuthService, TrampayBackend.Services.AuthService>();
builder.Services.AddSingleton<TrampayBackend.Services.IEmailService, TrampayBackend.Services.EmailService>();


// -----------------------------
// Build
// -----------------------------
var app = builder.Build();

// -----------------------------
// Middleware / Pipeline
// -----------------------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/error");
}

// static uploads folder
var uploads = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploads),
    RequestPath = "/uploads"
});

app.UseRouting();

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

// custom error middleware (mantive sua chamada, se não existir ignore)
try
{
    app.UseMiddleware<ErrorHandlerMiddleware>();
}
catch
{
    // se o middleware não existir, seguimos em frente
}

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { ok = true, now = DateTime.UtcNow }));

// -----------------------------
// Seed admin (opcional) - usa seu IUserService se disponível
// -----------------------------
using (var scope = app.Services.CreateScope())
{
    var auth = scope.ServiceProvider.GetService<TrampayBackend.Services.IAuthService>();
    if (auth != null)
    {
        try
        {
            var admin = await auth.AuthenticateAsync("admin@oxente.com", "oxente123");
            if (!admin.Success) // 👈 correção principal
            {
                var newAdmin = new TrampayBackend.Models.User
                {
                    AccountType = "pf",
                    DocumentType = "CPF",
                    DocumentNumber = "00000000000",
                    LegalName = "Admin Test",
                    DisplayName = "Admin",
                    Email = "admin@oxente.com",
                    Phone = "0000000000",
                    IsActive = true,
                    IsVerified = true
                };

                await auth.RegisterAsync(newAdmin, "oxente123");
                Console.WriteLine("Usuário admin criado com sucesso!");
            }
            else
            {
                Console.WriteLine("Usuário admin já existe ou login bem-sucedido.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao criar admin: {ex.Message}");
        }
    }
}

app.Run();
