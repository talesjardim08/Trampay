using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// --------------------------------------------------------------------
// 🔹 Configuração da porta (Render usa a variável PORT para o binding)
// --------------------------------------------------------------------
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// --------------------------------------------------------------------
// 🔹 Services
// --------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Trampay API",
        Version = "v1",
        Description = "API de autenticação e usuários do app Trampay"
    });

    // Configuração do esquema JWT no Swagger
    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Informe o token JWT no formato: Bearer {token}",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});

// --------------------------------------------------------------------
// 🔹 Injeção de dependências
// --------------------------------------------------------------------
builder.Services.AddScoped<IUserService, UserService>();

// --------------------------------------------------------------------
// 🔹 JWT
// --------------------------------------------------------------------

// ⚠️ No Render, as variáveis devem estar assim:
// JWT_KEY=chave-super-secreta
// JWT_ISSUER=TrampayApi
// JWT_AUDIENCE=TrampayApp
var jwtKey = config["Jwt:Key"]
          ?? Environment.GetEnvironmentVariable("JWT_KEY")
          ?? "change_this_in_prod";

var issuer = config["Jwt:Issuer"]
          ?? Environment.GetEnvironmentVariable("JWT_ISSUER")
          ?? "TrampayApi";

var audience = config["Jwt:Audience"]
          ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE")
          ?? "TrampayApp";

var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
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
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

// --------------------------------------------------------------------
// 🔹 CORS (para o app React Native Expo acessar o backend no Render)
// --------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --------------------------------------------------------------------
// 🔹 Construção do app
// --------------------------------------------------------------------
var app = builder.Build();

// 🔹 Habilitar Swagger também em produção
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Trampay API v1");
});

// 🔹 Middleware
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// 🔹 Mapear controllers
app.MapControllers();

// 🔹 Rodar o app
app.Run();
