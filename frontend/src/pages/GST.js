import React, { useCallback, useEffect, useState } from "react";
import API from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

export default function GST() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [summary, setSummary] = useState(null);
  const [gstr1, setGstr1] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGST = useCallback(async () => {
    try {
      setLoading(true);
      const query = `month=${month}&year=${year}`;
      const [summaryRes, gstrRes] = await Promise.all([
        API.get(`/gst/report?${query}`),
        API.get(`/gst/gstr1?${query}`),
      ]);
      setSummary(summaryRes.data);
      setGstr1(gstrRes.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load GST report");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadGST();
  }, [loadGST]);

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>GST</h1>
          <p style={styles.subtitle}>Monthly GST liability and GSTR-1 style outward supply register.</p>
        </div>
      </div>

      <section style={styles.panel}>
        <div style={styles.filterGrid}>
          <label style={styles.label}>
            <span>Month</span>
            <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} style={styles.input} />
          </label>
          <label style={styles.label}>
            <span>Year</span>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={styles.input} />
          </label>
          <button onClick={loadGST} disabled={loading} style={styles.primaryButton}>Load GST</button>
        </div>
      </section>

      <div style={styles.grid}>
        <SummaryCard label="Taxable Value" value={currency(summary?.taxable_value)} />
        <SummaryCard label="CGST" value={currency(summary?.cgst)} />
        <SummaryCard label="SGST" value={currency(summary?.sgst)} />
        <SummaryCard label="IGST" value={currency(summary?.igst)} />
        <SummaryCard label="GST Total" value={currency(summary?.gst_total)} />
        <SummaryCard label="Invoice Total" value={currency(summary?.invoice_total)} />
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>GSTR-1 Register</h2>
        {gstr1.length === 0 ? (
          <p style={styles.empty}>No outward supplies for this period.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Invoice</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>GSTIN</th>
                  <th style={styles.thRight}>Taxable</th>
                  <th style={styles.thRight}>Tax</th>
                  <th style={styles.thRight}>Total</th>
                </tr>
              </thead>
              <tbody>
                {gstr1.map((row) => (
                  <tr key={row.invoice_number}>
                    <td style={styles.td}>{row.invoice_number}</td>
                    <td style={styles.td}>{new Date(row.invoice_date).toLocaleDateString()}</td>
                    <td style={styles.td}>{row.customer_name || "-"}</td>
                    <td style={styles.td}>{row.customer_gstin || "-"}</td>
                    <td style={styles.tdRight}>{currency(row.taxable_amount)}</td>
                    <td style={styles.tdRight}>{currency(row.total_tax)}</td>
                    <td style={styles.tdRight}>{currency(row.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}

const styles = {
  titleRow: { marginBottom: 18 },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: "6px 0 0", color: "#6b7280" },
  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    alignItems: "end",
  },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#374151" },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 },
  primaryButton: {
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 16,
  },
  cardLabel: { color: "#6b7280", fontSize: 13 },
  cardValue: { marginTop: 8, fontWeight: 700, fontSize: 20 },
  panelTitle: { margin: "0 0 14px", fontSize: 18 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
  thRight: { textAlign: "right", padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "10px 8px", borderBottom: "1px solid #f3f4f6" },
  tdRight: { padding: "10px 8px", borderBottom: "1px solid #f3f4f6", textAlign: "right" },
  empty: { color: "#6b7280" },
};
