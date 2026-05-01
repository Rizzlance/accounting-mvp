const LedgerService = require("../services/ledger.service");

exports.ensureDefaults = async (req, res) => {
  try {
    const ledgers = await LedgerService.ensureDefaultLedgers(req.companyId);
    res.json(ledgers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listLedgers = async (req, res) => {
  try {
    res.json(await LedgerService.listLedgers(req.companyId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLedger = async (req, res) => {
  try {
    const ledger = await LedgerService.createLedger(req.companyId, req.body);
    res.status(201).json(ledger);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createEntry = async (req, res) => {
  try {
    const result = await LedgerService.createJournalEntry({
      companyId: req.companyId,
      date: req.body.date || req.body.entry_date,
      narration: req.body.narration || req.body.description,
      voucher_type: req.body.voucher_type,
      entries: req.body.entries || req.body.lines,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    res.json(await LedgerService.getLedgerBalance(req.companyId, req.params.ledgerId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStatement = async (req, res) => {
  try {
    res.json(await LedgerService.getLedgerStatement(req.companyId, req.params.ledgerId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listEntries = async (req, res) => {
  try {
    res.json(await LedgerService.listJournalEntries(req.companyId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
