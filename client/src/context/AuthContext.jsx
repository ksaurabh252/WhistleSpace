import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

/**
 * Authentication Context
 * @type {React.Context}
 */
const AuthContext = createContext();

/**
 * Authentication Provider Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const AuthProvider = ({ children }) => {
  // State management
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Token validation on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/api/admin/validate');
          setUser(res.data.user);
          setToken(storedToken);
        } catch (err) {
          localStorage.removeItem('token');
          console.error("Token validation error:", err);
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  /**
   * Handle user signup
   * @param {string} email - User email
   * @param {string} password - User password (optional for Google signup)
   * @param {string} googleToken - Google OAuth token (optional)
   * @returns {Promise<Object>} Success status and error message if any
   */
  const signup = async (email, password, googleToken) => {
    try {
      const payload = googleToken ? { email, googleToken } : { email, password };
      const res = await api.post('/api/admin/signup', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/admin');

      return { success: true };
    } catch (err) {
      console.error('Signup error:', err);
      return {
        success: false,
        error: err.response?.data?.error ||
          err.response?.data?.message ||
          'Signup failed. Please try again.'
      };
    }
  };

  /**
   * Handle user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Success status and error message if any
   */
  const login = async (email, password) => {
    try {
      const res = await api.post('/admin/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setToken(res.data.token);

      const userRes = await api.get(`/admin/users/${res.data.user.id}`);
      setUser(userRes.data);
      navigate('/admin');

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed'
      };
    }
  };

  /**
   * Handle user logout
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  /**
   * Refresh authentication token
   * @returns {Promise<string|null>} New token or null if refresh failed
   */
  const refreshToken = async () => {
    try {
      const response = await api.post('/admin/refresh');
      const newToken = response.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      return newToken;
    } catch (err) {
      logout();
      console.error("Token refresh error:", err);
      return null;
    }
  };

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        token,
        login,
        logout,
        refreshToken,
        isLoggedIn,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => useContext(AuthContext);
