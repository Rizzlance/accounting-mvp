import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";

const emptyForm = {
  id: null,
  name: "",
  phone: "",
  email: "",
  gstin: "",
  address: "",
  place_of_supply: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email, customer.gstin].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [customers, search]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveCustomer = async () => {
    if (!form.name.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      setLoading(true);
      if (editing) {
        await API.put(`/customers/${form.id}`, form);
      } else {
        await API.post("/customers", form);
      }
      resetForm();
      await loadCustomers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  const editCustomer = (customer) => {
    setForm({
      id: customer.id,
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      gstin: customer.gstin || "",
      address: customer.address || "",
      place_of_supply: customer.place_of_supply || "",
    });
    setEditing(true);
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      setLoading(true);
      await API.delete(`/customers/${id}`);
      await loadCustomers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete customer");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(false);
  };

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Customers</h1>
          <p style={styles.subtitle}>Manage GST parties, contact details, and place of supply.</p>
        </div>
        <input
          placeholder="Search customers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>{editing ? "Edit Customer" : "Add Customer"}</h2>
        <div style={styles.formGrid}>
          <Input label="Name" value={form.name} onChange={(value) => updateForm("name", value)} />
          <Input label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
          <Input label="Email" value={form.email} onChange={(value) => updateForm("email", value)} />
          <Input label="GSTIN" value={form.gstin} onChange={(value) => updateForm("gstin", value)} />
          <Input label="Place of Supply" value={form.place_of_supply} onChange={(value) => updateForm("place_of_supply", value)} />
          <Input label="Address" value={form.address} onChange={(value) => updateForm("address", value)} />
        </div>
        <div style={styles.actions}>
          <button onClick={saveCustomer} disabled={loading} style={styles.primaryButton}>
            {editing ? "Update Customer" : "Add Customer"}
          </button>
          {editing && <button onClick={resetForm} style={styles.secondaryButton}>Cancel</button>}
        </div>
      </section>

      <section style={styles.panel}>
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>No customers found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>GSTIN</th>
                  <th style={styles.th}>Place</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td style={styles.td}>
                      <strong>{customer.name}</strong>
                      <div style={styles.muted}>{customer.address || ""}</div>
                    </td>
                    <td style={styles.td}>{customer.gstin || "-"}</td>
                    <td style={styles.td}>{customer.place_of_supply || "-"}</td>
                    <td style={styles.td}>
                      <div>{customer.phone || "-"}</div>
                      <div style={styles.muted}>{customer.email || ""}</div>
                    </td>
                    <td style={styles.tdRight}>
                      <button onClick={() => editCustomer(customer)} style={styles.smallButton}>Edit</button>
                      <button onClick={() => deleteCustomer(customer.id)} style={styles.dangerButton}>Delete</button>
                    </td>
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

function Input({ label, value, onChange }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} />
    </label>
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
  title: {
    margin: 0,
    fontSize: 28,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  search: {
    minWidth: 260,
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
  },
  panelTitle: {
    margin: "0 0 14px",
    fontSize: 18,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
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
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
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
    verticalAlign: "top",
  },
  tdRight: {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  muted: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
  },
  smallButton: {
    marginRight: 8,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
  },
  dangerButton: {
    border: 0,
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
  },
  empty: {
    color: "#6b7280",
  },
};
