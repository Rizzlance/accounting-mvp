import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const company = localStorage.getItem("company");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (company) {
    try {
      const parsed = JSON.parse(company);
      if (parsed?.id) {
        config.headers["x-company-id"] = parsed.id;
      }
    } catch (err) {
      localStorage.removeItem("company");
    }
  }

  return config;
});

export default API;
