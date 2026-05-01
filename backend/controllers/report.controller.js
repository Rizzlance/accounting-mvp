const reportService = require("../services/report.service");

const range = (req) => ({
  startDate: req.query.start || req.query.startDate || null,
  endDate: req.query.end || req.query.endDate || null,
});

exports.trialBalance = async (req, res) => {
  try {
    const { startDate, endDate } = range(req);
    res.json(await reportService.getTrialBalance(req.companyId, startDate, endDate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.profitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = range(req);
    res.json(await reportService.getProfitLoss(req.companyId, startDate, endDate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.balanceSheet = async (req, res) => {
  try {
    const { startDate, endDate } = range(req);
    res.json(await reportService.getBalanceSheet(req.companyId, startDate, endDate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cashFlow = async (req, res) => {
  try {
    const { startDate, endDate } = range(req);
    res.json(await reportService.getCashFlow(req.companyId, startDate, endDate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
