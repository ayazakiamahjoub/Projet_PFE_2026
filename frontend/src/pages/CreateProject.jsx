import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './CreateProject.css';

const CreateProject = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    currency: 'TND',
    startDate: '',
    endDate: '',
    priority: 'medium',
    color: '#FF6B35',
    tags: ''
  });

  const [errors, setErrors] = useState({});

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

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Le budget doit être un nombre';
    }

    if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Le budget doit être positif';
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
      const token = localStorage.getItem('token');

      // Préparer les données
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        currency: formData.currency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        priority: formData.priority,
        color: formData.color,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Projet créé avec succès !'
        });

        // Redirection après 2 secondes
        setTimeout(() => {
          navigate(getDashboardUrl());
        }, 2000);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de la création du projet'
        });
      }
    } catch (error) {
      console.error('Erreur création projet:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const colorPresets = [
    { value: '#FF6B35', label: 'Orange' },
    { value: '#3B82F6', label: 'Bleu' },
    { value: '#10B981', label: 'Vert' },
    { value: '#8B5CF6', label: 'Violet' },
    { value: '#F59E0B', label: 'Ambre' },
    { value: '#EF4444', label: 'Rouge' },
    { value: '#EC4899', label: 'Rose' },
    { value: '#14B8A6', label: 'Turquoise' }
  ];

  return (
    <div className="dashboard-clean">
      {/* Header */}
      <header className="header-clean">
        <div className="header-wrapper">
          <div 
            className="brand" 
            onClick={() => navigate(getDashboardUrl())}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Créer un Projet</span>
            </div>
          </div>

          <div className="header-end">
            <div className="profile">
              <div className="profile-avatar">
                {user?.avatarUrl ? (
                  <img 
                    src={`http://localhost:5000${user.avatarUrl}`} 
                    alt="Avatar" 
                    className="avatar-img"
                  />
                ) : (
                  <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
                )}
              </div>
              <div className="profile-details">
                <span className="profile-name">{user?.firstName} {user?.lastName}</span>
                <span className="profile-role">{user?.role}</span>
              </div>
            </div>

            <button className="btn-logout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5m0 0l-5-5m5 5H9" 
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="content">
        <div className="content-wrapper">
          {/* Bouton retour */}
          <button className="btn-back" onClick={() => navigate(getDashboardUrl())}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour au tableau de bord
          </button>

          <div className="create-project-container">
            <div className="create-project-header">
              <div className="header-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M2 12h20" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h1 className="create-project-title">Créer un nouveau projet</h1>
                <p className="create-project-subtitle">Remplissez les informations pour démarrer votre projet</p>
              </div>
            </div>

            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="create-project-form">
              {/* Informations générales */}
              <div className="form-section">
                <h2 className="form-section-title">Informations générales</h2>

                <Input
                  label="Titre du projet *"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  placeholder="Ex: Refonte du site web"
                  required
                />

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Décrivez les objectifs et le périmètre du projet..."
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="form-section">
                <h2 className="form-section-title">Budget</h2>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="budget">Montant</label>
                    <input
                      type="number"
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={errors.budget ? 'error' : ''}
                    />
                    {errors.budget && <span className="error-text">{errors.budget}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="currency">Devise</label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                    >
                      <option value="TND">TND (Dinar Tunisien)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="USD">USD (Dollar)</option>
                      <option value="GBP">GBP (Livre Sterling)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="form-section">
                <h2 className="form-section-title">Dates</h2>

                <div className="form-row">
                  <Input
                    label="Date de début *"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    error={errors.startDate}
                    required
                  />

                  <Input
                    label="Date de fin *"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    error={errors.endDate}
                    required
                  />
                </div>
              </div>

              {/* Paramètres */}
              <div className="form-section">
                <h2 className="form-section-title">Paramètres</h2>

                <div className="form-group">
                  <label htmlFor="priority">Priorité</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Couleur du projet</label>
                  <div className="color-picker">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className={`color-option ${formData.color === preset.value ? 'active' : ''}`}
                        style={{ backgroundColor: preset.value }}
                        onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                        title={preset.label}
                      >
                        {formData.color === preset.value && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white">
                            <polyline points="20 6 9 17 4 12" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Tags (séparés par des virgules)"
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="web, design, frontend"
                />
              </div>

              {/* Actions */}
              <div className="form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(getDashboardUrl())}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                >
                  Créer le projet
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateProject;