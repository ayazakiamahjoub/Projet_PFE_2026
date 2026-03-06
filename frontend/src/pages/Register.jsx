import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import './Register.css';

import logoImage from '../assets/images/pioneer-logo.png';

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'member'
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Numéro de téléphone invalide';
      } else if (formData.phone.length < 8) {
        newErrors.phone = 'Le numéro doit contenir au moins 8 chiffres';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        role: formData.role
      })
    });

    const data = await response.json();

    if (data.success) {
      setAlert({
        type: 'success',
        message: 'Inscription réussie ! Redirection vers la page de connexion...'
      });

      // Redirection vers la page de LOGIN (pas de connexion automatique)
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            registrationSuccess: true,
            email: formData.email 
          } 
        });
      }, 2000);
    } else {
      setAlert({
        type: 'error',
        message: data.message || 'Erreur lors de l\'inscription'
      });
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    setAlert({
      type: 'error',
      message: 'Erreur de connexion au serveur. Veuillez réessayer.'
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="register-page">
      <div className="register-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="register-container">
        <div className="register-box">
          <div className="register-header">
            <div className="logo-container">
              {/* GARDEZ SEULEMENT L'IMAGE */}
             <img src={logoImage} alt="Pioneer Tech" className="logo-image" />
            </div>
            <h2>Créer un compte</h2>
            <p className="subtitle">Rejoignez notre plateforme de gestion de projets</p>
          </div>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <Input
                label="Prénom"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Jean"
                error={errors.firstName}
                required
                autoFocus
              />

              <Input
                label="Nom"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Dupont"
                error={errors.lastName}
                required
              />
            </div>

            <Input
              label="Adresse email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jean.dupont@example.com"
              error={errors.email}
              required
            />

            <Input
              label="Numéro de téléphone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+216 XX XXX XXX (optionnel)"
              error={errors.phone}
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

            <Input
              label="Confirmer le mot de passe"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              error={errors.confirmPassword}
              required
            />

            <div className="form-group">
              <label htmlFor="role" className="input-label">
                Je suis <span className="required">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="select-field"
              >
                <option value="member">Membre d'équipe</option>
                <option value="manager">Chef de projet</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              S'inscrire
            </Button>
          </form>

          <div className="register-footer">
            <p className="login-link">
              Vous avez déjà un compte ?{' '}
              <Link to="/login">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;