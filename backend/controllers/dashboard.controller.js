const Dashboard = require("../services/dashboard.service");

exports.getDashboard = async (req, res) => {
  try {
    const companyId = req.companyId;

    const [
      sales,
      expenses,
      counts,
      receivables,
      monthlySales,
      monthlyExpenses,
      lowStock,
    ] = await Promise.all([
      Dashboard.getTotalSales(companyId),
      Dashboard.getTotalExpenses(companyId),
      Dashboard.getCounts(companyId),
      Dashboard.getReceivables(companyId),
      Dashboard.getMonthlySales(companyId),
      Dashboard.getMonthlyExpenses(companyId),
      Dashboard.getLowStock(companyId),
    ]);

    res.json({
      sales,
      expenses,
      profit: sales - expenses,
      receivables,
      counts,
      monthlySales,
      monthlyExpenses,
      lowStock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
