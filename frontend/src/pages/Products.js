import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

const emptyForm = {
  id: null,
  name: "",
  sku: "",
  hsn_code: "",
  unit: "Nos",
  sale_price: "",
  purchase_price: "",
  gst_rate: "18",
  stock: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/products");
      setProducts(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) =>
      [p.name, p.sku, p.hsn_code].some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [products, search]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProduct = async () => {
    if (!form.name.trim()) {
      alert("Product name is required");
      return;
    }

    const payload = {
      ...form,
      sale_price: Number(form.sale_price || 0),
      purchase_price: Number(form.purchase_price || 0),
      gst_rate: Number(form.gst_rate || 0),
      stock: Number(form.stock || 0),
    };

    try {
      setLoading(true);
      if (editing) {
        await API.put(`/products/${form.id}`, payload);
      } else {
        await API.post("/products", payload);
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      alert(err.response?.data?.details || err.response?.data?.error || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      sku: product.sku || "",
      hsn_code: product.hsn_code || "",
      unit: product.unit || "Nos",
      sale_price: product.sale_price || product.price || "",
      purchase_price: product.purchase_price || "",
      gst_rate: product.gst_rate ?? "18",
      stock: product.stock || "",
    });
    setEditing(true);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Archive this product?")) return;

    try {
      setLoading(true);
      await API.delete(`/products/${id}`);
      await loadProducts();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to archive product");
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
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>Maintain items with HSN, GST, sale price, purchase price, and live stock.</p>
        </div>
        <input
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>{editing ? "Edit Product" : "Add Product"}</h2>
        <div style={styles.formGrid}>
          <Input label="Name" value={form.name} onChange={(value) => updateForm("name", value)} />
          <Input label="SKU" value={form.sku} onChange={(value) => updateForm("sku", value)} />
          <Input label="HSN" value={form.hsn_code} onChange={(value) => updateForm("hsn_code", value)} />
          <Input label="Unit" value={form.unit} onChange={(value) => updateForm("unit", value)} />
          <Input label="Sale Price" type="number" value={form.sale_price} onChange={(value) => updateForm("sale_price", value)} />
          <Input label="Purchase Price" type="number" value={form.purchase_price} onChange={(value) => updateForm("purchase_price", value)} />
          <Input label="GST %" type="number" value={form.gst_rate} onChange={(value) => updateForm("gst_rate", value)} />
          {!editing && <Input label="Opening Stock" type="number" value={form.stock} onChange={(value) => updateForm("stock", value)} />}
        </div>

        <div style={styles.actions}>
          <button onClick={saveProduct} disabled={loading} style={styles.primaryButton}>
            {editing ? "Update Product" : "Add Product"}
          </button>
          {editing && <button onClick={resetForm} style={styles.secondaryButton}>Cancel</button>}
        </div>
      </section>

      <section style={styles.panel}>
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>No products found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>HSN</th>
                  <th style={styles.thRight}>Sale Price</th>
                  <th style={styles.thRight}>GST</th>
                  <th style={styles.thRight}>Stock</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>
                      <strong>{product.name}</strong>
                      <div style={styles.muted}>{product.sku || product.unit || ""}</div>
                    </td>
                    <td style={styles.td}>{product.hsn_code || "-"}</td>
                    <td style={styles.tdRight}>{currency(product.sale_price || product.price)}</td>
                    <td style={styles.tdRight}>{Number(product.gst_rate || 0)}%</td>
                    <td style={styles.tdRight}>{Number(product.stock || 0)}</td>
                    <td style={styles.tdRight}>
                      <button onClick={() => editProduct(product)} style={styles.smallButton}>Edit</button>
                      <button onClick={() => deleteProduct(product.id)} style={styles.dangerButton}>Archive</button>
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

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} />
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
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
  },
  tdRight: {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
    textAlign: "right",
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
