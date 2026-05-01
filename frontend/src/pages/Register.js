import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/register", form);
      alert("Account created. Please sign in.");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <section style={styles.card}>
        <div style={styles.brand}>Accountrix</div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Start with a user account, then create your company books.</p>

        <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Input label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <Input label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />

        <button onClick={register} disabled={loading} style={styles.primaryButton}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p style={styles.footer}>
          Already registered? <button onClick={() => navigate("/")} style={styles.linkButton}>Sign in</button>
        </p>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} />
    </label>
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
  linkButton: { border: 0, background: "transparent", color: "#2563eb", cursor: "pointer", padding: 0 },
};
