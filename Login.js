import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const login = async () => {
    try {
      if (!form.email || !form.password) {
        return alert('Enter email & password');
      }

      setLoading(true);

      const res = await API.post('/auth/login', form);

      // SAVE TOKEN
      localStorage.setItem('token', res.data.token);

      // CLEAR OLD COMPANY
      localStorage.removeItem('company');

      // REDIRECT
      navigate('/companies');

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {/* LEFT SIDE */}
      <div style={styles.left}>
        <h1 style={styles.brand}>Arcadia</h1>
        <p style={styles.tagline}>
          Smart Accounting for Modern Businesses
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div style={styles.right}>

        <div style={styles.card}>

          <h2 style={styles.title}>Welcome Back</h2>

          <input
            name="email"
            placeholder="Email"
            style={styles.input}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            style={styles.input}
            onChange={handleChange}
          />

          <button
            style={styles.button}
            onClick={login}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <p style={styles.footer}>
            Don’t have an account?{' '}
            <span
              style={styles.link}
              onClick={() => navigate('/register')}
            >
              Register
            </span>
          </p>

        </div>

      </div>

    </div>
  );
}


// =====================
// STYLES
// =====================
const styles = {

  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial'
  },

  left: {
    flex: 1,
    background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 50
  },

  brand: {
    fontSize: 40,
    fontWeight: 'bold'
  },

  tagline: {
    marginTop: 10,
    fontSize: 18,
    opacity: 0.9
  },

  right: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f1f5f9'
  },

  card: {
    width: 350,
    padding: 30,
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  },

  title: {
    marginBottom: 20
  },

  input: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
    border: '1px solid #ddd'
  },

  button: {
    width: '100%',
    padding: 12,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  footer: {
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center'
  },

  link: {
    color: '#2563eb',
    cursor: 'pointer'
  }
};