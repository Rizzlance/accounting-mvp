const pool = require('../config/db');

module.exports = {
  create: (company_id, name, phone, email, address) => {
    return pool.query(
      `INSERT INTO customers (company_id, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [company_id, name, phone, email, address]
    );
  },

  getAll: (company_id) => {
    return pool.query(
      `SELECT * FROM customers WHERE company_id = $1`,
      [company_id]
    );
  }
};