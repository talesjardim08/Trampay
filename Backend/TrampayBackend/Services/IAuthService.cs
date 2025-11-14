using System.Threading.Tasks;
using TrampayBackend.Models;

namespace TrampayBackend.Services
{
    public interface IAuthService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
        string GenerateJwtToken(long userId, string? email, string? role = "user");

        Task<(bool Success, string Message, string? Token)> AuthenticateAsync(string email, string password);
        Task<(bool Success, string Message, string? Token)> RegisterAsync(User newUser, string password);
    }
}
