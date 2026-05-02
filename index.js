import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CompanyProvider } from './context/CompanyContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <CompanyProvider>
    <App />
  </CompanyProvider>
);