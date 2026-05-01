const GST = require("../services/gst.service");

exports.summary = async (req, res) => {
  try {
    const data = await GST.getSummary(req.companyId, req.query.month, req.query.year);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.gstr1 = async (req, res) => {
  try {
    const data = await GST.getGSTR1(req.companyId, req.query.month, req.query.year);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.calculate = async (req, res) => {
  try {
    const data = GST.calculateGST(
      req.body.items || [],
      req.body.place_of_supply,
      req.body.company_state
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createGSTInvoice = exports.calculate;
