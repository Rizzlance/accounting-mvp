import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!form.email || !form.password) {
      alert("Enter email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.removeItem("company");
      navigate("/companies");
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <section style={styles.card}>
        <div style={styles.brand}>Accountrix</div>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>Open your accounting workspace.</p>

        <label style={styles.label}>
          <span>Email</span>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={styles.input}
          />
        </label>

        <button onClick={login} disabled={loading} style={styles.primaryButton}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p style={styles.footer}>
          New here? <button onClick={() => navigate("/register")} style={styles.linkButton}>Create account</button>
        </p>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    padding: 24,
  },
  card: {
    width: "min(420px, 100%)",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 28,
  },
  brand: { fontSize: 18, fontWeight: 700, color: "#2563eb", marginBottom: 18 },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: "6px 0 20px", color: "#6b7280" },
  label: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, color: "#374151", fontSize: 13 },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 },
  primaryButton: {
    width: "100%",
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 8,
    padding: "11px 14px",
    cursor: "pointer",
    marginTop: 4,
  },
  footer: { textAlign: "center", color: "#6b7280", margin: "18px 0 0" },
  linkButton: {
    border: 0,
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    padding: 0,
  },
};
