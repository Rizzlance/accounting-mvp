const db = require("../config/db");
const AutoAccounting = require("../services/autoAccounting.service");

exports.createPayment = async (req, res) => {
  try {
    const result = await AutoAccounting.postPayment(req.companyId, req.body);

    res.status(201).json({
      message: "Payment recorded and posted",
      data: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT *
      FROM payments
      WHERE company_id = $1
      ORDER BY payment_date DESC, id DESC
      `,
      [req.companyId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
