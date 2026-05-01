import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function CompanySwitch() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const selectCompany = useCallback((company) => {
    localStorage.setItem("company", JSON.stringify(company));
    navigate("/dashboard");
  }, [navigate]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/company");
      setCompanies(res.data);

      const saved = localStorage.getItem("company");
      if (saved) {
        const parsed = JSON.parse(saved);
        const exists = res.data.find((company) => Number(company.id) === Number(parsed.id));
        if (exists) {
          selectCompany(exists);
          return;
        }
      }

      if (res.data.length === 1) {
        selectCompany(res.data[0]);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [selectCompany]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return companies.filter((company) =>
      [company.company_name, company.gst_number, company.state].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [companies, search]);

  return (
    <div style={styles.container}>
      <section style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Select Company</h1>
            <p style={styles.subtitle}>Choose the business books you want to work in.</p>
          </div>
          <button onClick={() => navigate("/create-company")} style={styles.primaryButton}>
            New Company
          </button>
        </div>

        <input
          placeholder="Search company, GSTIN, or state"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />

        {loading ? (
          <p>Loading companies...</p>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <p>No companies found.</p>
            <button onClick={() => navigate("/create-company")} style={styles.secondaryButton}>Create your first company</button>
          </div>
        ) : (
          <div style={styles.list}>
            {filtered.map((company) => (
              <button key={company.id} onClick={() => selectCompany(company)} style={styles.companyItem}>
                <span>
                  <strong>{company.company_name}</strong>
                  <span style={styles.muted}>
                    {company.gst_number ? `GSTIN ${company.gst_number}` : "GSTIN not added"}
                  </span>
                </span>
                <span style={styles.state}>{company.state || "No state"}</span>
              </button>
            ))}
          </div>
        )}
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
    width: "min(720px, 100%)",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: "6px 0 0", color: "#6b7280" },
  search: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    marginBottom: 14,
  },
  list: { display: "grid", gap: 10 },
  companyItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    width: "100%",
    padding: 14,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },
  muted: { display: "block", marginTop: 4, color: "#6b7280", fontSize: 12 },
  state: { color: "#374151" },
  primaryButton: {
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
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
    padding: 20,
    border: "1px dashed #d1d5db",
    borderRadius: 8,
    textAlign: "center",
  },
};
