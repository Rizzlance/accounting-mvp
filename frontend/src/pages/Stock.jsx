import React, { useEffect, useState } from "react";
import API from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

export default function Stock() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await API.get("/stock/summary");
      setRows(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  };

  const openLedger = async (product) => {
    try {
      setSelected(product);
      const res = await API.get(`/stock/ledger/${product.id}`);
      setLedger(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load stock ledger");
    }
  };

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Stock</h1>
          <p style={styles.subtitle}>Inventory summary with product-wise in/out movement.</p>
        </div>
        <button onClick={loadSummary} style={styles.secondaryButton}>Refresh</button>
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Stock Summary</h2>
        {loading ? (
          <p>Loading...</p>
        ) : rows.length === 0 ? (
          <p style={styles.empty}>No stock data available.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Product</th>
                  <th style={styles.thRight}>In</th>
                  <th style={styles.thRight}>Out</th>
                  <th style={styles.thRight}>Stock</th>
                  <th style={styles.thRight}>Value</th>
                  <th style={styles.thRight}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={styles.td}>
                      <strong>{row.name}</strong>
                      <div style={styles.muted}>{row.sku || row.unit || ""}</div>
                    </td>
                    <td style={styles.tdRight}>{row.total_in}</td>
                    <td style={styles.tdRight}>{row.total_out}</td>
                    <td style={styles.tdRight}>{row.stock}</td>
                    <td style={styles.tdRight}>{currency(row.stock_value)}</td>
                    <td style={styles.tdRight}>
                      <button onClick={() => openLedger(row)} style={styles.smallButton}>Ledger</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>{selected.name} Stock Ledger</h2>
          {ledger.length === 0 ? (
            <p style={styles.empty}>No movement entries found.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.thRight}>In</th>
                    <th style={styles.thRight}>Out</th>
                    <th style={styles.thRight}>Running</th>
                    <th style={styles.thRight}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row.id}>
                      <td style={styles.td}>{new Date(row.entry_date || row.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>{row.type}</td>
                      <td style={styles.tdRight}>{row.qty_in}</td>
                      <td style={styles.tdRight}>{row.qty_out}</td>
                      <td style={styles.tdRight}>{row.running_stock}</td>
                      <td style={styles.tdRight}>{currency(row.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
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
  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
  },
  panelTitle: { margin: "0 0 14px", fontSize: 18 },
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
  smallButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
  },
  muted: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  empty: { color: "#6b7280" },
};
