/**
 * emailService.js
 * Service d'envoi d'emails pour les notifications RH Kilani Group
 * Utilise Nodemailer avec configuration SMTP configurable via .env
 */
const nodemailer = require('nodemailer');

// =========================================================
// Configuration du transporteur SMTP
// =========================================================
// Paramètres dans .env :
//   EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS
//   EMAIL_FROM  → ex: "Kilani RH <noreply@kilanigroupe.tn>"
//   EMAIL_ENABLED → 'true' pour activer, 'false' pour désactiver (dev)
// =========================================================

const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false'; // true par défaut

let transporter = null;

if (EMAIL_ENABLED && process.env.EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true pour 465, false pour les autres
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Pour les certs auto-signés en dev
    }
  });
  
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️  Email SMTP non disponible:', error.message);
    } else {
      console.log('✉️  Service email connecté sur', process.env.EMAIL_HOST || 'smtp.gmail.com');
    }
  });
} else {
  console.log('📧 Service email désactivé (mode dev). Configurez EMAIL_USER dans .env pour activer.');
}

const FROM = process.env.EMAIL_FROM || '"Kilani RH 🏢" <noreply@kilanigroupe.tn>';

/**
 * Fonction d'envoi générique - ne bloque pas si l'email échoue
 */
async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.log(`[EMAIL SIMULÉ] À: ${to} | Sujet: ${subject}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`✉️  Email envoyé à ${to} — ${subject}`);
    return true;
  } catch (err) {
    console.error(`❌ Erreur envoi email à ${to}:`, err.message);
    return false;
  }
}

// =========================================================
// Templates HTML des emails
// =========================================================

const baseStyle = `
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #f8f9fa;
  padding: 0;
  margin: 0;
`;

function wrapTemplate(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="${baseStyle}">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #1a2b4b 0%, #2d4278 100%); padding:32px 40px; text-align:center;">
        <h1 style="color:#d4af37; margin:0; font-size:22px; font-weight:700; letter-spacing:1px;">✨ KILANI GROUP</h1>
        <p style="color:rgba(255,255,255,0.7); margin:4px 0 0; font-size:13px;">Système de Gestion des Ressources Humaines</p>
      </div>
      <!-- Content -->
      <div style="padding:32px 40px;">
        ${content}
      </div>
      <!-- Footer -->
      <div style="background:#f1f3f5; padding:20px 40px; text-align:center; border-top:1px solid #e9ecef;">
        <p style="color:#868e96; font-size:12px; margin:0;">
          Cet email est généré automatiquement par le système RH Kilani Group.<br>
          Ne pas répondre directement à cet email.
        </p>
      </div>
    </div>
  </body>
  </html>`;
}

function statusBadge(statut) {
  const colors = {
    'Validé': '#28a745',
    'Refusé': '#dc3545',
    'En attente': '#ffc107',
    'Annulé': '#6c757d',
    'Généré': '#17a2b8',
  };
  const color = colors[statut] || '#6c757d';
  return `<span style="background:${color}; color:#fff; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600;">${statut}</span>`;
}

// =========================================================
// 1. NOTIFICATIONS CONGÉS
// =========================================================

/**
 * Email à l'employé : confirmation de sa demande de congé
 */
