import React, { useEffect, useState } from "react";
import API from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

export default function Reports() {
  const [reports, setReports] = useState({
    trial: null,
    pl: null,
    bs: null,
    cf: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [trial, pl, bs, cf] = await Promise.all([
        API.get("/reports/trial-balance"),
        API.get("/reports/profit-loss"),
        API.get("/reports/balance-sheet"),
        API.get("/reports/cash-flow"),
      ]);
      setReports({
        trial: trial.data,
        pl: pl.data,
        bs: bs.data,
        cf: cf.data,
      });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Reports</h1>
          <p style={styles.subtitle}>Trial balance, profit and loss, balance sheet, and cash flow from journal entries.</p>
        </div>
        <button onClick={loadReports} style={styles.secondaryButton}>Refresh</button>
      </div>

      {loading && <section style={styles.panel}>Loading reports...</section>}

      <div style={styles.grid}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Profit and Loss</h2>
          <Row label="Income" value={currency(reports.pl?.totalIncome)} />
          <Row label="Expense" value={currency(reports.pl?.totalExpense)} />
          <Row label="Net Profit" value={currency(reports.pl?.netProfit)} strong />
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Balance Sheet</h2>
          <Row label="Assets" value={currency(reports.bs?.totalAssets)} />
          <Row label="Liabilities" value={currency(reports.bs?.totalLiabilities)} />
          <Row label="Equity" value={currency(reports.bs?.totalEquity)} strong />
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Cash Flow</h2>
          <Row label="Cash In" value={currency(reports.cf?.cashIn)} />
          <Row label="Cash Out" value={currency(reports.cf?.cashOut)} />
          <Row label="Net Flow" value={currency(reports.cf?.netCashFlow)} strong />
        </section>
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Trial Balance</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ledger</th>
                <th style={styles.th}>Type</th>
                <th style={styles.thRight}>Debit</th>
                <th style={styles.thRight}>Credit</th>
                <th style={styles.thRight}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {(reports.trial?.rows || []).map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>{row.name}</td>
                  <td style={styles.td}>{row.type}</td>
                  <td style={styles.tdRight}>{currency(row.debit)}</td>
                  <td style={styles.tdRight}>{currency(row.credit)}</td>
                  <td style={styles.tdRight}>{currency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={styles.totalCell} colSpan="2">Total</td>
                <td style={styles.totalRight}>{currency(reports.trial?.totalDebit)}</td>
                <td style={styles.totalRight}>{currency(reports.trial?.totalCredit)}</td>
                <td style={styles.totalRight}>{currency(reports.trial?.difference)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div style={styles.row}>
      <span>{label}</span>
      <span style={strong ? styles.strong : undefined}>{value}</span>
    </div>
  );
}

const styles = {
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: "6px 0 0", color: "#6b7280" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    marginBottom: 18,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
  },
  panelTitle: { margin: "0 0 14px", fontSize: 18 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  strong: { fontWeight: 700 },
  secondaryButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
  thRight: { textAlign: "right", padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "10px 8px", borderBottom: "1px solid #f3f4f6" },
  tdRight: { padding: "10px 8px", borderBottom: "1px solid #f3f4f6", textAlign: "right" },
  totalCell: { padding: "12px 8px", fontWeight: 700, borderTop: "1px solid #e5e7eb" },
  totalRight: { padding: "12px 8px", fontWeight: 700, textAlign: "right", borderTop: "1px solid #e5e7eb" },
};
