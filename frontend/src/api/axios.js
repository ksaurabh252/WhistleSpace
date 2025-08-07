import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:5000";

// Create an Axios instance with the base URL and credentials enabled.
const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to attach the admin access token if available.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminAccessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh.
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await API.post("/admin/refresh");
        const newToken = res.data.accessToken;

        localStorage.setItem("adminAccessToken", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request with the new token
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log the user out
        localStorage.removeItem("adminAccessToken");
        window.location.href = "/admin/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
