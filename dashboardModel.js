const pool = require('../config/db');

module.exports = {

  getSummary: async (company_id) => {

    // 📊 TOTAL SALES
    const sales = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total_sales
       FROM invoices
       WHERE company_id = $1`,
      [company_id]
    );

    // 📦 TOTAL PURCHASE (you must have purchase table)
    const purchase = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total_purchase
       FROM purchases
       WHERE company_id = $1`,
      [company_id]
    );

    // 👥 CUSTOMERS COUNT
    const customers = await pool.query(
      `SELECT COUNT(*) FROM customers WHERE company_id = $1`,
      [company_id]
    );

    // 📦 PRODUCTS COUNT
    const products = await pool.query(
      `SELECT COUNT(*) FROM products WHERE company_id = $1`,
      [company_id]
    );

    // 🧾 INVOICES COUNT
    const invoices = await pool.query(
      `SELECT COUNT(*) FROM invoices WHERE company_id = $1`,
      [company_id]
    );

    // 💰 PROFIT CALCULATION
    const total_sales = Number(sales.rows[0].total_sales || 0);
    const total_purchase = Number(purchase.rows[0].total_purchase || 0);

    const profit = total_sales - total_purchase;

    return {
      total_sales,
      total_purchase,
      profit,
      total_customers: customers.rows[0].count,
      total_products: products.rows[0].count,
      total_invoices: invoices.rows[0].count
    };
  }

};