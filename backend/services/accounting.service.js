const db = require("../config/db");

const DEFAULT_LEDGERS = [
  { name: "Cash", type: "Asset", group_name: "Cash in Hand" },
  { name: "Bank", type: "Asset", group_name: "Bank Accounts" },
  { name: "Accounts Receivable", type: "Asset", group_name: "Sundry Debtors" },
  { name: "Accounts Payable", type: "Liability", group_name: "Sundry Creditors" },
  { name: "Sales", type: "Income", group_name: "Sales Accounts" },
  { name: "Purchases", type: "Expense", group_name: "Purchase Accounts" },
  { name: "GST Output", type: "Liability", group_name: "Duties and Taxes" },
  { name: "GST Input", type: "Asset", group_name: "Duties and Taxes" },
  { name: "Expenses", type: "Expense", group_name: "Indirect Expenses" },
  { name: "Inventory", type: "Asset", group_name: "Stock in Hand" },
  { name: "Cost of Goods Sold", type: "Expense", group_name: "Direct Expenses" },
  { name: "Opening Balance Equity", type: "Equity", group_name: "Capital Account" },
];

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const getClient = async (client) => {
  if (client) return { client, shouldRelease: false };
  return { client: await db.connect(), shouldRelease: true };
};

const ledgerMap = (rows) => {
  return rows.reduce((acc, ledger) => {
    acc[ledger.name] = ledger;
    return acc;
  }, {});
};

exports.getOrCreateLedger = async (companyId, ledger, client) => {
  const existing = await client.query(
    `SELECT * FROM ledgers WHERE company_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [companyId, ledger.name]
  );

  if (existing.rows.length) {
    return existing.rows[0];
  }

  const created = await client.query(
    `
    INSERT INTO ledgers (company_id, name, type, group_name, opening_balance, is_system)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      companyId,
      ledger.name,
      ledger.type,
      ledger.group_name || ledger.groupName || null,
      Number(ledger.opening_balance || 0),
      Boolean(ledger.is_system ?? ledger.isSystem ?? true),
    ]
  );

  return created.rows[0];
};

exports.ensureDefaultLedgers = async (companyId, clientOverride) => {
  const { client, shouldRelease } = await getClient(clientOverride);

  try {
    if (shouldRelease) await client.query("BEGIN");

    const ledgers = [];
    for (const ledger of DEFAULT_LEDGERS) {
      ledgers.push(await exports.getOrCreateLedger(companyId, { ...ledger, is_system: true }, client));
    }

    if (shouldRelease) await client.query("COMMIT");

    return ledgerMap(ledgers);
  } catch (err) {
    if (shouldRelease) await client.query("ROLLBACK");
    throw err;
  } finally {
    if (shouldRelease) client.release();
  }
};

exports.listLedgers = async (companyId) => {
  const result = await db.query(
    `
    SELECT
      l.*,
      COALESCE(SUM(jel.debit), 0) AS total_debit,
      COALESCE(SUM(jel.credit), 0) AS total_credit
    FROM ledgers l
    LEFT JOIN journal_entry_lines jel ON jel.ledger_id = l.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.company_id = l.company_id
    WHERE l.company_id = $1
    GROUP BY l.id
    ORDER BY l.type, l.name
    `,
    [companyId]
  );

  return result.rows.map((ledger) => {
    const debit = Number(ledger.total_debit || 0);
    const credit = Number(ledger.total_credit || 0);
    const opening = Number(ledger.opening_balance || 0);

    return {
      ...ledger,
      total_debit: debit,
      total_credit: credit,
      balance: roundMoney(opening + debit - credit),
    };
  });
};

exports.createLedger = async (companyId, data) => {
  if (!data.name) {
    throw new Error("Ledger name is required");
  }

  const result = await db.query(
    `
    INSERT INTO ledgers (company_id, name, type, group_name, opening_balance, is_system)
    VALUES ($1, $2, $3, $4, $5, false)
    RETURNING *
    `,
    [
      companyId,
      data.name,
      data.type || "Asset",
      data.group_name || data.groupName || null,
      Number(data.opening_balance || data.openingBalance || 0),
    ]
  );

  return result.rows[0];
};

