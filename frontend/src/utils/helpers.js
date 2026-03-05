/**
 * Obtenir le token du localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Sauvegarder le token
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Supprimer le token
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Obtenir l'utilisateur du localStorage
 */
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Sauvegarder l'utilisateur
 */
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Supprimer l'utilisateur
 */
export const removeUser = () => {
  localStorage.removeItem('user');
};

/**
 * Nettoyer toutes les données de session
 */
export const clearSession = () => {
  removeToken();
  removeUser();
};

/**
 * Vérifier si l'utilisateur est admin
 */
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

/**
 * Vérifier si l'utilisateur est manager
 */
export const isManager = (user) => {
  return user?.role === 'manager' || user?.role === 'admin';
};