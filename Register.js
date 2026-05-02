import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
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

  const register = async () => {
    try {
      if (!form.name || !form.email || !form.password) {
        return alert('All fields are required');
      }

      setLoading(true);

      const res = await API.post('/auth/register', form);

      // SAVE TOKEN
      localStorage.setItem('token', res.data.token);

      // REDIRECT TO COMPANY
      navigate('/companies');

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h2 style={styles.title}>Create Account</h2>

        <input
          name="name"
          placeholder="Full Name"
          style={styles.input}
          onChange={handleChange}
        />

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
          onClick={register}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Register'}
        </button>

        <p style={styles.footer}>
          Already have an account?{' '}
          <span
            style={styles.link}
            onClick={() => navigate('/')}
          >
            Login
          </span>
        </p>

      </div>

    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #1e293b, #0f172a)'
  },

  card: {
    width: 350,
    padding: 30,
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },

  title: {
    marginBottom: 20,
    textAlign: 'center'
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
    textAlign: 'center',
    fontSize: 14
  },

  link: {
    color: '#2563eb',
    cursor: 'pointer'
  }
};