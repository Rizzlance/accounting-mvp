const router = require('express').Router();
const auth = require('../middleware/auth');
const Ledger = require('../models/ledgerModel');

router.post('/', auth, async (req, res) => {
  const { name, type, opening_balance } = req.body;

  const result = await Ledger.create(
    req.company_id,
    name,
    type,
    opening_balance
  );

  res.json(result.rows[0]);
});

router.get('/', auth, async (req, res) => {
  const result = await Ledger.getAll(req.company_id);
  res.json(result.rows);
});

module.exports = router;