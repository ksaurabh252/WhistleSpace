import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminRoute = ({ children }) => {
  const { isLoggedIn } = useAdminAuth();
  return isLoggedIn ? children : <Navigate to="/admin/login" />;
};

export default AdminRoute;