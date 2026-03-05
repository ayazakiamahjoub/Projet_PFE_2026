/**
 * Formater une date
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString('fr-FR', options);
};

/**
 * Formater une date courte
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleDateString('fr-FR');
};

/**
 * Formater un nom complet
 */
export const formatFullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`;
};

/**
 * Obtenir les initiales
 */
export const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};