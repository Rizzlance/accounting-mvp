const router = require('express').Router();
const auth = require('../middleware/auth');
const Dashboard = require('../models/dashboardModel');

router.get('/summary', auth, async (req, res) => {
  try {

    if (!req.company_id) {
      return res.status(400).json({ message: 'Company not selected' });
    }

    const data = await Dashboard.getSummary(req.company_id);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;