const pool = require('../config/db');

module.exports = {
  create: (company_id, name, type, opening_balance) => {
    return pool.query(
      `INSERT INTO ledgers (company_id, name, type, opening_balance)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [company_id, name, type, opening_balance]
    );
  },

  getAll: (company_id) => {
    return pool.query(
      `SELECT * FROM ledgers WHERE company_id = $1`,
      [company_id]
    );
  }
};