import { createContext, useContext, useState } from "react";
import API from "../api/admin";

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("adminAccessToken") || ""
  );

  const login = (accessToken) => {
    setToken(accessToken);
    localStorage.setItem("adminAccessToken", accessToken);
  };

  const logout = async () => {
    try {
      await API.post("/admin/logout", {}, { withCredentials: true });
    } catch (error) {
      setToken("");
      localStorage.removeItem("adminAccessToken");
      window.location.href = "/admin/login";
      console.error("Logout error:", error);
    } finally {
      // Always clear local state and storage
      setToken("");
      localStorage.removeItem("adminAccessToken");
      window.location.href = "/admin/login";
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{ token, login, logout, isLoggedIn: !!token }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