async function notifyNouvelleDemandeConge({ employeEmail, employeNom, motif, type_conge, jour_debut, jour_fin, nombre_jours, solde_actuel, superieurNom }) {
  const subject = '📋 Votre demande de congé a bien été enregistrée';
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Demande de congé enregistrée</h2>
    <p style="color:#495057;">Bonjour <strong>${employeNom}</strong>,</p>
    <p style="color:#495057;">Votre demande de congé a bien été reçue et est en attente de validation.</p>
    
    <div style="background:#f8f9fa; border-left:4px solid #d4af37; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <h3 style="margin:0 0 16px; color:#1a2b4b; font-size:15px;">📅 Détails de la demande</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Motif</td><td style="padding:6px 0; color:#212529; font-weight:600;">${motif}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Type</td><td style="padding:6px 0; color:#212529; font-weight:600;">${type_conge}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Date de début</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_debut}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Date de fin</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_fin}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Nombre de jours</td><td style="padding:6px 0; color:#212529; font-weight:600;">${nombre_jours} jour(s)</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Solde actuel</td><td style="padding:6px 0; color:#212529; font-weight:600;">${solde_actuel} jour(s)</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Statut</td><td style="padding:6px 0;">${statusBadge('En attente')}</td></tr>
      </table>
    </div>
    
    <p style="color:#495057;">Votre supérieur hiérarchique <strong>${superieurNom || 'N/A'}</strong> sera notifié pour traiter votre demande.</p>
    <p style="color:#495057;">Vous recevrez une notification dès que votre demande sera traitée.</p>
  `);
  return sendEmail({ to: employeEmail, subject, html });
}

/**
 * Email au supérieur : nouvelle demande à traiter
 */
async function notifySuperieurNouvelleDemandeConge({ superieurEmail, superieurNom, employeNom, motif, type_conge, jour_debut, jour_fin, nombre_jours, commentaire }) {
  const subject = `🔔 Nouvelle demande de congé de ${employeNom} — À valider`;
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Nouvelle demande de congé à valider</h2>
    <p style="color:#495057;">Bonjour <strong>${superieurNom}</strong>,</p>
    <p style="color:#495057;">Vous avez reçu une nouvelle demande de congé nécessitant votre approbation.</p>
    
    <div style="background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:16px; margin:16px 0; text-align:center;">
      <p style="margin:0; color:#856404; font-weight:600;">⏳ Action requise de votre part</p>
    </div>
    
    <div style="background:#f8f9fa; border-left:4px solid #d4af37; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <h3 style="margin:0 0 16px; color:#1a2b4b; font-size:15px;">👤 Demande de ${employeNom}</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Motif</td><td style="padding:6px 0; color:#212529; font-weight:600;">${motif}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Type</td><td style="padding:6px 0; color:#212529; font-weight:600;">${type_conge}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Du</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_debut}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Au</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_fin}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Nombre de jours</td><td style="padding:6px 0; color:#212529; font-weight:600;">${nombre_jours} jour(s)</td></tr>
        ${commentaire ? `<tr><td style="padding:6px 0; color:#868e96;">Commentaire</td><td style="padding:6px 0; color:#212529;">${commentaire}</td></tr>` : ''}
      </table>
    </div>
    
    <p style="color:#495057;">Connectez-vous à l'application RH pour valider ou refuser cette demande.</p>
  `);
  return sendEmail({ to: superieurEmail, subject, html });
}

/**
 * Email à l'employé : résultat de sa demande (validation ou refus)
 */
async function notifyResultatConge({ employeEmail, employeNom, statut, motif, jour_debut, jour_fin, nombre_jours, solde_apres, commentaire_superieur, valideurNom }) {
  const isValide = statut === 'Validé';
  const emoji = isValide ? '✅' : '❌';
  const subject = `${emoji} Votre demande de congé a été ${statut.toLowerCase()}`;
  
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Décision sur votre demande de congé</h2>
    <p style="color:#495057;">Bonjour <strong>${employeNom}</strong>,</p>
    <p style="color:#495057;">Votre demande de congé a été traitée par <strong>${valideurNom}</strong>.</p>
    
    <div style="text-align:center; margin:24px 0; padding:24px; background:${isValide ? '#d4edda' : '#f8d7da'}; border-radius:8px;">
      <p style="font-size:32px; margin:0 0 8px;">${emoji}</p>
      <p style="margin:0; font-size:18px; font-weight:700; color:${isValide ? '#155724' : '#721c24'};">
        Demande ${statut}
      </p>
    </div>
    
    <div style="background:#f8f9fa; border-left:4px solid ${isValide ? '#28a745' : '#dc3545'}; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Motif</td><td style="padding:6px 0; color:#212529; font-weight:600;">${motif}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Du</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_debut}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Au</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_fin}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Nombre de jours</td><td style="padding:6px 0; color:#212529; font-weight:600;">${nombre_jours} jour(s)</td></tr>
        ${isValide && solde_apres !== undefined ? `<tr><td style="padding:6px 0; color:#868e96;">Solde restant</td><td style="padding:6px 0; color:#28a745; font-weight:700;">${solde_apres} jour(s)</td></tr>` : ''}
        ${commentaire_superieur ? `<tr><td style="padding:6px 0; color:#868e96;">Commentaire</td><td style="padding:6px 0; color:#212529; font-style:italic;">"${commentaire_superieur}"</td></tr>` : ''}
      </table>
    </div>
    
    ${!isValide ? '<p style="color:#495057;">Pour toute question, contactez votre supérieur ou le département RH.</p>' : '<p style="color:#495057;">Bon congé ! 🌴</p>'}
  `);
  return sendEmail({ to: employeEmail, subject, html });
}

// =========================================================
// 2. NOTIFICATIONS MISSIONS
// =========================================================

/**
 * Email à l'employé : confirmation nouvelle demande de mission
 */
async function notifyNouvelleDemandesMission({ employeEmail, employeNom, objet, destination, jour_debut, jour_fin, superieurNom }) {
  const subject = '🚀 Votre demande de mission a bien été enregistrée';
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Demande de mission enregistrée</h2>
    <p style="color:#495057;">Bonjour <strong>${employeNom}</strong>,</p>
    <p style="color:#495057;">Votre demande de mission a bien été reçue et est en attente de validation.</p>
    
    <div style="background:#f8f9fa; border-left:4px solid #d4af37; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <h3 style="margin:0 0 16px; color:#1a2b4b; font-size:15px;">🗺️ Détails de la mission</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Objet</td><td style="padding:6px 0; color:#212529; font-weight:600;">${objet}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Destination</td><td style="padding:6px 0; color:#212529; font-weight:600;">${destination}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Départ</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_debut}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Retour</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_fin}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Statut</td><td style="padding:6px 0;">${statusBadge('En attente')}</td></tr>
      </table>
    </div>
    
    <p style="color:#495057;">Votre supérieur <strong>${superieurNom || 'N/A'}</strong> sera notifié pour validation.</p>
  `);
  return sendEmail({ to: employeEmail, subject, html });
}

