// Backend/TrampayBackend/Controllers/AnalyticsController.cs
using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Linq;

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

        // ---------------------------------------------------------------------
        // RESUMO GERAL - CORRIGIDO: Calcula saldo corretamente
        // ---------------------------------------------------------------------
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
                        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'concluído' AND currency = 'BRL' THEN ABS(amount) ELSE 0 END), 0) AS Income,
                        COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'concluído' AND currency = 'BRL' THEN ABS(amount) ELSE 0 END), 0) AS Expenses,
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
                    balance,
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

        // ---------------------------------------------------------------------
        // DESPESAS POR CATEGORIA - CORRIGIDO para gráfico de pizza
        // ---------------------------------------------------------------------
        [HttpGet("expenses-by-category")]
        [Authorize]
        public async Task<IActionResult> GetExpensesByCategory()
        {
            try
            {
                if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
                    return Unauthorized();

                var sql = @"
                    SELECT 
                        COALESCE(category, 'Sem categoria') as category, 
                        SUM(ABS(amount)) AS total
                    FROM transactions
                    WHERE type = 'expense' 
                        AND status = 'concluído' 
                        AND currency = 'BRL' 
                        AND owner_user_id = @UserId
                    GROUP BY category
                    ORDER BY total DESC;
                ";

                var result = await _db.QueryAsync(sql, new { UserId = userId });
                
                // Mapear para formato esperado pelo gráfico
                var chartData = result.Select(r => new
                {
                    label = r.category?.ToString() ?? "Sem categoria",
                    value = (decimal)r.total,
                    category = r.category?.ToString() ?? "Sem categoria",
                    total = (decimal)r.total
                }).ToList();

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar expenses-by-category.");
                return StatusCode(500, new { error = "Erro ao carregar despesas por categoria." });
            }
        }

        // ---------------------------------------------------------------------
        // RECEITAS POR CATEGORIA - CORRIGIDO para gráfico de pizza
        // ---------------------------------------------------------------------
        [HttpGet("revenue-by-category")]
        [Authorize]
        public async Task<IActionResult> GetRevenueByCategory()
        {
            try
            {
                if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
                    return Unauthorized();

                var sql = @"
                    SELECT 
                        COALESCE(category, 'Sem categoria') as category, 
                        SUM(ABS(amount)) AS total
                    FROM transactions
                    WHERE type = 'income' 
                        AND status = 'concluído' 
                        AND currency = 'BRL' 
                        AND owner_user_id = @UserId
                    GROUP BY category
                    ORDER BY total DESC;
                ";

                var result = await _db.QueryAsync(sql, new { UserId = userId });
                
                // Mapear para formato esperado pelo gráfico
                var chartData = result.Select(r => new
                {
                    label = r.category?.ToString() ?? "Sem categoria",
                    value = (decimal)r.total,
                    category = r.category?.ToString() ?? "Sem categoria",
                    total = (decimal)r.total
                }).ToList();

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar revenue-by-category.");
                return StatusCode(500, new { error = "Erro ao carregar receitas por categoria." });
            }
        }

        // ---------------------------------------------------------------------
        // FLUXO DE CAIXA - CORRIGIDO para gráfico de linhas
        // ---------------------------------------------------------------------
        [HttpGet("cashflow")]
        [Authorize]
        public async Task<IActionResult> GetCashFlow([FromQuery] string period = "month")
        {
            try
            {
                if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
                    return Unauthorized();

                string sql;
                if (period == "week")
                {
                    sql = @"
                        SELECT 
                            DATE(transaction_date) AS period,
                            SUM(CASE WHEN type='income' AND status='concluído' AND currency='BRL' THEN ABS(amount) ELSE 0 END) AS income,
                            SUM(CASE WHEN type='expense' AND status='concluído' AND currency='BRL' THEN ABS(amount) ELSE 0 END) AS expenses
                        FROM transactions
                        WHERE owner_user_id = @UserId 
                            AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                        GROUP BY period
                        ORDER BY period ASC";
                }
                else
                {
                    sql = @"
                        SELECT 
                            DATE_FORMAT(transaction_date, '%Y-%m') AS period,
                            SUM(CASE WHEN type='income' AND status='concluído' AND currency='BRL' THEN ABS(amount) ELSE 0 END) AS income,
                            SUM(CASE WHEN type='expense' AND status='concluído' AND currency='BRL' THEN ABS(amount) ELSE 0 END) AS expenses
                        FROM transactions
                        WHERE owner_user_id = @UserId 
                            AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                        GROUP BY period
                        ORDER BY period ASC";
                }

                var rows = await _db.QueryAsync(sql, new { UserId = userId });
                
                // Garantir formato consistente
                var chartData = rows.Select(r => new
                {
                    period = r.period?.ToString() ?? "",
                    month = r.period?.ToString() ?? "",
                    day = r.period?.ToString() ?? "",
                    income = (decimal)r.income,
                    expenses = (decimal)r.expenses,
                    revenue = (decimal)r.income
                }).ToList();

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar cashflow.");
                return StatusCode(500, new { error = "Erro ao gerar fluxo de caixa." });
            }
        }

        // ---------------------------------------------------------------------
        // PREVISÃO FINANCEIRA - NOVO ENDPOINT para gráfico de barras
        // ---------------------------------------------------------------------
        [HttpGet("forecast")]
        [Authorize]
        public async Task<IActionResult> GetForecast()
        {
            try
            {
                if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) 
                    return Unauthorized();

                var sql = @"
                    SELECT 
                        CASE 
                            WHEN transaction_date = CURDATE() THEN 'Hoje'
                            WHEN transaction_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'Amanhã'
                            ELSE 'Futuros'
                        END AS label,
                        SUM(CASE WHEN type='income' THEN ABS(amount) ELSE 0 END) AS income,
                        SUM(CASE WHEN type='expense' THEN ABS(amount) ELSE 0 END) AS expenses
                    FROM transactions
                    WHERE owner_user_id = @UserId 
                        AND transaction_date >= CURDATE()
                        AND currency = 'BRL'
                    GROUP BY label
                    ORDER BY 
                        CASE label
                            WHEN 'Hoje' THEN 1
                            WHEN 'Amanhã' THEN 2
                            ELSE 3
                        END";

                var rows = await _db.QueryAsync(sql, new { UserId = userId });
                
                var chartData = rows.Select(r => new
                {
                    label = r.label?.ToString() ?? "",
                    category = r.label?.ToString() ?? "",
                    income = (decimal)r.income,
                    expenses = (decimal)r.expenses,
                    value = (decimal)r.income - (decimal)r.expenses,
                    total = (decimal)r.income + (decimal)r.expenses
                }).ToList();

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar forecast.");
                return StatusCode(500, new { error = "Erro ao gerar previsão." });
            }
        }
    }
}