const pool = require('../config/db');

module.exports = {
  create: (company_id, customer_id, subtotal, gst_amount, total_amount) => {
    return pool.query(
      `INSERT INTO invoices (company_id, customer_id, subtotal, gst_amount, total_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [company_id, customer_id, subtotal, gst_amount, total_amount]
    );
  },

  getAll: (company_id) => {
    return pool.query(
      `SELECT * FROM invoices WHERE company_id = $1 ORDER BY id DESC`,
      [company_id]
    );
  }
};