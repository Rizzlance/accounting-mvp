import React from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaFileInvoice, FaList } from 'react-icons/fa';

function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>

      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <h2 style={{ color: 'white' }}>📊 Accounting</h2>

        <Link to="/" style={linkStyle}>
          <FaChartBar /> Dashboard
        </Link>

        <Link to="/invoice" style={linkStyle}>
          <FaFileInvoice /> Create Invoice
        </Link>

        <Link to="/invoices" style={linkStyle}>
          <FaList /> Invoices
        </Link>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1 }}>
        <div style={topbarStyle}>
          <h3>Business Accounting System</h3>
        </div>

        <div style={{ padding: 20 }}>
          {children}
        </div>
      </div>

    </div>
  );
}

const sidebarStyle = {
  width: '220px',
  height: '100vh',
  background: '#1e1e2f',
  padding: '20px',
  color: 'white'
};

const linkStyle = {
  display: 'block',
  color: 'white',
  margin: '15px 0',
  textDecoration: 'none'
};

const topbarStyle = {
  background: '#f5f5f5',
  padding: '15px',
  borderBottom: '1px solid #ddd'
};

export default Layout;