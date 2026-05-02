const pool = require('../config/db');

module.exports = {

  findByEmail: (email) => {
    return pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
  },

  create: ({ name, email, password }) => {
    return pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, password]
    );
  }

};