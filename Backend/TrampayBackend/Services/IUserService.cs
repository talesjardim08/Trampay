using System.Threading.Tasks;
using TrampayBackend.Models;

public interface IUserService
{
    Task<ulong> CreateUserAsync(registerDto dto);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(ulong id);
    Task<string?> ValidateAndGenerateTokenAsync(string email, string password);
    Task<string?> CreatePasswordResetTokenAsync(string email);

    Task<bool> ResetPasswordWithTokenAsync(string token, string newPassword);
}
