const db = require("../config/db");

const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const dateFilter = (startDate, endDate, params) => {
  const filters = [];

  if (startDate) {
    params.push(startDate);
    filters.push(`je.entry_date >= $${params.length}`);
  }

  if (endDate) {
    params.push(endDate);
    filters.push(`je.entry_date <= $${params.length}`);
  }

  return filters.length ? `AND ${filters.join(" AND ")}` : "";
};

exports.getTrialBalance = async (companyId, startDate, endDate) => {
  const params = [companyId];
  const filterSql = dateFilter(startDate, endDate, params);

  const result = await db.query(
    `
    SELECT
      l.id,
      l.name,
      l.type,
      l.group_name,
      l.opening_balance,
      COALESCE(SUM(jel.debit), 0) AS debit,
      COALESCE(SUM(jel.credit), 0) AS credit
    FROM ledgers l
    LEFT JOIN journal_entry_lines jel ON jel.ledger_id = l.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
      AND je.company_id = l.company_id
      ${filterSql}
    WHERE l.company_id = $1
    GROUP BY l.id
    ORDER BY l.type, l.name
    `,
    params
  );

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = result.rows.map((row) => {
    const opening = Number(row.opening_balance || 0);
    const debit = Number(row.debit || 0) + (opening > 0 ? opening : 0);
    const credit = Number(row.credit || 0) + (opening < 0 ? Math.abs(opening) : 0);

    totalDebit += debit;
    totalCredit += credit;

    return {
      ...row,
      debit: money(debit),
      credit: money(credit),
      balance: money(debit - credit),
    };
  });

  return {
    rows,
    totalDebit: money(totalDebit),
    totalCredit: money(totalCredit),
    difference: money(totalDebit - totalCredit),
  };
};

exports.getProfitLoss = async (companyId, startDate, endDate) => {
  const params = [companyId];
  const filterSql = dateFilter(startDate, endDate, params);

  const result = await db.query(
    `
    SELECT
      l.id,
      l.name,
      l.type,
      COALESCE(SUM(jel.debit), 0) AS debit,
      COALESCE(SUM(jel.credit), 0) AS credit
    FROM ledgers l
    JOIN journal_entry_lines jel ON jel.ledger_id = l.id
    JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.company_id = l.company_id
    WHERE l.company_id = $1
      AND LOWER(l.type) IN ('income', 'expense')
      ${filterSql}
    GROUP BY l.id
    ORDER BY l.type, l.name
    `,
    params
  );

  const income = [];
  const expense = [];
  let totalIncome = 0;
  let totalExpense = 0;

  result.rows.forEach((row) => {
    const isIncome = String(row.type).toLowerCase() === "income";
    const balance = isIncome
      ? money(Number(row.credit || 0) - Number(row.debit || 0))
      : money(Number(row.debit || 0) - Number(row.credit || 0));

    const item = { ...row, balance };

    if (isIncome) {
      income.push(item);
      totalIncome += balance;
    } else {
      expense.push(item);
      totalExpense += balance;
    }
  });

  return {
    income,
    expense,
    totalIncome: money(totalIncome),
    totalExpense: money(totalExpense),
    netProfit: money(totalIncome - totalExpense),
    profit: money(totalIncome - totalExpense),
  };
};

exports.getBalanceSheet = async (companyId, startDate, endDate) => {
  const params = [companyId];
  const filterSql = dateFilter(startDate, endDate, params);

  const result = await db.query(
    `
    SELECT
      l.id,
      l.name,
      l.type,
      l.group_name,
      l.opening_balance,
      COALESCE(SUM(jel.debit), 0) AS debit,
      COALESCE(SUM(jel.credit), 0) AS credit
    FROM ledgers l
    LEFT JOIN journal_entry_lines jel ON jel.ledger_id = l.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
      AND je.company_id = l.company_id
      ${filterSql}
    WHERE l.company_id = $1
      AND LOWER(l.type) IN ('asset', 'liability', 'equity')
    GROUP BY l.id
    ORDER BY l.type, l.name
    `,
    params
  );

  const assets = [];
  const liabilities = [];
  const equity = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  result.rows.forEach((row) => {
    const type = String(row.type).toLowerCase();
    const opening = Number(row.opening_balance || 0);
    const debit = Number(row.debit || 0);
    const credit = Number(row.credit || 0);
    const balance = type === "asset"
      ? money(opening + debit - credit)
      : money(Math.abs(opening) + credit - debit);
    const item = { ...row, balance };

    if (type === "asset") {
      assets.push(item);
      totalAssets += balance;
    } else if (type === "liability") {
      liabilities.push(item);
      totalLiabilities += balance;
    } else {
      equity.push(item);
      totalEquity += balance;
    }
  });

  const profitLoss = await exports.getProfitLoss(companyId, startDate, endDate);
  if (profitLoss.netProfit !== 0) {
    equity.push({
      id: "current-profit",
      name: "Current Period Profit",
      type: "Equity",
      balance: profitLoss.netProfit,
    });
    totalEquity += profitLoss.netProfit;
  }

  return {
    assets,
    liabilities,
    equity,
    totalAssets: money(totalAssets),
    totalLiabilities: money(totalLiabilities),
    totalEquity: money(totalEquity),
    assetsTotal: money(totalAssets),
    liabilitiesTotal: money(totalLiabilities),
    equityTotal: money(totalEquity),
  };
};

exports.getCashFlow = async (companyId, startDate, endDate) => {
  const params = [companyId];
  const filterSql = dateFilter(startDate, endDate, params);

  const result = await db.query(
    `
    SELECT
      COALESCE(SUM(jel.debit), 0) AS cash_in,
      COALESCE(SUM(jel.credit), 0) AS cash_out
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN ledgers l ON l.id = jel.ledger_id
    WHERE je.company_id = $1
      AND LOWER(l.group_name) IN ('cash in hand', 'bank accounts')
      ${filterSql}
    `,
    params
  );

  const cashIn = Number(result.rows[0]?.cash_in || 0);
  const cashOut = Number(result.rows[0]?.cash_out || 0);

  return {
    cashIn: money(cashIn),
    cashOut: money(cashOut),
    netCashFlow: money(cashIn - cashOut),
  };
};
