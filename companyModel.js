const pool = require('../config/db');

const Company = {

  // 🏢 CREATE COMPANY
  create: ({ user_id, company_name, gst_number, address, state }) => {
    return pool.query(
      `INSERT INTO companies (user_id, company_name, gst_number, address, state)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, company_name, gst_number, address, state]
    );
  },

  // 🏢 GET USER COMPANIES
  getByUser: (user_id) => {
    return pool.query(
      `SELECT * FROM companies WHERE user_id = $1`,
      [user_id]
    );
  }

};

module.exports = Company;