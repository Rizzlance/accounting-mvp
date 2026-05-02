const pool = require('../config/db');

module.exports = {
  create: (company_id, name, gst_rate, sale_price, stock) => {
    return pool.query(
      `INSERT INTO products (company_id, name, gst_rate, sale_price, stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [company_id, name, gst_rate, sale_price, stock]
    );
  },

  getAll: (company_id) => {
    return pool.query(
      `SELECT * FROM products WHERE company_id = $1`,
      [company_id]
    );
  }
};