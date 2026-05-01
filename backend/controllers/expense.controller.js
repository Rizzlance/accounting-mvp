const db = require("../config/db");
const AutoAccounting = require("../services/autoAccounting.service");

exports.createExpense = async (req, res) => {
  try {
    const result = await AutoAccounting.postExpense(req.companyId, req.body);

    res.status(201).json({
      success: true,
      message: "Expense created and posted to ledger",
      data: result,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        e.*,
        el.name AS expense_ledger,
        pl.name AS paid_from_ledger
      FROM expenses e
      LEFT JOIN ledgers el ON el.id = e.expense_ledger_id
      LEFT JOIN ledgers pl ON pl.id = e.paid_from_ledger_id
      WHERE e.company_id = $1
      ORDER BY e.expense_date DESC, e.id DESC
      `,
      [req.companyId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
