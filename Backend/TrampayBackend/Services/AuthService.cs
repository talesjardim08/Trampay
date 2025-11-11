using System.Data;
using Dapper;
using System.Threading.Tasks;
using TrampayBackend.Models;
using BCrypt.Net;

namespace TrampayBackend.Services
{
    public class AuthService : IAuthService
    {
        private readonly IDbConnection _db;

        public AuthService(IDbConnection db)
        {
            _db = db;
        }

        public async Task<User?> AuthenticateAsync(string email, string password)
        {
            const string sql = "SELECT * FROM users WHERE email = @Email LIMIT 1;";
            var user = await _db.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });

            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
                return null;

            bool valid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            return valid ? user : null;
        }

        public async Task<User> RegisterAsync(User newUser, string password)
        {
            // verifica se email já existe
            const string checkSql = "SELECT COUNT(*) FROM users WHERE email = @Email;";
            var exists = await _db.ExecuteScalarAsync<long>(checkSql, new { newUser.Email });
            if (exists > 0)
                throw new System.Exception("Email já cadastrado.");

            newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);

            const string insertSql = @"
                INSERT INTO users (account_type, document_type, document_number, legal_name,
                                   display_name, email, phone, password_hash, is_active, is_verified)
                VALUES (@AccountType, @DocumentType, @DocumentNumber, @LegalName,
                        @DisplayName, @Email, @Phone, @PasswordHash, 1, 1);
                SELECT * FROM users WHERE id = LAST_INSERT_ID();";

            var created = await _db.QueryFirstOrDefaultAsync<User>(insertSql, newUser);
            return created!;
        }
    }
}
