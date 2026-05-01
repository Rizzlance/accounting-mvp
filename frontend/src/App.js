
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * =========================
 * AUTH PAGES
 * =========================
 */
import Login from "./pages/Login";
import Register from "./pages/Register";

/**
 * =========================
 * COMPANY FLOW
 * =========================
 */
import CompanySwitch from "./pages/CompanySwitch";
import CreateCompany from "./pages/CreateCompany";

/**
 * =========================
 * ERP MODULES
 * =========================
 */
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import GST from "./pages/GST";
import Stock from "./pages/Stock";
import Ledger from "./pages/Ledger";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";

/**
 * =========================
 * LAYOUT
 * =========================
 */
import MainLayout from "./layout/MainLayout";

/**
 * =========================
 * AUTH CHECKS
 * =========================
 */
const isAuth = () => !!localStorage.getItem("token");
const hasCompany = () => !!localStorage.getItem("company");

/**
 * =========================
 * GUARDS
 * =========================
 */
const PrivateRoute = ({ children }) => {
  return isAuth() ? children : <Navigate to="/" />;
};

const CompanyRoute = ({ children }) => {
  if (!isAuth()) return <Navigate to="/" />;
  if (!hasCompany()) return <Navigate to="/companies" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= AUTH ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= COMPANY FLOW ================= */}
        <Route
          path="/companies"
          element={
            <PrivateRoute>
              <CompanySwitch />
            </PrivateRoute>
          }
        />

        <Route
          path="/create-company"
          element={
            <PrivateRoute>
              <CreateCompany />
            </PrivateRoute>
          }
        />

        {/* ================= ERP CORE ================= */}
        <Route
          path="/dashboard"
          element={
            <CompanyRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <CompanyRoute>
              <MainLayout>
                <Customers />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/products"
          element={
            <CompanyRoute>
              <MainLayout>
                <Products />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <CompanyRoute>
              <MainLayout>
                <Invoices />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/gst"
          element={
            <CompanyRoute>
              <MainLayout>
                <GST />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/stock"
          element={
            <CompanyRoute>
              <MainLayout>
                <Stock />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/ledger"
          element={
            <CompanyRoute>
              <MainLayout>
                <Ledger />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <CompanyRoute>
              <MainLayout>
                <Reports />
              </MainLayout>
            </CompanyRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <CompanyRoute>
              <MainLayout>
                <Expenses />
              </MainLayout>
            </CompanyRoute>
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
