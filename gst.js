const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');

// ==============================
// 📊 GST REPORT (MONTHLY)
// ==============================
router.get('/', auth, async (req, res) => {
  try {

    const company_id = parseInt(req.headers['x-company-id']);
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year required' });
    }

    const result = await pool.query(
      `SELECT ii.*, i.created_at
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE i.company_id = $1
       AND EXTRACT(MONTH FROM i.created_at) = $2
       AND EXTRACT(YEAR FROM i.created_at) = $3`,
      [company_id, month, year]
    );

    let taxable = 0;
    let gstTotal = 0;

    result.rows.forEach(i => {
      const amount = i.qty * i.price;
      const gstAmount = amount * (i.gst / 100);

      taxable += amount;
      gstTotal += gstAmount;
    });

    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    res.json({
      taxable_value: taxable,
      gst_total: gstTotal,
      cgst,
      sgst
    });

  } catch (err) {
    console.error("GST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;