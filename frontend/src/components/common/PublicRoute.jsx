import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, getDashboardUrl } = useAuth();
  const location = useLocation();

  // Si déjà connecté ET sur /login ou /register, rediriger vers le dashboard
  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    const dashboardUrl = getDashboardUrl();
    return <Navigate to={dashboardUrl} replace />;
  }

  return children;
};

export default PublicRoute;