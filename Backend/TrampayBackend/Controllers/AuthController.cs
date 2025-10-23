using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    public AuthController(IUserService userService) => _userService = userService;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var existing = await _userService.GetByEmailAsync(dto.Email);
        if (existing != null) return Conflict(new { message = "Email já cadastrado." });

        var id = await _userService.CreateUserAsync(dto);
        return Ok(new { id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var token = await _userService.ValidateAndGenerateTokenAsync(dto.Email, dto.Senha);
        if (token == null) return Unauthorized(new { message = "Credenciais inválidas." });
        return Ok(new { token });
    }
}

public record RegisterDto(
    string AccountType,
    string DocumentType,
    string DocumentNumber,
    string LegalName,
    string DisplayName,
    DateTime? BirthDate,
    string Email,
    string Phone,
    string Senha
);

public record LoginDto(string Email, string Senha);
