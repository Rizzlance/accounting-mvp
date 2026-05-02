import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const CompanySwitch = () => {
  const [companies, setCompanies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const activeCompanyId = localStorage.getItem("activeCompanyId");

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(companies);
    } else {
      setFiltered(
        companies.filter((c) =>
          c.company_name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, companies]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await API.get("/company");

      setCompanies(res.data);
      setFiltered(res.data);

      // SAFE AUTO SELECT
      const existing = localStorage.getItem("activeCompanyId");

      if (!existing && res.data.length === 1) {
        selectCompany(res.data[0]);
      }
    } catch (err) {
      console.error("Error loading companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company) => {
    // ERP STANDARD STORAGE
    localStorage.setItem("activeCompanyId", company.id);
    localStorage.setItem("activeCompanyName", company.company_name);

    navigate("/dashboard");
  };

  const createCompany = () => {
    navigate("/create-company");
  };

  const switchCompany = () => {
    localStorage.removeItem("activeCompanyId");
    localStorage.removeItem("activeCompanyName");
    navigate("/companies");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.title}>Company Selection</h2>
        <p style={styles.subtitle}>
          Select or switch your accounting company
        </p>

        {/* ACTIVE COMPANY */}
        {activeCompanyId && (
          <div style={styles.activeBox}>
            Active Company: <b>{localStorage.getItem("activeCompanyName")}</b>
            <button onClick={switchCompany} style={styles.switchBtn}>
              Switch
            </button>
          </div>
        )}

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />

        {/* CREATE BUTTON */}
        <button onClick={createCompany} style={styles.createBtn}>
          + Create New Company
        </button>

        {/* LIST */}
        {loading ? (
          <p>Loading companies...</p>
        ) : (
          <div style={styles.list}>
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => selectCompany(c)}
                style={{
                  ...styles.item,
                  border:
                    activeCompanyId == c.id
                      ? "2px solid #1f4fff"
                      : "1px solid #eee",
                  background:
                    activeCompanyId == c.id ? "#eef3ff" : "#fff",
                }}
              >
                <div>
                  <h4 style={{ margin: 0 }}>{c.company_name}</h4>
                  <small style={{ color: "#666" }}>
                    GST: {c.gst_number || "N/A"}
                  </small>
                </div>

                <span>➜</span>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p style={{ color: "#888" }}>No companies found</p>
        )}
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
    background: "linear-gradient(135deg,#f4f6f8,#eef2ff)",
  },
  card: {
    width: "450px",
    background: "#fff",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "5px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "13px",
    color: "#666",
    textAlign: "center",
    marginBottom: "15px",
  },
  search: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "10px",
  },
  createBtn: {
    width: "100%",
    padding: "10px",
    background: "#1f4fff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    marginBottom: "10px",
    cursor: "pointer",
  },
  list: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  activeBox: {
    background: "#f0f4ff",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px",
    fontSize: "13px",
  },
  switchBtn: {
    marginLeft: "10px",
    padding: "5px 10px",
    border: "none",
    background: "#ff4d4f",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CompanySwitch;