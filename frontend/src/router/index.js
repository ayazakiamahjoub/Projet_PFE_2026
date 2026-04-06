import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext'; 

// Composants de route
import PrivateRoute from '../components/common/PrivateRoute';
import PublicRoute from '../components/common/PublicRoute';
import RoleBasedRoute from '../components/common/RoleBasedRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import DashboardManager from '../pages/DashboardManager';
import DashboardMember from '../pages/DashboardMember';
import Profile from '../pages/Profile';
import UserManagement from '../pages/UserManagement';
import CreateProject from '../pages/CreateProject';
import EditProject from '../pages/EditProject';
import ProjectDetail from '../pages/ProjectDetail';
import AdminProjects from '../pages/AdminProjects';
import AdminTasks from '../pages/AdminTasks';


const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
       <ThemeProvider>
        <Routes>
          {/* Route d'accueil */}
          <Route path="/" element={<Home />} />

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
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route 
        path="/admin/projects" 
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminProjects />
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
            path="/manager/projects/create"
            element={
              <PrivateRoute allowedRoles={['manager', 'admin']}>
                <CreateProject />
              </PrivateRoute>
            }
          />
           <Route
            path="/manager/projects/:id/edit"
            element={
              <PrivateRoute allowedRoles={['manager', 'admin']}>
                <EditProject />
              </PrivateRoute>
            }
          />
          <Route
            path="/manager/projects/:id"
            element={
              <PrivateRoute allowedRoles={['manager', 'admin']}>
                <ProjectDetail />
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

          {/* Route Profile */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          // Dans le Router
<Route path="/admin/tasks" element={<AdminTasks />} />


          {/* Route 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;