import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Composants de route
import PrivateRoute from '../components/common/PrivateRoute';
import PublicRoute from '../components/common/PublicRoute';
import RoleBasedRoute from '../components/common/RoleBasedRoute';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import DashboardManager from '../pages/DashboardManager';
import DashboardMember from '../pages/DashboardMember';
import Profile from '../pages/Profile'; // ← AJOUTER

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Route par défaut */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Routes publiques */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Routes privées avec redirection par rôle */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <RoleBasedRoute />
              </PrivateRoute>
            }
          />

          {/* Dashboards spécifiques par rôle */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <PrivateRoute allowedRoles={['manager']}>
                <DashboardManager />
              </PrivateRoute>
            }
          />

          <Route
            path="/member/dashboard"
            element={
              <PrivateRoute allowedRoles={['member']}>
                <DashboardMember />
              </PrivateRoute>
            }
          />

          {/* ⬇️ NOUVELLE ROUTE PROFILE ⬇️ */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Route 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;