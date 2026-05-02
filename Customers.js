import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function Customers() {

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    name: '',
    phone: '',
    address: ''
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // INPUT HANDLER
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // SAVE (ADD / UPDATE)
  const saveCustomer = async () => {
    try {
      if (!form.name) {
        alert('Customer name required');
        return;
      }

      setLoading(true);

      if (editing) {
        await API.put(`/customers/${form.id}`, form);
      } else {
        await API.post('/customers', form);
      }

      resetForm();
      loadCustomers();

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // EDIT
  const editCustomer = (c) => {
    setForm({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      address: c.address || ''
    });
    setEditing(true);
  };

  // DELETE
  const deleteCustomer = async (id) => {
    if (!window.confirm('Delete this customer?')) return;

    try {
      setLoading(true);
      await API.delete(`/customers/${id}`);
      loadCustomers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // RESET
  const resetForm = () => {
    setForm({
      id: null,
      name: '',
      phone: '',
      address: ''
    });
    setEditing(false);
  };

  // SEARCH FILTER
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2>Customers</h2>
        <input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {/* FORM CARD */}
      <div style={styles.card}>

        <h3>{editing ? 'Edit Customer' : 'Add Customer'}</h3>

        <div style={styles.formGrid}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.actions}>
          <button style={styles.primary} onClick={saveCustomer}>
            {editing ? 'Update' : 'Add'}
          </button>

          {editing && (
            <button style={styles.secondary} onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>

      </div>

      {/* TABLE CARD */}
      <div style={styles.card}>

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p>No customers found</p>
        ) : (

          <table style={styles.table}>

            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={styles.row}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.address}</td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      style={styles.edit}
                      onClick={() => editCustomer(c)}
                    >
                      Edit
                    </button>

                    <button
                      style={styles.delete}
                      onClick={() => deleteCustomer(c.id)}
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
  container: {
    padding: 20
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  search: {
    padding: 10,
    width: 250,
    borderRadius: 6,
    border: '1px solid #ddd'
  },

  card: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10
  },

  input: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ddd'
  },

  actions: {
    marginTop: 15
  },

  primary: {
    padding: 10,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    marginRight: 10,
    cursor: 'pointer'
  },

  secondary: {
    padding: 10,
    background: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  row: {
    borderTop: '1px solid #eee'
  },

  edit: {
    marginRight: 10,
    padding: 6,
    background: '#10b981',
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