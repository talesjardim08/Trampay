using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ===== Configuração dos serviços =====
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ===== JWT Authentication =====
var jwtKey = config["Jwt:Key"] ?? "default_key_change_me";
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
        ValidIssuer = config["Jwt:Issuer"] ?? "default_issuer",
        ValidAudience = config["Jwt:Audience"] ?? "default_audience",
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
    };
});

// ===== Serviços personalizados =====
builder.Services.AddScoped<IUserService, UserService>();

// ===== Build do app =====
var app = builder.Build();

// ===== Swagger apenas no desenvolvimento =====
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ===== Middlewares =====
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// ===== Rotas =====
app.MapControllers();

// ===== Configurar para aceitar conexões externas =====
app.Urls.Add("http://0.0.0.0:5125");

app.Run();
