// axiosInstance.js

import axios from "axios";
import { useAuth } from "./context/AuthContext"; // Although imported, not used here—can be removed if unnecessary

// ===============================
// 📦 Axios Instance Configuration
// ===============================

// Create a reusable axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api",
  withCredentials: true, // Send cookies with requests (useful for sessions)
  timeout: 10000, // Set a 10-second timeout for requests
});

// ========================================
// 🔐 Request Interceptor: Attach JWT Token
// ========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request setup errors
    return Promise.reject(error);
  }
);

// =======================================
// 🚨 Response Interceptor: Auth Handling
// =======================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the response is unauthorized, clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
