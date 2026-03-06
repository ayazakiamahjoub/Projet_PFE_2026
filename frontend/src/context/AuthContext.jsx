import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger l'utilisateur au montage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          // Vérifier que le token est toujours valide
          try {
            await authService.verifyToken();
          } catch (error) {
            console.error('Token invalide, déconnexion...');
            logout();
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
 * Inscription (avec connexion automatique)
 */
const register = async (userData) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (data.success) {
      const { token, user } = data.data;

      // Sauvegarder dans le localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Mettre à jour le state
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);

      return { 
        success: true,
        user: user
      };
    } else {
      return { 
        success: false, 
        message: data.message || 'Erreur lors de l\'inscription' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Erreur lors de l\'inscription' 
    };
  }
};
  /**
   * Connexion
   */
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        const { token, user } = response.data;

        // Sauvegarder dans le localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Mettre à jour le state
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);

        return { success: true, user };
      } else {
        return { 
          success: false, 
          message: response.message || 'Erreur de connexion',
          needsVerification: response.needsVerification
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur de connexion' 
      };
    }
  };

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Réinitialiser le state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Obtenir le dashboard URL selon le rôle
   */
  const getDashboardUrl = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'member':
        return '/member/dashboard';
      default:
        return '/dashboard';
    }
  };

  /**
   * Vérifier si l'utilisateur est admin
   */
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  /**
   * Vérifier si l'utilisateur est manager
   */
  const isManager = () => {
    return user?.role === 'manager';
  };

  /**
   * Vérifier si l'utilisateur est member
   */
  const isMember = () => {
    return user?.role === 'member';
  };

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  /**
   * Vérifier si l'utilisateur a l'un des rôles spécifiés
   */
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    getDashboardUrl,
    isAdmin,
    isManager,
    isMember,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};