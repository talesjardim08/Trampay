// Backend/TrampayBackend/Controllers/AnalyticsController.cs
using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IDbConnection _db;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(IDbConnection db, ILogger<AnalyticsController> logger)
        {
            _db = db;
            _logger = logger;
        }

        
[HttpGet("summary")]
[Authorize]
public async Task<IActionResult> GetSummary()
{
    try
    {
        if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
            return Unauthorized();

        var sql = @"
            SELECT
                COALESCE(SUM(CASE WHEN type = 'income' AND status = 'concluído' AND currency = 'BRL' THEN amount ELSE 0 END), 0) AS Income,
                COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'concluído' AND currency = 'BRL' THEN amount ELSE 0 END), 0) AS Expenses,
                (SELECT COUNT(*) FROM clients WHERE owner_user_id = @UserId) AS Clients,
                (SELECT COUNT(*) FROM services WHERE owner_user_id = @UserId) AS Services,
                0 AS InventoryValue,
                (SELECT COUNT(*) FROM events WHERE owner_user_id = @UserId AND event_date >= CURRENT_DATE()) AS UpcomingEvents
            FROM transactions
            WHERE owner_user_id = @UserId;";

        var result = await _db.QueryFirstOrDefaultAsync(sql, new { UserId = userId });
        
        decimal income = result?.Income ?? 0;
        decimal expenses = result?.Expenses ?? 0;
        decimal balance = income - expenses;

        return Ok(new
        {
            income,
            expenses,
            balance, // ADICIONAR balance ao retorno
            clients = result?.Clients ?? 0,
            services = result?.Services ?? 0,
            inventoryValue = result?.InventoryValue ?? 0,
            upcomingEvents = result?.UpcomingEvents ?? 0
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erro ao gerar summary analytics.");
        return StatusCode(500, new { error = "Erro interno ao obter o resumo." });
    }
}

        [HttpGet("expenses-by-category")]
        [Authorize]
        public async Task<IActionResult> GetExpensesByCategory()
        {
            try
            {
                if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
                    return Unauthorized();

                var sql = @"
                    SELECT category, SUM(amount) AS total
                    FROM transactions
                    WHERE type = 'expense' AND status = 'concluído' AND currency = 'BRL' AND owner_user_id = @UserId
                    GROUP BY category
                    ORDER BY total DESC;
                ";

                var result = await _db.QueryAsync(sql, new { UserId = userId });
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar expenses-by-category.");
                return StatusCode(500, new { error = "Erro ao carregar despesas por categoria." });
            }
        }

        [HttpGet("revenue-by-category")]
        [Authorize]
        public async Task<IActionResult> GetRevenueByCategory()
        {
            try
            {
                if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
                    return Unauthorized();

                var sql = @"
                    SELECT category, SUM(amount) AS total
                    FROM transactions
                    WHERE type = 'income' AND status = 'concluído' AND currency = 'BRL' AND owner_user_id = @UserId
                    GROUP BY category
                    ORDER BY total DESC;
                ";

                var result = await _db.QueryAsync(sql, new { UserId = userId });
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar revenue-by-category.");
                return StatusCode(500, new { error = "Erro ao carregar receitas por categoria." });
            }
        }

        [HttpGet("cashflow")]
        [Authorize]
        public async Task<IActionResult> GetCashFlow([FromQuery] string period = "month")
        {
            try
            {
                if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
                    return Unauthorized();

                var sql = period == "week"
                    ? @"SELECT DATE(transaction_date) AS day,
                            SUM(CASE WHEN type='income' AND status='concluído' AND currency='BRL' THEN amount ELSE 0 END) AS income,
                            SUM(CASE WHEN type='expense' AND status='concluído' AND currency='BRL' THEN amount ELSE 0 END) AS expenses
                        FROM transactions
                        WHERE owner_user_id = @UserId AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                        GROUP BY day
                        ORDER BY day ASC"
                    : @"SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                            SUM(CASE WHEN type='income' AND status='concluído' AND currency='BRL' THEN amount ELSE 0 END) AS income,
                            SUM(CASE WHEN type='expense' AND status='concluído' AND currency='BRL' THEN amount ELSE 0 END) AS expenses
                        FROM transactions
                        WHERE owner_user_id = @UserId AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                        GROUP BY month
                        ORDER BY month ASC";

                var rows = await _db.QueryAsync(sql, new { UserId = userId });
                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar cashflow.");
                return StatusCode(500, new { error = "Erro ao gerar fluxo de caixa." });
            }
        }
    }
}
