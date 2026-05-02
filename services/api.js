import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000'
});

// 🔐 REQUEST INTERCEPTOR
API.interceptors.request.use((config) => {

  // TOKEN
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🏢 COMPANY ID (THIS IS YOUR LINE)
  const company = JSON.parse(localStorage.getItem('company'));

  if (company) {
    config.headers['x-company-id'] = company.id;
  }

  return config;
});

export default API;