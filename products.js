const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');

// 📥 GET ALL PRODUCTS
router.get('/', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);

    const result = await pool.query(
      `SELECT * FROM products
       WHERE company_id = $1
       ORDER BY id DESC`,
      [company_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ➕ ADD PRODUCT
router.post('/', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);
    const { name, sale_price, gst_rate, stock } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name required' });
    }

    const result = await pool.query(
      `INSERT INTO products (company_id, name, sale_price, gst_rate, stock)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        company_id,
        name,
        Number(sale_price) || 0,
        Number(gst_rate) || 0,
        Number(stock) || 0
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✏️ UPDATE PRODUCT
router.put('/:id', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);
    const { name, sale_price, gst_rate, stock } = req.body;

    await pool.query(
      `UPDATE products
       SET name=$1, sale_price=$2, gst_rate=$3, stock=$4
       WHERE id=$5 AND company_id=$6`,
      [
        name,
        Number(sale_price),
        Number(gst_rate),
        Number(stock),
        req.params.id,
        company_id
      ]
    );

    res.json({ message: 'Product updated' });

  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ❌ DELETE PRODUCT
router.delete('/:id', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);

    await pool.query(
      `DELETE FROM products WHERE id=$1 AND company_id=$2`,
      [req.params.id, company_id]
    );

    res.json({ message: 'Product deleted' });

  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;