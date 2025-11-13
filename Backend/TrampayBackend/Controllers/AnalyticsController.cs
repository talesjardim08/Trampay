using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TrampayBackend.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IDbConnection _db;
        public AnalyticsController(IDbConnection db) => _db = db;

        // Dashboard summary - total receitas, despesas, clientes, serviços
        [HttpGet("summary")]
        [Authorize]
        public async Task<IActionResult> GetSummary([FromQuery] string? period = "month")
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var dateFilter = period switch
            {
                "week" => "DATE_SUB(NOW(), INTERVAL 7 DAY)",
                "month" => "DATE_SUB(NOW(), INTERVAL 30 DAY)",
                "year" => "DATE_SUB(NOW(), INTERVAL 365 DAY)",
                _ => "DATE_SUB(NOW(), INTERVAL 30 DAY)"
            };

            var sql = $@"
                SELECT 
                    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = @UserId AND type = 'receita' AND transaction_date >= {dateFilter}) as totalRevenue,
                    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = @UserId AND type = 'despesa' AND transaction_date >= {dateFilter}) as totalExpenses,
                    (SELECT COUNT(*) FROM clients WHERE owner_user_id = @UserId) as totalClients,
                    (SELECT COUNT(*) FROM services WHERE owner_user_id = @UserId) as totalServices,
                    (SELECT COALESCE(SUM(quantity * selling_price), 0) FROM inventory_items WHERE owner_user_id = @UserId) as inventoryValue,
                    (SELECT COUNT(*) FROM events WHERE owner_user_id = @UserId AND event_date >= CURDATE() AND status = 'pending') as upcomingEvents
            ";

            var summary = await _db.QueryFirstOrDefaultAsync(sql, new { UserId = userId });
            return Ok(summary);
        }

        // Gráfico de fluxo de caixa mensal (receitas vs despesas por mês)
        [HttpGet("cashflow")]
        [Authorize]
        public async Task<IActionResult> GetCashFlow([FromQuery] int months = 6)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"
                SELECT 
                    DATE_FORMAT(transaction_date, '%Y-%m') as month,
                    SUM(CASE WHEN type = 'receita' THEN amount ELSE 0 END) as revenue,
                    SUM(CASE WHEN type = 'despesa' THEN amount ELSE 0 END) as expenses
                FROM transactions
                WHERE user_id = @UserId 
                AND transaction_date >= DATE_SUB(NOW(), INTERVAL @Months MONTH)
                GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
                ORDER BY month ASC
            ";

            var data = await _db.QueryAsync(sql, new { UserId = userId, Months = months });
            return Ok(data);
        }

        // Distribuição de despesas por categoria (gráfico de pizza)
        [HttpGet("expenses-by-category")]
        [Authorize]
        public async Task<IActionResult> GetExpensesByCategory([FromQuery] string? period = "month")
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var dateFilter = period switch
            {
                "week" => "DATE_SUB(NOW(), INTERVAL 7 DAY)",
                "month" => "DATE_SUB(NOW(), INTERVAL 30 DAY)",
                "year" => "DATE_SUB(NOW(), INTERVAL 365 DAY)",
                _ => "DATE_SUB(NOW(), INTERVAL 30 DAY)"
            };

            var sql = $@"
                SELECT 
                    category,
                    SUM(amount) as total,
                    COUNT(*) as count
                FROM transactions
                WHERE user_id = @UserId 
                AND type = 'despesa'
                AND transaction_date >= {dateFilter}
                GROUP BY category
                ORDER BY total DESC
            ";

            var data = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(data);
        }

        // Distribuição de receitas por categoria
        [HttpGet("revenue-by-category")]
        [Authorize]
        public async Task<IActionResult> GetRevenueByCategory([FromQuery] string? period = "month")
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var dateFilter = period switch
            {
                "week" => "DATE_SUB(NOW(), INTERVAL 7 DAY)",
                "month" => "DATE_SUB(NOW(), INTERVAL 30 DAY)",
                "year" => "DATE_SUB(NOW(), INTERVAL 365 DAY)",
                _ => "DATE_SUB(NOW(), INTERVAL 30 DAY)"
            };

            var sql = $@"
                SELECT 
                    category,
                    SUM(amount) as total,
                    COUNT(*) as count
                FROM transactions
                WHERE user_id = @UserId 
                AND type = 'receita'
                AND transaction_date >= {dateFilter}
                GROUP BY category
                ORDER BY total DESC
            ";

            var data = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(data);
        }

        // Top clientes (por valor de transações)
        [HttpGet("top-clients")]
        [Authorize]
        public async Task<IActionResult> GetTopClients([FromQuery] int limit = 10)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"
                SELECT 
                    c.id,
                    c.name,
                    COALESCE(SUM(t.amount), 0) as totalRevenue,
                    COUNT(t.id) as transactionCount
                FROM clients c
                LEFT JOIN transactions t ON t.client_id = c.id AND t.type = 'receita'
                WHERE c.owner_user_id = @UserId
                GROUP BY c.id, c.name
                ORDER BY totalRevenue DESC
                LIMIT @Limit
            ";

            var data = await _db.QueryAsync(sql, new { UserId = userId, Limit = limit });
            return Ok(data);
        }

        // Produtos/serviços mais lucrativos
        [HttpGet("profitable-items")]
        [Authorize]
        public async Task<IActionResult> GetProfitableItems([FromQuery] int limit = 10)
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"
                SELECT 
                    name,
                    category,
                    quantity,
                    cost_price,
                    selling_price,
                    (selling_price - cost_price) as profit_per_unit,
                    (selling_price - cost_price) * quantity as total_potential_profit
                FROM inventory_items
                WHERE owner_user_id = @UserId
                AND quantity > 0
                ORDER BY total_potential_profit DESC
                LIMIT @Limit
            ";

            var data = await _db.QueryAsync(sql, new { UserId = userId, Limit = limit });
            return Ok(data);
        }

        // Tendências de crescimento (comparação mês atual vs mês anterior)
        [HttpGet("growth-trends")]
        [Authorize]
        public async Task<IActionResult> GetGrowthTrends()
        {
            if (!long.TryParse(User.FindFirst("id")?.Value, out var userId)) return Unauthorized();

            var sql = @"
                SELECT 
                    'revenue' as metric,
                    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = @UserId AND type = 'receita' AND MONTH(transaction_date) = MONTH(NOW()) AND YEAR(transaction_date) = YEAR(NOW())) as current_month,
                    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = @UserId AND type = 'receita' AND MONTH(transaction_date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(transaction_date) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))) as previous_month
                UNION ALL
                SELECT 
                    'expenses' as metric,
                    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = @UserId AND type = 'despesa' AND MONTH(transaction_date) = MONTH(NOW()) AND YEAR(transaction_date) = YEAR(NOW())) as current_month,
                    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = @UserId AND type = 'despesa' AND MONTH(transaction_date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(transaction_date) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))) as previous_month
                UNION ALL
                SELECT 
                    'profit' as metric,
                    (SELECT COALESCE(SUM(CASE WHEN type = 'receita' THEN amount ELSE -amount END), 0) FROM transactions WHERE user_id = @UserId AND MONTH(transaction_date) = MONTH(NOW()) AND YEAR(transaction_date) = YEAR(NOW())) as current_month,
                    (SELECT COALESCE(SUM(CASE WHEN type = 'receita' THEN amount ELSE -amount END), 0) FROM transactions WHERE user_id = @UserId AND MONTH(transaction_date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(transaction_date) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))) as previous_month
            ";

            var data = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(data);
        }
    }
}
