import React, { useEffect, useState } from "react";
import API from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await API.get("/expenses");
      setExpenses(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!form.title || Number(form.amount || 0) <= 0) {
      alert("Enter expense title and amount");
      return;
    }

    try {
      setLoading(true);
      await API.post("/expenses", {
        ...form,
        amount: Number(form.amount),
      });
      setForm({ title: "", amount: "", expense_date: new Date().toISOString().slice(0, 10) });
      await loadExpenses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Expenses</h1>
          <p style={styles.subtitle}>Record payments that automatically debit expenses and credit cash.</p>
        </div>
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Add Expense</h2>
        <div style={styles.formGrid}>
          <label style={styles.label}>
            <span>Title</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} />
          </label>
          <label style={styles.label}>
            <span>Amount</span>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={styles.input} />
          </label>
          <label style={styles.label}>
            <span>Date</span>
            <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} style={styles.input} />
          </label>
          <button onClick={submit} disabled={loading} style={styles.primaryButton}>Post Expense</button>
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Expense Register</h2>
        {expenses.length === 0 ? (
          <p style={styles.empty}>No expenses recorded.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Ledger</th>
                <th style={styles.thRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td style={styles.td}>{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td style={styles.td}>{expense.title}</td>
                  <td style={styles.td}>{expense.expense_ledger || "Expenses"}</td>
                  <td style={styles.tdRight}>{currency(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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
  panelTitle: { margin: "0 0 14px", fontSize: 18 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    alignItems: "end",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    color: "#374151",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
  },
  primaryButton: {
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
  thRight: { textAlign: "right", padding: "10px 8px", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "10px 8px", borderBottom: "1px solid #f3f4f6" },
  tdRight: { padding: "10px 8px", borderBottom: "1px solid #f3f4f6", textAlign: "right" },
  empty: { color: "#6b7280" },
};
