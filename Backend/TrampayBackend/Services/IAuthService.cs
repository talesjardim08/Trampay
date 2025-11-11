using System.Threading.Tasks;
using TrampayBackend.Models;

namespace TrampayBackend.Services
{
    public interface IAuthService
    {
        /// <summary>
        /// Valida email e senha e retorna o usuário autenticado, ou null.
        /// </summary>
        Task<User?> AuthenticateAsync(string email, string password);

        /// <summary>
        /// Cadastra novo usuário com hash da senha.
        /// </summary>
        Task<User> RegisterAsync(User newUser, string password);
    }
}
