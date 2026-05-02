const router = require('express').Router();
const auth = require('../middleware/auth');
const Report = require('../models/reportModel');

router.get('/trial-balance', auth, async (req, res) => {
  const result = await Report.trialBalance(req.company_id);

  let debit = 0;
  let credit = 0;

  result.rows.forEach(r => {
    debit += Number(r.total_debit || 0);
    credit += Number(r.total_credit || 0);
  });

  res.json({
    data: result.rows,
    totalDebit: debit,
    totalCredit: credit
  });
});

module.exports = router;