/**
 * Email au supérieur : nouvelle mission à valider
 */
async function notifySuperieurNouvelleDemandesMission({ superieurEmail, superieurNom, employeNom, objet, destination, jour_debut, jour_fin }) {
  const subject = `🔔 Nouvelle demande de mission de ${employeNom} — À valider`;
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Nouvelle demande de mission à valider</h2>
    <p style="color:#495057;">Bonjour <strong>${superieurNom}</strong>,</p>
    
    <div style="background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:16px; margin:16px 0; text-align:center;">
      <p style="margin:0; color:#856404; font-weight:600;">⏳ Action requise de votre part</p>
    </div>
    
    <div style="background:#f8f9fa; border-left:4px solid #d4af37; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <h3 style="margin:0 0 16px; color:#1a2b4b; font-size:15px;">🚀 Mission de ${employeNom}</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Objet</td><td style="padding:6px 0; color:#212529; font-weight:600;">${objet}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Destination</td><td style="padding:6px 0; color:#212529; font-weight:600;">${destination}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Départ</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_debut}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Retour</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_fin}</td></tr>
      </table>
    </div>
    <p style="color:#495057;">Connectez-vous à l'application RH pour traiter cette demande.</p>
  `);
  return sendEmail({ to: superieurEmail, subject, html });
}

/**
 * Email à l'employé : résultat de la demande de mission
 */
async function notifyResultatMission({ employeEmail, employeNom, statut, objet, destination, jour_debut, jour_fin, commentaire }) {
  const isValide = statut === 'Validé';
  const emoji = isValide ? '✅' : '❌';
  const subject = `${emoji} Votre demande de mission a été ${statut.toLowerCase()}`;
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Décision sur votre demande de mission</h2>
    <p style="color:#495057;">Bonjour <strong>${employeNom}</strong>,</p>
    
    <div style="text-align:center; margin:24px 0; padding:24px; background:${isValide ? '#d4edda' : '#f8d7da'}; border-radius:8px;">
      <p style="font-size:32px; margin:0 0 8px;">${emoji}</p>
      <p style="margin:0; font-size:18px; font-weight:700; color:${isValide ? '#155724' : '#721c24'};">Mission ${statut}</p>
    </div>
    
    <div style="background:#f8f9fa; border-left:4px solid ${isValide ? '#28a745' : '#dc3545'}; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Objet</td><td style="padding:6px 0; color:#212529; font-weight:600;">${objet}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Destination</td><td style="padding:6px 0; color:#212529; font-weight:600;">${destination}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Départ</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_debut}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Retour</td><td style="padding:6px 0; color:#212529; font-weight:600;">${jour_fin}</td></tr>
        ${commentaire ? `<tr><td style="padding:6px 0; color:#868e96;">Commentaire</td><td style="padding:6px 0; color:#212529; font-style:italic;">"${commentaire}"</td></tr>` : ''}
      </table>
    </div>
    
    ${isValide ? '<p style="color:#495057;">Votre ordre de mission sera généré par les RH. Bonne mission ! 🌍</p>' : '<p style="color:#495057;">Pour toute question, contactez votre supérieur ou le département RH.</p>'}
  `);
  return sendEmail({ to: employeEmail, subject, html });
}

