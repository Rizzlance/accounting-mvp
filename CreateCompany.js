import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const CreateCompany = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: "",
    gst_number: "",
    address: "",
    state: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.company_name) {
      alert("Company name is required");
      return;
    }

    try {
      setLoading(true);

      await API.post("/company", form);

      alert("Company created successfully");

      // redirect back to switch screen
      navigate("/company-switch");
    } catch (err) {
      console.error(err);
      alert("Error creating company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Company</h2>
        <p style={styles.subtitle}>Set up your new organization</p>

        <form onSubmit={handleSubmit}>
          <input
            name="company_name"
            placeholder="Company Name *"
            value={form.company_name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="gst_number"
            placeholder="GST Number"
            value={form.gst_number}
            onChange={handleChange}
            style={styles.input}
          />

          <textarea
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            style={styles.textarea}
          />

          <input
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Company"}
          </button>

          <button
            type="button"
            style={styles.backBtn}
            onClick={() => navigate("/company-switch")}
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
  },
  card: {
    width: "450px",
    padding: "25px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "5px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#777",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    height: "80px",
    resize: "none",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#1f4fff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "10px",
  },
  backBtn: {
    width: "100%",
    padding: "10px",
    background: "#eee",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default CreateCompany;