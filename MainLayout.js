import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ICONS (install first: npm install lucide-react)
import {
  LayoutDashboard,
  Users,
  Box,
  FileText,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function MainLayout({ children }) {

  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  const menu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Products', path: '/products', icon: Box },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'GST Report', path: '/gst', icon: FileText }
  ];

  // LOAD THEME
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  // APPLY THEME
  useEffect(() => {
    document.body.style.background = dark ? '#0f172a' : '#f1f5f9';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <div style={{
        ...styles.sidebar,
        width: collapsed ? 70 : 240,
        background: dark ? '#020617' : '#111827'
      }}>

        {/* TOP */}
        <div style={styles.top}>
          {!collapsed && <h2 style={styles.logo}>Arcadia</h2>}

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={styles.toggle}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* MENU */}
        <div style={styles.menu}>
          {menu.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <div
                key={item.path}
                title={collapsed ? item.name : ''}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.menuItem,
                  background: active ? '#2563eb' : 'transparent'
                }}
              >
                <Icon size={18} />
                {!collapsed && <span style={{ marginLeft: 10 }}>{item.name}</span>}
              </div>
            );
          })}
        </div>

        {/* LOGOUT */}
        <div style={styles.bottom}>
          <div style={styles.logout} onClick={logout}>
            <LogOut size={18} />
            {!collapsed && <span style={{ marginLeft: 8 }}>Logout</span>}
          </div>
        </div>

      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* HEADER */}
        <div style={{
          ...styles.header,
          background: dark ? '#020617' : '#fff',
          color: dark ? '#fff' : '#000'
        }}>

          {/* COMPANY */}
          <div>
            <strong>
              {JSON.parse(localStorage.getItem('company'))?.company_name || 'Company'}
            </strong>
          </div>

          {/* RIGHT SIDE */}
          <div style={styles.right}>

            {/* THEME TOGGLE */}
            <button onClick={() => setDark(!dark)} style={styles.iconBtn}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* NOTIFICATIONS */}
            <button style={styles.iconBtn}>
              <Bell size={18} />
            </button>

            {/* USER */}
            <div style={styles.userBox}>

              <div onClick={() => setOpenMenu(!openMenu)} style={styles.avatar}>
                👤
              </div>

              {openMenu && (
                <div style={{
                  ...styles.dropdown,
                  background: dark ? '#1e293b' : '#fff'
                }}>
                  <div style={styles.dropdownItem}>Profile</div>
                  <div style={styles.dropdownItem}>Settings</div>
                  <div style={styles.dropdownItem} onClick={logout}>
                    Logout
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          {children}
        </div>

      </div>

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh'
  },

  sidebar: {
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    transition: '0.3s'
  },

  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20
  },

  logo: {
    fontSize: 18
  },

  toggle: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer'
  },

  menu: {
    flex: 1,
    padding: 10
  },

  menuItem: {
    padding: 12,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
    transition: '0.2s'
  },

  bottom: {
    padding: 10
  },

  logout: {
    display: 'flex',
    alignItems: 'center',
    padding: 12,
    background: '#ef4444',
    borderRadius: 8,
    cursor: 'pointer'
  },

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },

  header: {
    height: 60,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    borderBottom: '1px solid #e5e7eb'
  },

  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },

  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },

  userBox: {
    position: 'relative'
  },

  avatar: {
    cursor: 'pointer',
    fontSize: 18
  },

  dropdown: {
    position: 'absolute',
    right: 0,
    top: 40,
    width: 150,
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },

  dropdownItem: {
    padding: 10,
    cursor: 'pointer',
    borderBottom: '1px solid #eee'
  },

  content: {
    padding: 20,
    overflowY: 'auto'
  }
};