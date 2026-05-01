const db = require("../config/db");

const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

class DashboardService {
  static async getTotalSales(companyId) {
    const result = await db.query(
      `
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM invoices
      WHERE company_id = $1 AND COALESCE(status, 'POSTED') <> 'VOID'
      `,
      [companyId]
    );

    return money(result.rows[0].total);
  }

  static async getTotalExpenses(companyId) {
    const result = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE company_id = $1`,
      [companyId]
    );

    return money(result.rows[0].total);
  }

  static async getCounts(companyId) {
    const result = await db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM customers WHERE company_id = $1) AS customers,
        (SELECT COUNT(*) FROM products WHERE company_id = $1 AND COALESCE(is_active, true) = true) AS products,
        (SELECT COUNT(*) FROM invoices WHERE company_id = $1 AND COALESCE(status, 'POSTED') <> 'VOID') AS invoices
      `,
      [companyId]
    );

    return {
      customers: Number(result.rows[0].customers || 0),
      products: Number(result.rows[0].products || 0),
      invoices: Number(result.rows[0].invoices || 0),
    };
  }

  static async getReceivables(companyId) {
    const result = await db.query(
      `
      SELECT COALESCE(SUM(jel.debit - jel.credit), 0) AS balance
      FROM ledgers l
      LEFT JOIN journal_entry_lines jel ON jel.ledger_id = l.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.company_id = l.company_id
      WHERE l.company_id = $1 AND LOWER(l.name) = 'accounts receivable'
      `,
      [companyId]
    );

    return money(result.rows[0].balance);
  }

  static async getMonthlySales(companyId) {
    const result = await db.query(
      `
      SELECT
        TO_CHAR(invoice_date, 'YYYY-MM') AS month,
        COALESCE(SUM(total_amount), 0) AS total
      FROM invoices
      WHERE company_id = $1 AND COALESCE(status, 'POSTED') <> 'VOID'
      GROUP BY month
      ORDER BY month ASC
      `,
      [companyId]
    );

    return result.rows.map((row) => ({ ...row, total: money(row.total) }));
  }

  static async getMonthlyExpenses(companyId) {
    const result = await db.query(
      `
      SELECT
        TO_CHAR(expense_date, 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE company_id = $1
      GROUP BY month
      ORDER BY month ASC
      `,
      [companyId]
    );

    return result.rows.map((row) => ({ ...row, total: money(row.total) }));
  }

  static async getLowStock(companyId) {
    const result = await db.query(
      `
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0) AS stock
      FROM products p
      LEFT JOIN stock_ledger sl ON sl.product_id = p.id AND sl.company_id = p.company_id
      WHERE p.company_id = $1 AND COALESCE(p.is_active, true) = true
      GROUP BY p.id
      HAVING COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0) <= 5
      ORDER BY stock ASC, p.name ASC
      LIMIT 10
      `,
      [companyId]
    );

    return result.rows.map((row) => ({ ...row, stock: Number(row.stock || 0) }));
  }
}

module.exports = DashboardService;
