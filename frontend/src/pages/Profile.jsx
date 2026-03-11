import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './Profile.css';

const Profile = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('info'); // 'info' ou 'password'
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // États pour l'avatar
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Formulaire informations personnelles
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Formulaire changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  // Charger les données utilisateur au montage
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });

      // Charger l'avatar existant
      if (user.avatarUrl) {
        setAvatarPreview(`http://localhost:5000${user.avatarUrl}`);
      }
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
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

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (profileData.firstName.length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (profileData.lastName.length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!profileData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (profileData.phone && profileData.phone.trim() !== '') {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(profileData.phone)) {
        newErrors.phone = 'Numéro de téléphone invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!validateProfileForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour les données utilisateur dans le localStorage
        localStorage.setItem('user', JSON.stringify(data.data.user));

        setAlert({
          type: 'success',
          message: 'Profil mis à jour avec succès !'
        });

        // Recharger la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de la mise à jour'
        });
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Mot de passe changé avec succès !'
        });

        // Réinitialiser le formulaire
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors du changement de mot de passe'
        });
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== FONCTIONS AVATAR =====

  // Gérer la sélection de fichier
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setAlert({
          type: 'error',
          message: 'Format non supporté. Utilisez JPG, PNG, GIF ou WebP.'
        });
        return;
      }

      // Vérifier la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setAlert({
          type: 'error',
          message: 'Le fichier est trop volumineux. Maximum 5MB.'
        });
        return;
      }

      setAvatarFile(file);
      
      // Prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload de l'avatar
  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      setAlert({
        type: 'error',
        message: 'Veuillez sélectionner une image'
      });
      return;
    }

    setUploadingAvatar(true);
    setAlert(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('http://localhost:5000/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour l'utilisateur dans le localStorage
        const updatedUser = { ...user, avatarUrl: data.data.avatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setAlert({
          type: 'success',
          message: 'Photo de profil mise à jour avec succès !'
        });

        setAvatarFile(null);

        // Recharger après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de l\'upload'
        });
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Supprimer l'avatar
  const handleDeleteAvatar = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      return;
    }

    setUploadingAvatar(true);
    setAlert(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, avatarUrl: null };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setAvatarPreview(null);
        setAvatarFile(null);

        setAlert({
          type: 'success',
          message: 'Photo de profil supprimée avec succès !'
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de la suppression'
        });
      }
    } catch (error) {
      console.error('Erreur suppression avatar:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

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
              <span className="brand-tagline">Mon Profil</span>
            </div>
          </div>
    

          <div className="header-end">
            <div className="profile">
              <div className="profile-avatar">
                {user?.avatarUrl ? (
                  <img 
                    src={`http://localhost:5000${user.avatarUrl}`} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
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
            <button className="btn-back" onClick={() => navigate(getDashboardUrl())}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Retour au tableau de bord
    </button>
          <div className="profile-container">
            {/* Sidebar */}
            <div className="profile-sidebar">
              <div className="profile-card">
                {/* Section Avatar avec Upload */}
                <div className="profile-avatar-container">
                  <div className="profile-avatar-large">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="avatar-image" />
                    ) : (
                      <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
                    )}
                  </div>
                  
                  <div className="avatar-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                    />
                    
                    <button
                      className="btn-avatar"
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploadingAvatar}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeWidth="2"/>
                        <circle cx="12" cy="13" r="4" strokeWidth="2"/>
                      </svg>
                      Changer
                    </button>

                    {avatarFile && (
                      <button
                        className="btn-avatar btn-upload"
                        onClick={handleUploadAvatar}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? 'Upload...' : 'Sauvegarder'}
                      </button>
                    )}

                    {(avatarPreview && !avatarFile && user?.avatarUrl) && (
                      <button
                        className="btn-avatar btn-delete"
                        onClick={handleDeleteAvatar}
                        disabled={uploadingAvatar}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="3 6 5 6 21 6" strokeWidth="2"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2"/>
                        </svg>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="profile-user-name">{user?.firstName} {user?.lastName}</h2>
                <p className="profile-user-email">{user?.email}</p>
                <span className="profile-user-role">{user?.role}</span>
              </div>

              <nav className="profile-nav">
                <button
                  className={`profile-nav-item ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                  </svg>
                  Informations personnelles
                </button>

                <button
                  className={`profile-nav-item ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
                  </svg>
                  Sécurité
                </button>
              </nav>
            </div>

            {/* Contenu principal */}
            <div className="profile-main">
              {alert && (
                <Alert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              )}

              {/* Onglet Informations personnelles */}
              {activeTab === 'info' && (
                <div className="profile-section">
                  <h2 className="section-title">Informations personnelles</h2>
                  <p className="section-subtitle">Gérez vos informations de profil</p>

                  <form onSubmit={handleUpdateProfile} className="profile-form">
                    <div className="form-row">
                      <Input
                        label="Prénom"
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        error={errors.firstName}
                        required
                      />

                      <Input
                        label="Nom"
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        error={errors.lastName}
                        required
                      />
                    </div>

                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      error={errors.email}
                      required
                    />

                    <Input
                      label="Téléphone"
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="+216 XX XXX XXX"
                      error={errors.phone}
                    />

                    <div className="form-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                      >
                        Enregistrer les modifications
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Onglet Changement de mot de passe */}
              {activeTab === 'password' && (
                <div className="profile-section">
                  <h2 className="section-title">Changer le mot de passe</h2>
                  <p className="section-subtitle">Mettez à jour votre mot de passe régulièrement pour plus de sécurité</p>

                  <form onSubmit={handleChangePassword} className="profile-form">
                    <Input
                      label="Mot de passe actuel"
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      error={errors.currentPassword}
                      required
                    />

                    <Input
                      label="Nouveau mot de passe"
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      error={errors.newPassword}
                      required
                    />

                    <Input
                      label="Confirmer le nouveau mot de passe"
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      error={errors.confirmPassword}
                      required
                    />

                    <div className="form-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                      >
                        Changer le mot de passe
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;