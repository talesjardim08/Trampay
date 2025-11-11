using System.Threading.Tasks;
using TrampayBackend.Models;

namespace TrampayBackend.Services
{
    public interface IAuthService
    {
        (string Hash, string Salt) HashPassword(string password, string? salt = null);
        bool VerifyPassword(string password, string hash, string salt);
        string GenerateJwtToken(long userId, string? email, string? role = "user");

        // === novos métodos ===
        Task<(bool Success, string Message, string? Token)> AuthenticateAsync(string email, string password);
        Task<(bool Success, string Message, string? Token)> RegisterAsync(User newUser, string password);
    }
}
