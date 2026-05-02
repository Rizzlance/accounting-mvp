import React, { useState } from 'react';
import API from '../services/api';

export default function GST() {

  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [data, setData] = useState(null);

  const loadGST = async () => {
    try {
      const res = await API.get(`/gst?month=${month}&year=${year}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load GST');
    }
  };

  return (
    <div>

      <h2>GST Report</h2>

      {/* FILTER */}
      <div style={styles.filter}>
        <input
          placeholder="Month (1-12)"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />

        <input
          placeholder="Year (2026)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />

        <button onClick={loadGST}>Load</button>
      </div>

      {/* RESULT */}
      {data && (
        <div style={styles.card}>

          <Row label="Taxable Value" value={data.taxable_value} />
          <Row label="GST Total" value={data.gst_total} />
          <Row label="CGST (50%)" value={data.cgst} />
          <Row label="SGST (50%)" value={data.sgst} />

        </div>
      )}

    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span>{label}</span>
      <strong>₹ {value}</strong>
    </div>
  );
}

const styles = {
  filter: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },

  card: {
    background: '#fff',
    padding: 20,
    borderRadius: 10
  },

  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10
  }
};