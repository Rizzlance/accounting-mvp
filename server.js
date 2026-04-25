require('dotenv').config();

const express = require('express');
const cors = require('cors');
const invoiceRoutes = require('./routes/invoice');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const invoiceItemsRoutes = require('./routes/invoiceItems');
const gstRoutes = require('./routes/gst');
const app = express();

// ======================
// 🔧 CONFIG
// ======================
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ======================
// 🌐 MIDDLEWARE
// ======================

// CORS (Frontend → Backend connection)
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

// JSON Body Parser
app.use(express.json());

// ======================
// 🔐 ROUTES
// ======================

app.use('/auth', require('./routes/auth'));
app.use('/company', require('./routes/company'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/invoice', invoiceRoutes);
app.use('/products', productRoutes);
app.use('/customers', customerRoutes);
app.use('/invoice-items', invoiceItemsRoutes);
app.use('/gst', gstRoutes);
// ======================
// 🧪 HEALTH CHECK
// ======================
app.get('/', (req, res) => {
  res.send('✅ API WORKING');
});

// ======================
// ❌ 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// ======================
// 🚨 GLOBAL ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ======================
// 🚀 START SERVER
// ======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});