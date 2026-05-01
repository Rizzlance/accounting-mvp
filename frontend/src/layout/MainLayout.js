import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Landmark,
  LogOut,
  Moon,
  Receipt,
  Sun,
  Users,
  WalletCards,
} from "lucide-react";

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

  const company = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("company")) || {};
    } catch (err) {
      return {};
    }
  }, []);

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart3 },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Products", path: "/products", icon: Boxes },
    { name: "Invoices", path: "/invoices", icon: Receipt },
    { name: "Expenses", path: "/expenses", icon: WalletCards },
    { name: "Stock", path: "/stock", icon: FileSpreadsheet },
    { name: "Ledgers", path: "/ledger", icon: Landmark },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "GST", path: "/gst", icon: Building2 },
  ];

  useEffect(() => {
    document.body.style.background = dark ? "#111827" : "#f3f4f6";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={{ ...styles.shell, background: dark ? "#111827" : "#f3f4f6" }}>
      <aside style={{ ...styles.sidebar, width: collapsed ? 76 : 248 }}>
        <div style={styles.brandRow}>
          {!collapsed && <div style={styles.brand}>Accountrix</div>}
          <button title="Toggle menu" onClick={() => setCollapsed(!collapsed)} style={styles.iconButtonDark}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav style={styles.menu}>
          {menu.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <button
                key={item.path}
                title={item.name}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.menuItem,
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? "#2563eb" : "transparent",
                }}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <button title="Logout" onClick={logout} style={styles.logout}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      <main style={styles.main}>
        <header style={{ ...styles.header, background: dark ? "#1f2937" : "#ffffff", color: dark ? "#fff" : "#111827" }}>
          <div>
            <div style={styles.companyName}>{company.company_name || "Company"}</div>
            <div style={styles.companyMeta}>{company.gst_number ? `GSTIN ${company.gst_number}` : "Accounting workspace"}</div>
          </div>

          <div style={styles.headerActions}>
            <button title="Switch company" onClick={() => navigate("/companies")} style={styles.iconButton}>
              <Building2 size={18} />
            </button>
            <button title="Toggle theme" onClick={() => setDark(!dark)} style={styles.iconButton}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <section style={styles.content}>{children}</section>
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    minHeight: "100vh",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    transition: "width 180ms ease",
  },
  brandRow: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
  },
  menu: {
    flex: 1,
    padding: 12,
  },
  menuItem: {
    width: "100%",
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#ffffff",
    border: 0,
    borderRadius: 8,
    padding: "0 12px",
    marginBottom: 6,
    cursor: "pointer",
    textAlign: "left",
  },
  logout: {
    minHeight: 42,
    margin: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "#dc2626",
    color: "#ffffff",
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    borderBottom: "1px solid #e5e7eb",
  },
  companyName: {
    fontWeight: 700,
  },
  companyMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    display: "flex",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#ffffff",
    cursor: "pointer",
  },
  iconButtonDark: {
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 8,
    background: "transparent",
    color: "#ffffff",
    cursor: "pointer",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: 24,
  },
};
