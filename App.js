import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

// PAGES
import Login from './pages/Login';
import Register from './pages/Register';
import CompanySwitch from './pages/CompanySwitch';
import CreateCompany from "./pages/CreateCompany";
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import GST from './pages/GST';

// LAYOUT
import MainLayout from './layout/MainLayout';

// ==========================
// 🔐 AUTH CHECK
// ==========================
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

const hasCompany = () => {
  return !!localStorage.getItem('company');
};

// ==========================
// 🔐 PRIVATE ROUTE
// ==========================
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

// ==========================
// 🏢 COMPANY ROUTE (UPDATED)
// ==========================
const CompanyRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/" />;

  const allowedNoCompanyRoutes = ["/companies", "/create-company"];
  const currentPath = window.location.pathname;

  if (!hasCompany() && !allowedNoCompanyRoutes.includes(currentPath)) {
    return <Navigate to="/companies" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* COMPANY SWITCH */}
        <Route
          path="/companies"
          element={
            <PrivateRoute>
              <CompanySwitch />
            </PrivateRoute>
          }
        />

        {/* CREATE COMPANY */}
        <Route
          path="/create-company"
          element={
            <PrivateRoute>
              <CreateCompany />
            </PrivateRoute>
          }
        />

        {/* DASHBOARD */}
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

        {/* CUSTOMERS */}
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

        {/* PRODUCTS */}
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

        {/* INVOICES */}
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

        {/* GST */}
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

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;