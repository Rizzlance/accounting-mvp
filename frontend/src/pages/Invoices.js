import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

export default function Invoices() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [invoice, setInvoice] = useState({
    customer_id: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    place_of_supply: "",
    items: [],
  });
  const [itemForm, setItemForm] = useState({
    product_id: "",
    quantity: 1,
    price: "",
    gst_rate: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [customerRes, productRes, invoiceRes] = await Promise.all([
        API.get("/customers"),
        API.get("/products"),
        API.get("/invoices"),
      ]);
      setCustomers(customerRes.data);
      setProducts(productRes.data);
      setInvoices(invoiceRes.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to load invoice data");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = useMemo(
    () => products.find((product) => Number(product.id) === Number(itemForm.product_id)),
    [products, itemForm.product_id]
  );

  useEffect(() => {
    if (selectedProduct) {
      setItemForm((current) => ({
        ...current,
        price: selectedProduct.sale_price || selectedProduct.price || "",
        gst_rate: selectedProduct.gst_rate ?? "",
      }));
    }
  }, [selectedProduct]);

  const addItem = () => {
    if (!selectedProduct) {
      alert("Select a product");
      return;
    }

    const quantity = Number(itemForm.quantity || 0);
    const price = Number(itemForm.price || 0);
    const gstRate = Number(itemForm.gst_rate || 0);

    if (quantity <= 0) {
      alert("Quantity must be greater than zero");
      return;
    }

    const taxable = quantity * price;
    const gstAmount = taxable * (gstRate / 100);

    setInvoice((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          product_id: selectedProduct.id,
          name: selectedProduct.name,
          quantity,
          price,
          gst_rate: gstRate,
          taxable,
          gstAmount,
          total: taxable + gstAmount,
        },
      ],
    }));

    setItemForm({ product_id: "", quantity: 1, price: "", gst_rate: "" });
  };

  const removeItem = (index) => {
    setInvoice((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.taxable || 0), 0);
    const gst = invoice.items.reduce((sum, item) => sum + Number(item.gstAmount || 0), 0);
    return {
      subtotal,
      gst,
      grand: subtotal + gst,
    };
  }, [invoice.items]);

  const saveInvoice = async () => {
    if (!invoice.customer_id) {
      alert("Select a customer");
      return;
    }
    if (!invoice.items.length) {
      alert("Add at least one item");
      return;
    }

    try {
      setLoading(true);
      await API.post("/invoices", {
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        place_of_supply: invoice.place_of_supply,
        items: invoice.items,
      });

      setInvoice({
        customer_id: "",
        invoice_date: new Date().toISOString().slice(0, 10),
        place_of_supply: "",
        items: [],
      });

      await loadAll();
    } catch (err) {
      alert(err.response?.data?.details || err.response?.data?.error || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (id) => {
    try {
      const res = await API.get(`/invoices/pdf/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("PDF download failed");
    }
  };

  const voidInvoice = async (id) => {
    if (!window.confirm("Void this invoice and reverse stock/accounting?")) return;
    try {
      setLoading(true);
      await API.delete(`/invoices/${id}`);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.details || err.response?.data?.error || "Failed to void invoice");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((item) =>
    [item.invoice_number, item.customer_name].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.title}>Sales Invoices</h1>
          <p style={styles.subtitle}>Create GST invoices that post sales, receivables, stock, and tax automatically.</p>
        </div>
        <input
          placeholder="Search invoices"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Create Invoice</h2>
        <div style={styles.formGrid}>
          <label style={styles.label}>
            <span>Customer</span>
            <select
              value={invoice.customer_id}
              onChange={(e) => setInvoice({ ...invoice, customer_id: e.target.value })}
              style={styles.input}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            <span>Date</span>
            <input
              type="date"
              value={invoice.invoice_date}
              onChange={(e) => setInvoice({ ...invoice, invoice_date: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span>Place of Supply</span>
            <input
              value={invoice.place_of_supply}
              onChange={(e) => setInvoice({ ...invoice, place_of_supply: e.target.value })}
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.itemGrid}>
          <label style={styles.label}>
            <span>Product</span>
            <select
              value={itemForm.product_id}
              onChange={(e) => setItemForm({ ...itemForm, product_id: e.target.value })}
              style={styles.input}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} | Stock {product.stock || 0}
                </option>
              ))}
            </select>
          </label>
          <Input label="Qty" type="number" value={itemForm.quantity} onChange={(value) => setItemForm({ ...itemForm, quantity: value })} />
          <Input label="Rate" type="number" value={itemForm.price} onChange={(value) => setItemForm({ ...itemForm, price: value })} />
          <Input label="GST %" type="number" value={itemForm.gst_rate} onChange={(value) => setItemForm({ ...itemForm, gst_rate: value })} />
          <button onClick={addItem} style={styles.primaryButton}>Add Item</button>
        </div>

        {invoice.items.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Item</th>
                  <th style={styles.thRight}>Qty</th>
                  <th style={styles.thRight}>Rate</th>
                  <th style={styles.thRight}>GST</th>
                  <th style={styles.thRight}>Total</th>
                  <th style={styles.thRight}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={`${item.product_id}-${index}`}>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.tdRight}>{item.quantity}</td>
                    <td style={styles.tdRight}>{currency(item.price)}</td>
                    <td style={styles.tdRight}>{item.gst_rate}%</td>
                    <td style={styles.tdRight}>{currency(item.total)}</td>
                    <td style={styles.tdRight}>
                      <button onClick={() => removeItem(index)} style={styles.smallButton}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.summary}>
          <Row label="Subtotal" value={currency(totals.subtotal)} />
          <Row label="GST" value={currency(totals.gst)} />
          <Row label="Grand Total" value={currency(totals.grand)} strong />
        </div>

        <button onClick={saveInvoice} disabled={loading} style={styles.primaryButton}>Post Invoice</button>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Invoice Register</h2>
        {loading ? (
          <p>Loading...</p>
        ) : filteredInvoices.length === 0 ? (
          <p style={styles.empty}>No invoices found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Invoice</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.thRight}>Taxable</th>
                  <th style={styles.thRight}>GST</th>
                  <th style={styles.thRight}>Total</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.invoice_number || `#${item.id}`}</td>
                    <td style={styles.td}>{item.customer_name || "-"}</td>
                    <td style={styles.td}>{new Date(item.invoice_date || item.created_at).toLocaleDateString()}</td>
                    <td style={styles.tdRight}>{currency(item.subtotal)}</td>
                    <td style={styles.tdRight}>{currency(item.gst_amount)}</td>
                    <td style={styles.tdRight}>{currency(item.total_amount || item.grand_total)}</td>
                    <td style={styles.tdRight}>
                      <button onClick={() => downloadPDF(item.id)} style={styles.smallButton}>PDF</button>
                      <button onClick={() => voidInvoice(item.id)} style={styles.dangerButton}>Void</button>
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

function Row({ label, value, strong }) {
  return (
    <div style={styles.summaryRow}>
      <span>{label}</span>
      <span style={strong ? styles.summaryStrong : undefined}>{value}</span>
    </div>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  itemGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 2fr) repeat(3, minmax(110px, 1fr)) 120px",
    gap: 12,
    alignItems: "end",
    marginTop: 16,
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
    minWidth: 0,
  },
  tableWrap: {
    overflowX: "auto",
    marginTop: 16,
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
    whiteSpace: "nowrap",
  },
  primaryButton: {
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
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
  summary: {
    width: "min(360px, 100%)",
    marginLeft: "auto",
    marginTop: 16,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 12,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
  },
  summaryStrong: {
    fontWeight: 700,
    fontSize: 18,
  },
  empty: {
    color: "#6b7280",
  },
};
