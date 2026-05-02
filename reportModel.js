const pool = require('../config/db');

module.exports = {
  trialBalance: (company_id) => {
    return pool.query(
      `SELECT 
         l.name,
         SUM(t.debit) AS total_debit,
         SUM(t.credit) AS total_credit
       FROM ledgers l
       LEFT JOIN transactions t ON l.id = t.ledger_id
       WHERE l.company_id = $1
       GROUP BY l.name`,
      [company_id]
    );
  }
};