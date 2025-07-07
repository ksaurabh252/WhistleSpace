import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Create the authentication context
const AuthContext = createContext();

/**
 * Provides authentication context to the application
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Components that will have access to the auth context
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    isLoggedIn: false,
    loading: true
  });

  const navigate = useNavigate();

  /**
   * Validates token on initial load (or page refresh)
   * Sets user session if token is valid, clears session if not
   *
   * @returns {Promise<void>}
   */
  const validateToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
      // No token, just stop loading
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Validate token with backend
      const { data } = await api.get('/api/admin/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Set auth state with validated user
      setAuthState({
        token,
        user: data.user || user,
        isLoggedIn: true,
        loading: false
      });
    } catch (err) {
      console.error('Token validation error:', err);

      // If validation fails, clear local storage and auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        token: null,
        user: null,
        isLoggedIn: false,
        loading: false
      });
    }
  }, []);

  // Run token validation on mount
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  /**
   * Logs in a user with email and password
   *
   * @param {string} email - Admin user's email
   * @param {string} password - Admin user's password
   * @returns {Promise<Object>} - Success flag and error message (if any)
   */
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/api/admin/login', { email, password });

      // Save token and user info in state and local storage
      setAuthState({
        token: data.token,
        user: data.user,
        isLoggedIn: true,
        loading: false
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Navigate to admin dashboard
      navigate('/admin');
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed'
      };
    }
  }, [navigate]);

  /**
   * Logs out the current user
   *
   * @returns {void}
   */
  const logout = useCallback(() => {
    // Clear session and redirect to login page
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      token: null,
      user: null,
      isLoggedIn: false,
      loading: false
    });
    navigate('/login');
  }, [navigate]);

  /**
   * Handles user signup using email, password, and optional Google token.
   *
   * Sends a POST request to the backend to create a new admin user. On success,
   * updates the authentication state and stores the token and user info in localStorage.
   *
   * @function
   * @async
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @param {string} [googleToken] - Optional Google authentication token.
   * @returns {Promise<{success: boolean, error?: string}>} An object indicating success or failure, and an error message if failed.
   */
  const signup = useCallback(async (email, password, googleToken) => {
    try {
      const { data } = await api.post('/api/admin/signup', {
        email,
        password,
        googleToken
      });

      setAuthState({
        token: data.token,
        user: data.user,
        isLoggedIn: true,
        loading: false
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Signup failed'
      };
    }
  }, []);

  /**
   * Refreshes the current user's access token
   *
   * @returns {Promise<boolean>} - True if refreshed, false otherwise
   */
  const refreshToken = useCallback(async () => {
    try {
      const { data } = await api.post('/api/admin/refresh-token');
      const newToken = data.token;

      setAuthState(prev => ({
        ...prev,
        token: newToken
      }));

      localStorage.setItem('token', newToken);
      return true;
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      logout(); // Force logout if token refresh fails
      return false;
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      refreshToken,
      signup,
      setAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 *
 * @returns {Object} - Authentication state and methods
 * @throws {Error} - If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
