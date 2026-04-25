const router = require('express').Router();
const auth = require('../middleware/auth');
const Company = require('../models/companyModel');

// 🏢 CREATE COMPANY
router.post('/', auth, async (req, res) => {
  try {
    const { company_name, gst_number, address, state } = req.body;

    const result = await Company.create({
      user_id: req.user.id,
      company_name,
      gst_number,
      address,
      state
    });

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// 🏢 GET COMPANIES (IMPORTANT FIX)
router.get('/', auth, async (req, res) => {
  try {
    const result = await Company.getByUser(req.user.id);

    // ✅ ALWAYS RETURN ARRAY
    res.status(200).json(result.rows || []);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;