import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function Products() {

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    name: '',
    sale_price: '',
    gst_rate: '',
    stock: ''
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/products');
      setProducts(res.data);
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

  // SAVE PRODUCT
  const saveProduct = async () => {
    try {
      if (!form.name) {
        alert('Product name required');
        return;
      }

      const payload = {
        ...form,
        sale_price: Number(form.sale_price),
        gst_rate: Number(form.gst_rate),
        stock: Number(form.stock)
      };

      setLoading(true);

      if (editing) {
        await API.put(`/products/${form.id}`, payload);
      } else {
        await API.post('/products', payload);
      }

      resetForm();
      loadProducts();

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // EDIT
  const editProduct = (p) => {
    setForm({
      id: p.id,
      name: p.name,
      sale_price: p.sale_price,
      gst_rate: p.gst_rate,
      stock: p.stock
    });
    setEditing(true);
  };

  // DELETE
  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      setLoading(true);
      await API.delete(`/products/${id}`);
      loadProducts();
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
      sale_price: '',
      gst_rate: '',
      stock: ''
    });
    setEditing(false);
  };

  // SEARCH FILTER
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2>Products</h2>
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {/* FORM */}
      <div style={styles.card}>

        <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>

        <div style={styles.grid}>

          <input
            name="name"
            placeholder="Product Name"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="sale_price"
            placeholder="Price"
            type="number"
            value={form.sale_price}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="gst_rate"
            placeholder="GST %"
            type="number"
            value={form.gst_rate}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="stock"
            placeholder="Stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            style={styles.input}
          />

        </div>

        <div style={styles.actions}>
          <button style={styles.primary} onClick={saveProduct}>
            {editing ? 'Update' : 'Add'}
          </button>

          {editing && (
            <button style={styles.secondary} onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>

      </div>

      {/* TABLE */}
      <div style={styles.card}>

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p>No products found</p>
        ) : (

          <table style={styles.table}>

            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>GST %</th>
                <th>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={styles.row}>
                  <td>{p.name}</td>
                  <td>₹ {p.sale_price}</td>
                  <td>{p.gst_rate}%</td>
                  <td>{p.stock}</td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      style={styles.edit}
                      onClick={() => editProduct(p)}
                    >
                      Edit
                    </button>

                    <button
                      style={styles.delete}
                      onClick={() => deleteProduct(p.id)}
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

  grid: {
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