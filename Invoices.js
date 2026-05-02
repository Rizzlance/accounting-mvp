import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function Invoices() {

  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await API.get('/invoice');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // DOWNLOAD PDF
  const downloadPDF = async (id) => {
    try {
      const res = await API.get(`/invoice/pdf/${id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error(err);
      alert('Download failed');
    }
  };

  // DELETE
  const deleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;

    try {
      await API.delete(`/invoice/${id}`);
      loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  // FILTER
  const filtered = invoices.filter(i =>
    i.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <h2>Invoices</h2>

        <input
          placeholder="Search by customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      <div style={styles.card}>

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p>No invoices found</p>
        ) : (

          <table style={styles.table}>

            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} style={styles.row}>
                  <td>#{inv.id}</td>
                  <td>{inv.customer_name}</td>
                  <td>₹ {inv.total_amount}</td>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      style={styles.download}
                      onClick={() => downloadPDF(inv.id)}
                    >
                      PDF
                    </button>

                    <button
                      style={styles.delete}
                      onClick={() => deleteInvoice(inv.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

const styles = {
  container: { padding: 20 },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  search: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ddd'
  },

  card: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  row: {
    borderTop: '1px solid #eee'
  },

  download: {
    marginRight: 10,
    padding: 6,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer'
  },

  delete: {
    padding: 6,
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer'
  }
};