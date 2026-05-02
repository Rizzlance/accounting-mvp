const pool = require('../config/db');

exports.getGSTR1 = async () => {
  const result = await pool.query(`
    SELECT 
      i.id as invoice_id,
      i.total_amount,
      SUM(CASE WHEN l.name = 'CGST' THEN t.credit ELSE 0 END) as cgst,
      SUM(CASE WHEN l.name = 'SGST' THEN t.credit ELSE 0 END) as sgst
    FROM invoices i
    JOIN transactions t ON i.id = t.invoice_id
    JOIN ledgers l ON t.ledger_id = l.id
    GROUP BY i.id
    ORDER BY i.id
  `);

  return result.rows;
};