exports.createEntry = async (entryData, options = {}) => {
  const lines = entryData.lines || entryData.entries || [];
  if (lines.length < 2) {
    throw new Error("A journal entry requires at least two ledger lines");
  }

  const normalizedLines = lines.map((line) => ({
    ledger_id: line.ledger_id || line.ledgerId,
    debit: roundMoney(line.debit),
    credit: roundMoney(line.credit),
    description: line.description || null,
  }));

  for (const line of normalizedLines) {
    if (!line.ledger_id) {
      throw new Error("Every journal line needs a ledger");
    }
    if (line.debit < 0 || line.credit < 0) {
      throw new Error("Debit and credit values cannot be negative");
    }
    if (line.debit > 0 && line.credit > 0) {
      throw new Error("A journal line cannot have both debit and credit");
    }
  }

  const totalDebit = roundMoney(normalizedLines.reduce((sum, line) => sum + line.debit, 0));
  const totalCredit = roundMoney(normalizedLines.reduce((sum, line) => sum + line.credit, 0));

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal is not balanced. Debit ${totalDebit} does not equal credit ${totalCredit}`);
  }

  const { client: clientOverride } = options;
  const { client, shouldRelease } = await getClient(clientOverride);

  try {
    if (shouldRelease) await client.query("BEGIN");

    const ledgerCheck = await client.query(
      `
      SELECT id FROM ledgers
      WHERE company_id = $1 AND id = ANY($2::int[])
      `,
      [entryData.companyId, normalizedLines.map((line) => Number(line.ledger_id))]
    );

    if (ledgerCheck.rows.length !== new Set(normalizedLines.map((line) => Number(line.ledger_id))).size) {
      throw new Error("One or more ledgers do not belong to this company");
    }

    const header = await client.query(
      `
      INSERT INTO journal_entries
      (company_id, entry_date, voucher_type, voucher_no, reference_type, reference_id, description, narration)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        entryData.companyId,
        entryData.entry_date || entryData.date || new Date(),
        entryData.voucher_type || entryData.voucherType || "JOURNAL",
        entryData.voucher_no || entryData.voucherNo || null,
        entryData.reference_type || entryData.referenceType || null,
        entryData.reference_id || entryData.referenceId || null,
        entryData.description || entryData.narration || null,
        entryData.narration || entryData.description || null,
      ]
    );

    const journalEntryId = header.rows[0].id;

    for (const line of normalizedLines) {
      await client.query(
        `
        INSERT INTO journal_entry_lines
        (journal_entry_id, ledger_id, debit, credit, description)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [journalEntryId, line.ledger_id, line.debit, line.credit, line.description]
      );
    }

    if (shouldRelease) await client.query("COMMIT");

    return {
      ...header.rows[0],
      total_debit: totalDebit,
      total_credit: totalCredit,
    };
  } catch (err) {
    if (shouldRelease) await client.query("ROLLBACK");
    throw err;
  } finally {
    if (shouldRelease) client.release();
  }
};

exports.reverseEntry = async ({ companyId, reference_type, reference_id, description }, options = {}) => {
  const client = options.client;

  const original = await client.query(
    `
    SELECT je.id
    FROM journal_entries je
    WHERE je.company_id = $1
      AND je.reference_type = $2
      AND je.reference_id = $3
    ORDER BY je.id DESC
    LIMIT 1
    `,
    [companyId, reference_type, reference_id]
  );

  if (!original.rows.length) return null;

  const lines = await client.query(
    `
    SELECT ledger_id, debit, credit
    FROM journal_entry_lines
    WHERE journal_entry_id = $1
    `,
    [original.rows[0].id]
  );

  return exports.createEntry(
    {
      companyId,
      voucher_type: "REVERSAL",
      reference_type: `${reference_type}_VOID`,
      reference_id,
      description,
      lines: lines.rows.map((line) => ({
        ledger_id: line.ledger_id,
        debit: Number(line.credit || 0),
        credit: Number(line.debit || 0),
      })),
    },
    { client }
  );
};

exports.getLedgerBalance = async (companyId, ledgerId) => {
  const result = await db.query(
    `
    SELECT
      l.opening_balance,
      COALESCE(SUM(jel.debit), 0) AS total_debit,
      COALESCE(SUM(jel.credit), 0) AS total_credit
    FROM ledgers l
    LEFT JOIN journal_entry_lines jel ON jel.ledger_id = l.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.company_id = l.company_id
    WHERE l.company_id = $1 AND l.id = $2
    GROUP BY l.id
    `,
    [companyId, ledgerId]
  );

  if (!result.rows.length) {
    throw new Error("Ledger not found");
  }

  const row = result.rows[0];
  const debit = Number(row.total_debit || 0);
  const credit = Number(row.total_credit || 0);
  const opening = Number(row.opening_balance || 0);

  return {
    debit,
    credit,
    opening,
    balance: roundMoney(opening + debit - credit),
  };
};

exports.getLedgerStatement = async (companyId, ledgerId) => {
  const result = await db.query(
    `
    SELECT
      je.id AS journal_entry_id,
      je.entry_date,
      je.voucher_type,
      je.voucher_no,
      COALESCE(je.narration, je.description) AS narration,
      jel.ledger_id,
      jel.debit,
      jel.credit,
      jel.description
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE je.company_id = $1 AND jel.ledger_id = $2
    ORDER BY je.entry_date ASC, je.id ASC, jel.id ASC
    `,
    [companyId, ledgerId]
  );

  let running = 0;

  return result.rows.map((row) => {
    running = roundMoney(running + Number(row.debit || 0) - Number(row.credit || 0));
    return {
      ...row,
      debit: Number(row.debit || 0),
      credit: Number(row.credit || 0),
      running_balance: running,
    };
  });
};

exports.listJournalEntries = async (companyId) => {
  const result = await db.query(
    `
    SELECT
      je.*,
      COALESCE(SUM(jel.debit), 0) AS total_debit,
      COALESCE(SUM(jel.credit), 0) AS total_credit
    FROM journal_entries je
    LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
    WHERE je.company_id = $1
    GROUP BY je.id
    ORDER BY je.entry_date DESC, je.id DESC
    LIMIT 100
    `,
    [companyId]
  );

  return result.rows;
};

exports.DEFAULT_LEDGERS = DEFAULT_LEDGERS;
