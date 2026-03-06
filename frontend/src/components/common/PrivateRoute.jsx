import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route privée avec vérification optionnelle des rôles
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Rediriger vers le dashboard approprié pour son rôle
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;