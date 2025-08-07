import { createContext, useContext, useState } from "react";
import API from "../api/admin";

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

// AdminAuthProvider component to manage admin authentication state and provide login/logout functionality
export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("adminAccessToken") || ""
  );

  const login = (accessToken) => {
    setToken(accessToken);
    localStorage.setItem("adminAccessToken", accessToken);
  };

  //
  const logout = async () => {
    // 1. Immediately clear local state and storage to prevent using old tokens.
    setToken("");
    localStorage.removeItem("adminAccessToken");

    try {
      await API.post("/admin/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
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
