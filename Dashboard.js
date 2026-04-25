import React, { useEffect, useState } from 'react';
import API from '../services/api';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {

  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    margin: 0
  });

  const [monthly, setMonthly] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {

      const [invRes, itemRes, prodRes] = await Promise.all([
        API.get('/invoice'),
        API.get('/invoice-items'), // ⚠️ backend needed
        API.get('/products')
      ]);

      const invoices = invRes.data;
      const items = itemRes.data;
      const products = prodRes.data;

      // MAP PRODUCTS
      const productMap = {};
      products.forEach(p => {
        productMap[p.id] = p;
      });

      let revenue = 0;
      let cost = 0;

      const monthMap = {};
      const productProfit = {};

      items.forEach(i => {
        const p = productMap[i.product_id];

        const sale = i.qty * i.price;
        const purchase = i.qty * (p?.purchase_price || 0);

        const profit = sale - purchase;

        revenue += sale;
        cost += purchase;

        // MONTHLY
        const inv = invoices.find(x => x.id === i.invoice_id);
        const date = new Date(inv.created_at);
        const key = `${date.getMonth()+1}/${date.getFullYear()}`;

        if (!monthMap[key]) monthMap[key] = { revenue: 0, profit: 0 };

        monthMap[key].revenue += sale;
        monthMap[key].profit += profit;

        // PRODUCT PROFIT
        const name = p?.name || 'Unknown';

        productProfit[name] = (productProfit[name] || 0) + profit;
      });

      const totalProfit = revenue - cost;
      const margin = revenue ? ((totalProfit / revenue) * 100).toFixed(1) : 0;

      setStats({
        revenue,
        profit: totalProfit,
        margin
      });

      // MONTHLY ARRAY
      const monthArr = Object.keys(monthMap).map(m => ({
        month: m,
        revenue: monthMap[m].revenue,
        profit: monthMap[m].profit
      }));

      setMonthly(monthArr);

      // TOP PRODUCTS
      const top = Object.keys(productProfit)
        .map(name => ({ name, profit: productProfit[name] }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

      setTopProducts(top);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>

      <h2 style={{ marginBottom: 20 }}>Profit Analytics</h2>

      {/* KPI */}
      <div style={styles.grid}>
        <Card title="Revenue" value={`₹ ${stats.revenue}`} />
        <Card title="Profit" value={`₹ ${stats.profit}`} />
        <Card title="Margin %" value={`${stats.margin}%`} />
      </div>

      {/* CHART */}
      <div style={styles.card}>
        <h3>Monthly Profit vs Revenue</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" />
            <Bar dataKey="profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TOP PRODUCTS */}
      <div style={styles.card}>
        <h3>Top Profitable Products</h3>

        {topProducts.map((p, i) => (
          <div key={i} style={styles.row}>
            <span>{p.name}</span>
            <strong>₹ {p.profit}</strong>
          </div>
        ))}
      </div>

    </div>
  );
}


// CARD
function Card({ title, value }) {
  return (
    <div style={styles.kpi}>
      <div>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}


// STYLES
const styles = {

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
    marginBottom: 30
  },

  card: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  },

  kpi: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  },

  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 10,
    borderBottom: '1px solid #eee'
  }
};