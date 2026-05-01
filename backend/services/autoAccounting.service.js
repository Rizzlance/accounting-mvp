const db = require("../config/db");
const accounting = require("./accounting.service");

const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

exports.handleSalesInvoice = async ({
  companyId,
  invoiceId,
  subtotal,
  gstTotal,
  total,
  client,
}) => {
  const ledgers = await accounting.ensureDefaultLedgers(companyId, client);
  const lines = [
    {
      ledger_id: ledgers["Accounts Receivable"].id,
      debit: money(total),
      credit: 0,
    },
    {
      ledger_id: ledgers.Sales.id,
      debit: 0,
      credit: money(subtotal),
    },
  ];

  if (money(gstTotal) > 0) {
    lines.push({
      ledger_id: ledgers["GST Output"].id,
      debit: 0,
      credit: money(gstTotal),
    });
  }

  return accounting.createEntry(
    {
      companyId,
      voucher_type: "SALES",
      reference_type: "INVOICE",
      reference_id: invoiceId,
      description: `Sales invoice #${invoiceId}`,
      lines,
    },
    { client }
  );
};

exports.postExpense = async (companyId, expense) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const ledgers = await accounting.ensureDefaultLedgers(companyId, client);
    const amount = money(expense.amount);

    if (!expense.title) throw new Error("Expense title is required");
    if (amount <= 0) throw new Error("Expense amount must be greater than zero");

    const expenseLedgerId = expense.expenseLedgerId || expense.expense_ledger_id || ledgers.Expenses.id;
    const paidFromLedgerId = expense.cashOrBankLedgerId || expense.paid_from_ledger_id || ledgers.Cash.id;

    const journal = await accounting.createEntry(
      {
        companyId,
        entry_date: expense.expense_date || new Date(),
        voucher_type: "PAYMENT",
        reference_type: "EXPENSE",
        description: expense.title,
        lines: [
          { ledger_id: expenseLedgerId, debit: amount, credit: 0 },
          { ledger_id: paidFromLedgerId, debit: 0, credit: amount },
        ],
      },
      { client }
    );

    const result = await client.query(
      `
      INSERT INTO expenses
      (company_id, expense_date, title, amount, expense_ledger_id, paid_from_ledger_id, journal_entry_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        companyId,
        expense.expense_date || new Date(),
        expense.title,
        amount,
        expenseLedgerId,
        paidFromLedgerId,
        journal.id,
      ]
    );

    await client.query(
      `UPDATE journal_entries SET reference_id = $1 WHERE id = $2`,
      [result.rows[0].id, journal.id]
    );

    await client.query("COMMIT");

    return {
      expense: result.rows[0],
      journal,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.postPayment = async (companyId, payment) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const ledgers = await accounting.ensureDefaultLedgers(companyId, client);
    const amount = money(payment.amount);
    const isReceipt = (payment.type || payment.payment_type || "RECEIPT").toUpperCase() === "RECEIPT";

    if (amount <= 0) throw new Error("Payment amount must be greater than zero");

    const cashOrBank = payment.cashOrBankLedgerId || payment.cash_or_bank_ledger_id || ledgers.Cash.id;
    const partyLedger = payment.partyLedgerId || payment.party_ledger_id || ledgers["Accounts Receivable"].id;

    const lines = isReceipt
      ? [
          { ledger_id: cashOrBank, debit: amount, credit: 0 },
          { ledger_id: partyLedger, debit: 0, credit: amount },
        ]
      : [
          { ledger_id: partyLedger, debit: amount, credit: 0 },
          { ledger_id: cashOrBank, debit: 0, credit: amount },
        ];

    const journal = await accounting.createEntry(
      {
        companyId,
        entry_date: payment.payment_date || new Date(),
        voucher_type: isReceipt ? "RECEIPT" : "PAYMENT",
        reference_type: "PAYMENT",
        description: payment.notes || (isReceipt ? "Customer receipt" : "Payment"),
        lines,
      },
      { client }
    );

    const result = await client.query(
      `
      INSERT INTO payments
      (company_id, payment_date, party_type, party_id, amount, mode, received_in_ledger_id, paid_from_ledger_id, journal_entry_id, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        companyId,
        payment.payment_date || new Date(),
        payment.party_type || null,
        payment.party_id || null,
        amount,
        payment.mode || null,
        isReceipt ? cashOrBank : null,
        isReceipt ? null : cashOrBank,
        journal.id,
        payment.notes || null,
      ]
    );

    await client.query(
      `UPDATE journal_entries SET reference_id = $1 WHERE id = $2`,
      [result.rows[0].id, journal.id]
    );

    await client.query("COMMIT");

    return {
      payment: result.rows[0],
      journal,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
