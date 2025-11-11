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
var connStr =
    configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("MYSQL_CONNECTION")
    ?? "Server=mysql-trampay.alwaysdata.net;Database=trampay_tcc;User=trampay_dev;Password=Tj120408@;";

// Registrar conexão MySQL (usado pelo Dapper)
services.AddTransient<IDbConnection>(_ => new MySqlConnection(connStr));

Console.WriteLine($"[INIT] Conectando ao banco: {connStr.Split(';')[0]}...");

// -----------------------------
// JWT / Authentication
// -----------------------------
var jwtSecret = configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? "troque-essa-chave-por-uma-segura";

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
// Application Services
// -----------------------------
services.AddScoped<TrampayBackend.Services.IAuthService, TrampayBackend.Services.AuthService>();

if (Type.GetType("TrampayBackend.Services.EmailService, TrampayBackend") != null)
{
    services.AddSingleton<TrampayBackend.Services.IEmailService, TrampayBackend.Services.EmailService>();
}

// -----------------------------
// Controllers, CORS, Swagger
// -----------------------------
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

// permitir uploads grandes
services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50 MB
});

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

// Static uploads folder
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

try
{
    app.UseMiddleware<ErrorHandlerMiddleware>();
}
catch
{
    Console.WriteLine("⚠️ Middleware ErrorHandler não encontrado, ignorando...");
}

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { ok = true, now = DateTime.UtcNow }));

// -----------------------------
// Seed admin (opcional)
// -----------------------------
using (var scope = app.Services.CreateScope())
{
    var auth = scope.ServiceProvider.GetService<TrampayBackend.Services.IAuthService>();
    if (auth != null)
    {
        try
        {
            var admin = await auth.AuthenticateAsync("admin@oxente.com", "oxente123");
            if (!admin.Success)
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
                Console.WriteLine("✅ Usuário admin criado com sucesso!");
            }
            else
            {
                Console.WriteLine("ℹ️ Usuário admin já existe ou login bem-sucedido.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Erro ao criar admin: {ex.Message}");
        }
    }
}

app.Run();
