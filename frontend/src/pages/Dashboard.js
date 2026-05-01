import React, { useEffect, useState } from "react";
import API from "../services/api";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/dashboard");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = (data?.monthlySales || []).map((sale) => {
    const expense = (data?.monthlyExpenses || []).find((item) => item.month === sale.month);
    return {
      month: sale.month,
      sales: Number(sale.total || 0),
      expenses: Number(expense?.total || 0),
    };
  });

  if (loading) {
    return <div style={styles.panel}>Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Sales, expenses, receivables, stock alerts, and activity at a glance.</p>
        </div>
        <button onClick={loadData} style={styles.secondaryButton}>Refresh</button>
      </div>

      <div style={styles.kpiGrid}>
        <Kpi label="Sales" value={currency(data?.sales)} />
        <Kpi label="Expenses" value={currency(data?.expenses)} />
        <Kpi label="Net Profit" value={currency(data?.profit)} />
        <Kpi label="Receivables" value={currency(data?.receivables)} />
      </div>

      <div style={styles.grid}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Monthly Trend</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => currency(value)} />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Business Counts</h2>
          <Row label="Customers" value={data?.counts?.customers || 0} />
          <Row label="Products" value={data?.counts?.products || 0} />
          <Row label="Invoices" value={data?.counts?.invoices || 0} />
        </section>
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Low Stock</h2>
        {(data?.lowStock || []).length === 0 ? (
          <p style={styles.empty}>No low stock products.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.thRight}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.name}</td>
                  <td style={styles.tdRight}>{item.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div style={styles.kpi}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 28,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  kpi: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
  },
  kpiLabel: {
    color: "#6b7280",
    fontSize: 13,
  },
  kpiValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: 18,
    marginBottom: 18,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
  },
  panelTitle: {
    margin: "0 0 14px",
    fontSize: 18,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottom: "1px solid #e5e7eb",
  },
  thRight: {
    textAlign: "right",
    padding: "10px 8px",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
  },
  tdRight: {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
    textAlign: "right",
    fontWeight: 700,
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },
  empty: {
    color: "#6b7280",
  },
};
