const accounting = require("./accounting.service");

class LedgerService {
  static async ensureDefaultLedgers(companyId) {
    return accounting.ensureDefaultLedgers(companyId);
  }

  static async listLedgers(companyId) {
    await accounting.ensureDefaultLedgers(companyId);
    return accounting.listLedgers(companyId);
  }

  static async createLedger(companyId, data) {
    return accounting.createLedger(companyId, data);
  }

  static async createJournalEntry({ companyId, date, narration, entries, voucher_type }) {
    return accounting.createEntry({
      companyId,
      entry_date: date || new Date(),
      narration,
      voucher_type: voucher_type || "JOURNAL",
      lines: entries,
    });
  }

  static async getLedgerBalance(companyId, ledgerId) {
    return accounting.getLedgerBalance(companyId, ledgerId);
  }

  static async getLedgerStatement(companyId, ledgerId) {
    return accounting.getLedgerStatement(companyId, ledgerId);
  }

  static async listJournalEntries(companyId) {
    return accounting.listJournalEntries(companyId);
  }
}

module.exports = LedgerService;
