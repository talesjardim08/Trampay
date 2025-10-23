public interface IUserService
{
    Task<ulong> CreateUserAsync(RegisterDto dto);
    Task<User> GetByEmailAsync(string email);
    Task<string> ValidateAndGenerateTokenAsync(string email, string password);
}
