const nodemailer = require('nodemailer');
const crypto = require('crypto');

/**
 * Configuration du transporteur email
 */
const createTransporter = async () => {
  // Pour le développement : Ethereal (emails de test)
  if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
  
  // Pour la production : Gmail (exemple)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Générer un token de vérification
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Envoyer un email de vérification
 */
const sendVerificationEmail = async (user, verificationToken) => {
  try {
    const transporter = await createTransporter();
    
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: '"Pioneer Tech" <noreply@pioneertech.com>',
      to: user.email,
      subject: 'Vérification de votre compte Pioneer Tech',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF8C42, #FF6B35); padding: 30px; text-align: center; color: white;">
            <h1>🚀 Bienvenue chez Pioneer Tech !</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
            
            <p>Merci de vous être inscrit sur Pioneer Tech ! Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Vérifier mon email
              </a>
            </div>
            
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #FF6B35;">${verificationUrl}</p>
            
            <p><strong>Ce lien expirera dans 24 heures.</strong></p>
            
            <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
            
            <p>Cordialement,<br>L'équipe Pioneer Tech</p>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
            <p>© 2026 Pioneer Tech. Tous droits réservés.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé:', info.messageId);
    
    // Pour Ethereal, afficher le lien de preview
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 Preview URL:', previewUrl);
      console.log('👆 Copiez ce lien dans votre navigateur pour voir l\'email');
    }
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer un email de bienvenue après vérification
 */
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: '"Pioneer Tech" <noreply@pioneertech.com>',
      to: user.email,
      subject: 'Bienvenue sur Pioneer Tech ! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF8C42, #FF6B35); padding: 30px; text-align: center; color: white;">
            <h1>🎉 Votre compte est activé !</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Bonjour <strong>${user.firstName}</strong>,</p>
            
            <p>Votre compte Pioneer Tech est maintenant actif ! Vous pouvez commencer à utiliser notre plateforme.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/login" style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Accéder à mon dashboard
              </a>
            </div>
            
            <p>Bon travail sur Pioneer Tech ! 🚀</p>
            
            <p>Cordialement,<br>L'équipe Pioneer Tech</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenue envoyé:', info.messageId);
    
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
  } catch (error) {
    console.error('❌ Erreur envoi email bienvenue:', error);
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail
};