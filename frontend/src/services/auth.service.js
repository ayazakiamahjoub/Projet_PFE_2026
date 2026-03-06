import api from './api';

const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur de connexion au serveur' 
      };
    }
  },

  /**
   * Vérifier l'email avec le token
   */
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la vérification' 
      };
    }
  },

  /**
   * Renvoyer l'email de vérification
   */
  resendVerification: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de l\'envoi de l\'email' 
      };
    }
  },

  /**
   * Connexion utilisateur
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur de connexion au serveur' 
      };
    }
  },

  /**
   * Obtenir le profil utilisateur
   */
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la récupération du profil' 
      };
    }
  },

  /**
   * Déconnexion
   */
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la déconnexion' 
      };
    }
  },

  /**
   * Vérifier le token
   */
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: 'Token invalide' 
      };
    }
  }
};

export default authService;