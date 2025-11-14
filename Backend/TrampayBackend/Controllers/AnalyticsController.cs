// project/Trampay-main/Backend/TrampayBackend/Controllers/AnalyticsController.cs
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
                var sql = @"
                    SELECT
                        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS Income,
                        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS Expenses,
                        (SELECT COUNT(*) FROM clients) AS Clients,
                        (SELECT COUNT(*) FROM services) AS Services,
                        0 AS InventoryValue,
                        (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE()) AS UpcomingEvents
                    FROM transactions;";

                var result = await _db.QueryFirstOrDefaultAsync(sql);

                return Ok(new
                {
                    income = result.Income,
                    expenses = result.Expenses,
                    clients = result.Clients,
                    services = result.Services,
                    inventoryValue = result.InventoryValue,
                    upcomingEvents = result.UpcomingEvents
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
                var sql = @"
                    SELECT category, SUM(amount) AS total
                    FROM transactions
                    WHERE type = 'expense'
                    GROUP BY category
                    ORDER BY total DESC;
                ";

                var result = await _db.QueryAsync(sql);
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
                var sql = @"
                    SELECT category, SUM(amount) AS total
                    FROM transactions
                    WHERE type = 'income'
                    GROUP BY category
                    ORDER BY total DESC;
                ";

                var result = await _db.QueryAsync(sql);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar revenue-by-category.");
                return StatusCode(500, new { error = "Erro ao carregar receitas por categoria." });
            }
        }

        [HttpGet("categories")]
        [Authorize]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var sql = @"
                    SELECT DISTINCT category 
                    FROM transactions
                    WHERE category IS NOT NULL
                    ORDER BY category;
                ";

                var result = await _db.QueryAsync<string>(sql);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar categorias.");
                return StatusCode(500, new { error = "Erro ao listar categorias." });
            }
        }

        [HttpGet("growth-trends")]
        [Authorize]
        public async Task<IActionResult> GetGrowthTrends()
        {
            try
            {
                var sql = @"
                    SELECT 
                        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                        SUM(CASE WHEN type = 'income' THEN amount END) AS revenue,
                        SUM(CASE WHEN type = 'expense' THEN amount END) AS expenses
                    FROM transactions
                    GROUP BY month
                    ORDER BY month ASC;
                ";

                var result = await _db.QueryAsync(sql);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar crescimento mensal.");
                return StatusCode(500, new { error = "Erro ao gerar tendências de crescimento." });
            }
        }

        [HttpGet("cashflow")]
        [Authorize]
        public async Task<IActionResult> GetCashFlow([FromQuery] string period = "month")
        {
            try
            {
                var sql = period == "week"
                    ? @"SELECT DATE(transaction_date) AS day,
                            SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
                            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses
                        FROM transactions
                        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                        GROUP BY day
                        ORDER BY day ASC"
                    : @"SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                            SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
                            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses
                        FROM transactions
                        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                        GROUP BY month
                        ORDER BY month ASC";

                var rows = await _db.QueryAsync(sql);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar cashflow.");
                return StatusCode(500, new { error = "Erro ao gerar fluxo de caixa." });
            }
        }

        [HttpGet("top-clients")]
        [Authorize]
        public async Task<IActionResult> GetTopClients([FromQuery] int limit = 5)
        {
            try
            {
                var sql = @"SELECT c.id, c.name, COALESCE(SUM(p.amount),0) AS total
                            FROM clients c
                            LEFT JOIN payments p ON p.client_id = c.id
                            GROUP BY c.id, c.name
                            ORDER BY total DESC
                            LIMIT @Limit";
                var rows = await _db.QueryAsync(sql, new { Limit = limit });
                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar top clients.");
                return StatusCode(500, new { error = "Erro ao listar top clientes." });
            }
        }

        [HttpGet("profitable-items")]
        [Authorize]
        public async Task<IActionResult> GetProfitableItems([FromQuery] int limit = 5)
        {
            try
            {
                var sql = @"SELECT id, name, selling_price, cost_price,
                                (selling_price - cost_price) AS margin
                            FROM inventory_items
                            ORDER BY margin DESC
                            LIMIT @Limit";
                var rows = await _db.QueryAsync(sql, new { Limit = limit });
                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar itens lucrativos.");
                return StatusCode(500, new { error = "Erro ao listar itens lucrativos." });
            }
        }
    }
}