// =========================================================
// 3. NOTIFICATIONS ATTESTATIONS
// =========================================================

/**
 * Email à l'employé : attestation générée / prête
 */
async function notifyAttestationGeneree({ employeEmail, employeNom, typeAttestation, intitule, dateGeneration }) {
  const subject = `📄 Votre attestation est prête — ${typeAttestation}`;
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Votre attestation est disponible</h2>
    <p style="color:#495057;">Bonjour <strong>${employeNom}</strong>,</p>
    <p style="color:#495057;">Votre attestation a été générée et est maintenant disponible.</p>
    
    <div style="text-align:center; margin:24px 0; padding:32px; background:linear-gradient(135deg, #d4edda, #c3e6cb); border-radius:12px;">
      <p style="font-size:48px; margin:0 0 8px;">📄</p>
      <p style="margin:0; font-size:20px; font-weight:700; color:#155724;">${typeAttestation}</p>
      ${intitule ? `<p style="margin:8px 0 0; color:#1e7e34; font-size:14px;">${intitule}</p>` : ''}
    </div>
    
    <div style="background:#f8f9fa; border-left:4px solid #28a745; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Type</td><td style="padding:6px 0; color:#212529; font-weight:600;">${typeAttestation}</td></tr>
        ${intitule ? `<tr><td style="padding:6px 0; color:#868e96;">Intitulé</td><td style="padding:6px 0; color:#212529; font-weight:600;">${intitule}</td></tr>` : ''}
        <tr><td style="padding:6px 0; color:#868e96;">Date de génération</td><td style="padding:6px 0; color:#212529; font-weight:600;">${dateGeneration}</td></tr>
        <tr><td style="padding:6px 0; color:#868e96;">Statut</td><td style="padding:6px 0;">${statusBadge('Généré')}</td></tr>
      </table>
    </div>
    
    <p style="color:#495057;">Vous pouvez récupérer votre attestation auprès du département des Ressources Humaines.</p>
  `);
  return sendEmail({ to: employeEmail, subject, html });
}

/**
 * Email à l'employé : nouvelle demande d'attestation confirmée
 */
async function notifyNouvelleDemandeAttestation({ employeEmail, employeNom, typeAttestation, intitule }) {
  const subject = `📋 Votre demande d'attestation a été enregistrée`;
  const html = wrapTemplate(`
    <h2 style="color:#1a2b4b; margin-top:0;">Demande d'attestation enregistrée</h2>
    <p style="color:#495057;">Bonjour <strong>${employeNom}</strong>,</p>
    <p style="color:#495057;">Votre demande d'attestation a bien été prise en compte.</p>
    
    <div style="background:#f8f9fa; border-left:4px solid #d4af37; border-radius:0 8px 8px 0; padding:20px; margin:24px 0;">
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px 0; color:#868e96; width:40%;">Type d'attestation</td><td style="padding:6px 0; color:#212529; font-weight:600;">${typeAttestation}</td></tr>
        ${intitule ? `<tr><td style="padding:6px 0; color:#868e96;">Intitulé</td><td style="padding:6px 0; color:#212529; font-weight:600;">${intitule}</td></tr>` : ''}
        <tr><td style="padding:6px 0; color:#868e96;">Statut</td><td style="padding:6px 0;">${statusBadge('En attente')}</td></tr>
      </table>
    </div>
    
    <p style="color:#495057;">Le département RH traitera votre demande dans les meilleurs délais. Vous serez notifié(e) par email dès qu'elle sera prête.</p>
  `);
  return sendEmail({ to: employeEmail, subject, html });
}

// =========================================================
// EXPORTS
// =========================================================
module.exports = {
  // Congés
  notifyNouvelleDemandeConge,
  notifySuperieurNouvelleDemandeConge,
  notifyResultatConge,
  // Missions
  notifyNouvelleDemandesMission,
  notifySuperieurNouvelleDemandesMission,
  notifyResultatMission,
  // Attestations
  notifyNouvelleDemandeAttestation,
  notifyAttestationGeneree,
};
