const Stock = require("../services/stock.service");

exports.stockIn = async (req, res) => {
  try {
    await Stock.addStock({
      companyId: req.companyId,
      productId: req.body.productId || req.body.product_id,
      quantity: req.body.quantity,
      rate: req.body.rate,
      notes: req.body.notes,
    });

    res.json({ message: "Stock added" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.stockOut = async (req, res) => {
  try {
    await Stock.removeStock({
      companyId: req.companyId,
      productId: req.body.productId || req.body.product_id,
      quantity: req.body.quantity,
      rate: req.body.rate,
      notes: req.body.notes,
    });

    res.json({ message: "Stock removed" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    res.json(await Stock.getStockSummary(req.companyId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.ledger = async (req, res) => {
  try {
    res.json(await Stock.getStockLedger(req.params.productId, req.companyId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
