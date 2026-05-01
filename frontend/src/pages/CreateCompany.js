import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function CreateCompany() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: "",
    gst_number: "",
    address: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();

    if (!form.company_name.trim()) {
      alert("Company name is required");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/company", form);
      localStorage.setItem("company", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <section style={styles.card}>
        <h1 style={styles.title}>Create Company</h1>
        <p style={styles.subtitle}>Set up the legal business profile used for invoices, GST, and reports.</p>

        <form onSubmit={submit} style={styles.form}>
          <Input label="Company Name" value={form.company_name} onChange={(value) => update("company_name", value)} required />
          <Input label="GST Number" value={form.gst_number} onChange={(value) => update("gst_number", value)} />
          <Input label="State" value={form.state} onChange={(value) => update("state", value)} />
          <label style={styles.label}>
            <span>Address</span>
            <textarea value={form.address} onChange={(e) => update("address", e.target.value)} style={styles.textarea} />
          </label>

          <div style={styles.actions}>
            <button type="submit" disabled={loading} style={styles.primaryButton}>
              {loading ? "Creating..." : "Create Company"}
            </button>
            <button type="button" onClick={() => navigate("/companies")} style={styles.secondaryButton}>
              Back
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, required }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      <input required={required} value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} />
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
    width: "min(520px, 100%)",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 24,
  },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: "6px 0 20px", color: "#6b7280" },
  form: { display: "grid", gap: 12 },
  label: { display: "flex", flexDirection: "column", gap: 6, color: "#374151", fontSize: 13 },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 },
  textarea: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, minHeight: 88, resize: "vertical" },
  actions: { display: "flex", gap: 10, marginTop: 6 },
  primaryButton: { border: 0, background: "#2563eb", color: "#ffffff", borderRadius: 8, padding: "10px 14px", cursor: "pointer" },
  secondaryButton: { border: "1px solid #d1d5db", background: "#ffffff", borderRadius: 8, padding: "10px 14px", cursor: "pointer" },
};
