const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');

// ==============================
// 📥 GET ALL INVOICE ITEMS
// ==============================
router.get('/', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);

    const result = await pool.query(
      `SELECT ii.*, i.company_id
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE i.company_id = $1`,
      [company_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("INVOICE ITEMS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;