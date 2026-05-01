import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

export default function Ledger() {
  const [ledgers, setLedgers] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState("");
  const [statement, setStatement] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLedgers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/ledger");
      setLedgers(res.data);
      setSelectedLedger((current) => current || (res.data.length ? String(res.data[0].id) : ""));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedgers();
  }, [loadLedgers]);

  const loadStatement = useCallback(async (ledgerId) => {
    try {
      const res = await API.get(`/ledger/statement/${ledgerId}`);
      setStatement(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load statement");
    }
  }, []);

  useEffect(() => {
    if (selectedLedger) {
      loadStatement(selectedLedger);
    } else {
      setStatement([]);
    }
  }, [selectedLedger, loadStatement]);

  const currentLedger = useMemo(
    () => ledgers.find((ledger) => Number(ledger.id) === Number(selectedLedger)),
    [ledgers, selectedLedger]
  );

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Ledgers</h1>
          <p style={styles.subtitle}>Review balances and drill into ledger statements.</p>
        </div>
        <button onClick={loadLedgers} style={styles.secondaryButton}>Refresh</button>
      </div>

      <div style={styles.grid}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Ledger Balances</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div style={styles.ledgerList}>
              {ledgers.map((ledger) => (
                <button
                  key={ledger.id}
                  onClick={() => setSelectedLedger(String(ledger.id))}
                  style={{
                    ...styles.ledgerItem,
                    borderColor: Number(selectedLedger) === Number(ledger.id) ? "#2563eb" : "#e5e7eb",
                  }}
                >
                  <span>
                    <strong>{ledger.name}</strong>
                    <span style={styles.muted}>{ledger.type}</span>
                  </span>
                  <span>{currency(ledger.balance)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section style={styles.panelWide}>
          <h2 style={styles.panelTitle}>{currentLedger ? `${currentLedger.name} Statement` : "Statement"}</h2>
          {statement.length === 0 ? (
            <p style={styles.empty}>No entries found for this ledger.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Voucher</th>
                    <th style={styles.th}>Narration</th>
                    <th style={styles.thRight}>Debit</th>
                    <th style={styles.thRight}>Credit</th>
                    <th style={styles.thRight}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.map((row) => (
                    <tr key={`${row.journal_entry_id}-${row.ledger_id}-${row.running_balance}`}>
                      <td style={styles.td}>{new Date(row.entry_date).toLocaleDateString()}</td>
                      <td style={styles.td}>{row.voucher_type}</td>
                      <td style={styles.td}>{row.narration || "-"}</td>
                      <td style={styles.tdRight}>{currency(row.debit)}</td>
                      <td style={styles.tdRight}>{currency(row.credit)}</td>
                      <td style={styles.tdRight}>{currency(row.running_balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
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
    gridTemplateColumns: "minmax(260px, 340px) minmax(0, 1fr)",
    gap: 18,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
  },
  panelWide: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
    minWidth: 0,
  },
  panelTitle: { margin: "0 0 14px", fontSize: 18 },
  ledgerList: { display: "grid", gap: 8 },
  ledgerItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left",
  },
  muted: { display: "block", color: "#6b7280", fontSize: 12, marginTop: 4 },
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
  tdRight: { padding: "10px 8px", borderBottom: "1px solid #f3f4f6", textAlign: "right", whiteSpace: "nowrap" },
  empty: { color: "#6b7280" },
};
