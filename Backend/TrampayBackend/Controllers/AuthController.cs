using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IConfiguration _config;

    public AuthController(IUserService userService, IConfiguration config)
    {
        _userService = userService;
        _config = config;
    }

    // ---------------- REGISTER ----------------
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] registerDto dto)
    {

        Console.WriteLine($"[DEBUG] Payload recebido: {System.Text.Json.JsonSerializer.Serialize(dto)}");

        if (dto == null) return BadRequest(new { message = "Payload inválido" });
        if (string.IsNullOrEmpty(dto.Senha)) return BadRequest(new { message = "Senha obrigatória" });

        if (!string.IsNullOrEmpty(dto.Email))
        {
            var existing = await _userService.GetByEmailAsync(dto.Email);
            if (existing != null)
                return Conflict(new { message = "Email já cadastrado" });
        }

        try
        {
            var id = await _userService.CreateUserAsync(dto);
            return Ok(new { id });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erro ao criar usuário", detail = ex.Message });
        }
    }

    // ---------------- LOGIN ----------------
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] loginDto dto)
    {
        if (dto == null) return BadRequest();

        var token = await _userService.ValidateAndGenerateTokenAsync(dto.Email, dto.Senha);
        if (token == null)
            return Unauthorized(new { message = "Credenciais inválidas" });

        var user = await _userService.GetByEmailAsync(dto.Email);
        if (user == null)
            return Unauthorized(new { message = "Usuário não encontrado" });

        user.PasswordHash = null; // não enviar hash

        return Ok(new { token, user });
    }

    // ---------------- FORGOT PASSWORD ----------------
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (dto == null || string.IsNullOrEmpty(dto.Email))
            return BadRequest(new { message = "Email obrigatório" });

        // Novo método: retorna token direto
        var token = await _userService.CreatePasswordResetTokenAsync(dto.Email);

        if (token == null)
            return Ok(new { message = "Se o e-mail existir, instruções serão enviadas." });

        var show = (_config["DEV_SHOW_TOKENS"] ?? Environment.GetEnvironmentVariable("DEV_SHOW_TOKENS") ?? "false") == "true";

        if (show)
            return Ok(new { message = "Token gerado (modo dev).", token });
        else
            return Ok(new { message = "Se o e-mail existir, instruções serão enviadas." });
    }

    // ---------------- RESET PASSWORD ----------------
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (dto == null || string.IsNullOrEmpty(dto.Token) || string.IsNullOrEmpty(dto.NewPassword))
            return BadRequest(new { message = "Token e nova senha requeridos" });

        var ok = await _userService.ResetPasswordWithTokenAsync(dto.Token, dto.NewPassword);

        if (!ok)
            return BadRequest(new { message = "Token inválido ou expirado" });

        return Ok(new { message = "Senha redefinida com sucesso" });
    }
}
