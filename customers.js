const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');


// 📥 GET ALL CUSTOMERS (WITH COMPANY FILTER)
router.get('/', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID missing' });
    }

    const result = await pool.query(
      `SELECT * FROM customers
       WHERE company_id = $1
       ORDER BY id DESC`,
      [company_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET CUSTOMERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ➕ ADD CUSTOMER
router.post('/', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);
    const { name, phone, address } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID missing' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Customer name required' });
    }

    const result = await pool.query(
      `INSERT INTO customers (company_id, name, phone, address)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [company_id, name, phone || '', address || '']
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("ADD CUSTOMER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✏️ UPDATE CUSTOMER
router.put('/:id', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);
    const { name, phone, address } = req.body;
    const id = req.params.id;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID missing' });
    }

    await pool.query(
      `UPDATE customers
       SET name=$1, phone=$2, address=$3
       WHERE id=$4 AND company_id=$5`,
      [name, phone, address, id, company_id]
    );

    res.json({ message: 'Customer updated' });

  } catch (err) {
    console.error("UPDATE CUSTOMER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ❌ DELETE CUSTOMER
router.delete('/:id', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);
    const id = req.params.id;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID missing' });
    }

    await pool.query(
      `DELETE FROM customers
       WHERE id=$1 AND company_id=$2`,
      [id, company_id]
    );

    res.json({ message: 'Customer deleted' });

  } catch (err) {
    console.error("DELETE CUSTOMER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;