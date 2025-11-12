using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly IDbConnection _db;

        public UsersController(IDbConnection db)
        {
            _db = db;
        }

        // GET /api/users/me - Retorna dados do usuário logado
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                    return Unauthorized(new { error = "Token inválido." });

                var sql = @"SELECT id, email, display_name, legal_name, account_type, document_type, 
                                   document_number, phone, is_active, is_verified, is_premium, premium_until,
                                   address_street, address_number, address_complement, address_neighborhood,
                                   address_city, address_state, address_zip, birth_date, created_at, updated_at
                            FROM users WHERE id = @Id LIMIT 1";
                
                var user = await _db.QueryFirstOrDefaultAsync(sql, new { Id = userId });

                if (user == null)
                    return NotFound(new { error = "Usuário não encontrado." });

                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS/ME ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao obter perfil do usuário");
            }
        }

        // GET /api/users/{id} - Retorna dados de um usuário específico (apenas o próprio usuário pode ver)
        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                    return Unauthorized(new { error = "Token inválido." });

                // Usuário só pode ver seus próprios dados
                if (userId != id)
                    return Forbid();

                var sql = @"SELECT id, email, display_name, legal_name, account_type, document_type, 
                                   document_number, phone, is_active, is_verified, is_premium, premium_until,
                                   address_street, address_number, address_complement, address_neighborhood,
                                   address_city, address_state, address_zip, birth_date, created_at, updated_at
                            FROM users WHERE id = @Id LIMIT 1";
                
                var user = await _db.QueryFirstOrDefaultAsync(sql, new { Id = id });

                if (user == null)
                    return NotFound(new { error = "Usuário não encontrado." });

                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS/GET ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao obter dados do usuário");
            }
        }

        // PUT /api/users/{id} - Atualiza dados do usuário
        [HttpPut("{id:long}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] JsonElement body)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                    return Unauthorized(new { error = "Token inválido." });

                // Usuário só pode atualizar seus próprios dados
                if (userId != id)
                    return Forbid();

                // Extrair campos do body
                var displayName = GetString(body, "display_name") ?? GetString(body, "displayName");
                var legalName = GetString(body, "legal_name") ?? GetString(body, "legalName");
                var phone = GetString(body, "phone") ?? GetString(body, "Phone");
                var addressStreet = GetString(body, "address_street") ?? GetString(body, "addressStreet");
                var addressNumber = GetString(body, "address_number") ?? GetString(body, "addressNumber");
                var addressComplement = GetString(body, "address_complement") ?? GetString(body, "addressComplement");
                var addressNeighborhood = GetString(body, "address_neighborhood") ?? GetString(body, "addressNeighborhood");
                var addressCity = GetString(body, "address_city") ?? GetString(body, "addressCity");
                var addressState = GetString(body, "address_state") ?? GetString(body, "addressState");
                var addressZip = GetString(body, "address_zip") ?? GetString(body, "addressZip");

                // Montar SQL dinamicamente apenas com campos fornecidos
                var updates = new List<string>();
                var parameters = new Dictionary<string, object> { { "Id", id } };

                if (!string.IsNullOrEmpty(displayName))
                {
                    updates.Add("display_name = @DisplayName");
                    parameters["DisplayName"] = displayName;
                }
                if (!string.IsNullOrEmpty(legalName))
                {
                    updates.Add("legal_name = @LegalName");
                    parameters["LegalName"] = legalName;
                }
                if (!string.IsNullOrEmpty(phone))
                {
                    updates.Add("phone = @Phone");
                    parameters["Phone"] = phone;
                }
                if (!string.IsNullOrEmpty(addressStreet))
                {
                    updates.Add("address_street = @AddressStreet");
                    parameters["AddressStreet"] = addressStreet;
                }
                if (!string.IsNullOrEmpty(addressNumber))
                {
                    updates.Add("address_number = @AddressNumber");
                    parameters["AddressNumber"] = addressNumber;
                }
                if (!string.IsNullOrEmpty(addressComplement))
                {
                    updates.Add("address_complement = @AddressComplement");
                    parameters["AddressComplement"] = addressComplement;
                }
                if (!string.IsNullOrEmpty(addressNeighborhood))
                {
                    updates.Add("address_neighborhood = @AddressNeighborhood");
                    parameters["AddressNeighborhood"] = addressNeighborhood;
                }
                if (!string.IsNullOrEmpty(addressCity))
                {
                    updates.Add("address_city = @AddressCity");
                    parameters["AddressCity"] = addressCity;
                }
                if (!string.IsNullOrEmpty(addressState))
                {
                    updates.Add("address_state = @AddressState");
                    parameters["AddressState"] = addressState;
                }
                if (!string.IsNullOrEmpty(addressZip))
                {
                    updates.Add("address_zip = @AddressZip");
                    parameters["AddressZip"] = addressZip;
                }

                if (updates.Count == 0)
                    return BadRequest(new { error = "Nenhum campo para atualizar." });

                updates.Add("updated_at = NOW()");

                var sql = $"UPDATE users SET {string.Join(", ", updates)} WHERE id = @Id";
                var affected = await _db.ExecuteAsync(sql, parameters);

                if (affected == 0)
                    return NotFound(new { error = "Usuário não encontrado." });

                // Retornar dados atualizados
                var sqlSelect = @"SELECT id, email, display_name, legal_name, account_type, document_type, 
                                         document_number, phone, is_active, is_verified, is_premium, premium_until,
                                         address_street, address_number, address_complement, address_neighborhood,
                                         address_city, address_state, address_zip, birth_date, created_at, updated_at
                                  FROM users WHERE id = @Id LIMIT 1";
                
                var updatedUser = await _db.QueryFirstOrDefaultAsync(sqlSelect, new { Id = id });

                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS/UPDATE ERROR] {ex.Message}");
                return Problem(detail: ex.Message, title: "Erro ao atualizar dados do usuário");
            }
        }

        // Helper para extrair strings do JsonElement
        private string? GetString(JsonElement body, string name)
        {
            try
            {
                if (body.ValueKind != JsonValueKind.Object)
                    return null;

                if (body.TryGetProperty(name, out JsonElement prop))
                {
                    if (prop.ValueKind == JsonValueKind.String) 
                        return prop.GetString();
                    else 
                        return prop.ToString();
                }

                foreach (var p in body.EnumerateObject())
                {
                    if (string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase))
                        return p.Value.ValueKind == JsonValueKind.String ? p.Value.GetString() : p.Value.ToString();
                }
            }
            catch { }
            return null;
        }
    }
}