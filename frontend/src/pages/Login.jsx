import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import './Login.css';

import logoImage from '../assets/images/pioneer-logo.png';
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, getDashboardUrl } = useAuth();

  const [formData, setFormData] = useState({
    email: location.state?.email || '', // ← Pré-remplir l'email depuis l'inscription
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const dashboardUrl = getDashboardUrl();
      navigate(dashboardUrl);
    }

    // ⬇️ Afficher un message de succès si redirection depuis l'inscription
    if (location.state?.registrationSuccess) {
      setAlert({
        type: 'success',
        message: '✅ Inscription réussie ! Connectez-vous avec vos identifiants.'
      });

      // Nettoyer le state après affichage
      window.history.replaceState({}, document.title);
    }
  }, [isAuthenticated, navigate, getDashboardUrl, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setAlert({
          type: 'success',
          message: 'Connexion réussie ! Redirection...'
        });

        setTimeout(() => {
          const dashboardUrl = getDashboardUrl();
          navigate(dashboardUrl);
        }, 1000);
      } else {
        setAlert({
          type: 'error',
          message: result.message || 'Erreur de connexion'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Fond animé */}
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-box">
          {/* Logo et titre */}
          <div className="login-header">
            <div className="logo-container">
              {/* GARDEZ SEULEMENT L'IMAGE */}
             <img src={logoImage} alt="Pioneer Tech" className="logo-image" />
            </div>
            <h2>Connexion</h2>
            <p className="subtitle">Connectez-vous pour gérer vos projets</p>
          </div>

          {/* Alerte */}
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="Adresse email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@pioneertech.com"
              error={errors.email}
              required
              autoFocus
            />

            <Input
              label="Mot de passe"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              error={errors.password}
              required
            />

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Se connecter
            </Button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <div className="divider">
              <span>Compte de test admin</span>
            </div>
            <div className="test-credentials">
              <div className="credential-item">
                <span className="label">Email :</span>
                <span className="value">admin@Pioneertech.com</span>
              </div>
              <div className="credential-item">
                <span className="label">Mot de passe :</span>
                <span className="value">Admin123!</span>
              </div>
            </div>

            {/* Lien vers inscription */}
            <div className="register-link-section">
              <p className="register-text">
                Pas encore de compte ?{' '}
                <Link to="/register" className="register-link">
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="copyright">
            <p>© 2026 Pioneer Tech. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;