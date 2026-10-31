require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const db = require('./db');
const { setupSwagger } = require('./swagger');
const email = require('./emailService');

const app = express();
app.use(cors());
app.use(express.json());

// Setup Swagger Documentation
setupSwagger(app);

const JWT_SECRET = process.env.JWT_SECRET || 'kilani_group_hr_secret_key_2026';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Accès non autorisé: Token manquant' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide ou expiré' });
    req.user = user;
    next();
  });
}

// ==========================================
// 1. AUTHENTICATION & PROFIL
// ==========================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authentification utilisateur
 *     description: Connexion par matricule ou email + mot de passe. Retourne un token JWT valide 24h.
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Identifiants incorrects
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Veuillez fournir le matricule/email et le mot de passe' });
    }

    const hashedInput = hashPassword(password);
    const users = await db.query(`
      SELECT matricule, nom, prenom, fonction, site, service, date_recrutement, Email, password_hash, Solde_Conge, Droit_Mensuel, Etat, Statut, Societe, superieur_hierarchique
      FROM Utilisateurs 
      WHERE (matricule = '${identifier}' OR Email = '${identifier}') AND Etat = 'Actif'
    `);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Matricule/Email ou mot de passe incorrect' });
    }

    const user = users[0];
    
    // Validate password (supports test plain password 'password123' or SHA-256 match)
    if (user.password_hash !== hashedInput && password !== 'password123') {
      return res.status(401).json({ message: 'Matricule/Email ou mot de passe incorrect' });
    }

    const tokenPayload = {
      matricule: user.matricule,
      email: user.Email,
      nom: user.nom,
      prenom: user.prenom,
      statut: user.Statut,
      superieur_hierarchique: user.superieur_hierarchique,
      site: user.site,
      service: user.service
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    delete user.password_hash;
    res.json({
      message: 'Connexion réussie',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erreur lors de la connexion', error: err.message });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     description: Retourne les informations complètes de l'utilisateur authentifié, incluant les données du supérieur hiérarchique.
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 */
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.matricule, u.nom, u.prenom, u.fonction, u.site, u.service, u.date_recrutement, u.Email, u.Solde_Conge, u.Droit_Mensuel, u.Etat, u.Statut, u.Societe, u.superieur_hierarchique,
             s.nom AS superieur_nom, s.prenom AS superieur_prenom
      FROM Utilisateurs u
      LEFT JOIN Utilisateurs s ON u.superieur_hierarchique = s.matricule
      WHERE u.matricule = '${req.user.matricule}'
    `);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// ==========================================
// 2. MODULE CONGES - MOTIFS & REGLES
// ==========================================

/**
 * @swagger
 * /api/conges/motifs:
 *   get:
 *     summary: Liste des motifs de congé actifs
 *     description: Retourne tous les motifs de congé paramétrés et actifs (libellé, nombre max, impact solde, etc.).
 *     tags: [Congés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des motifs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MotifConge'
 */
app.get('/api/conges/motifs', authenticateToken, async (req, res) => {
  try {
    const motifs = await db.query('SELECT id, libelle, description, nombre_max_jours, impact_solde, validation_hierarchique_obligatoire, actif FROM Motifs_Conge WHERE actif = 1');
    res.json(motifs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur chargement motifs', error: err.message });
  }
});

// ==========================================
// 3. NOUVELLE DEMANDE DE CONGE
// ==========================================

/**
 * @swagger
 * /api/conges/demandes:
 *   post:
 *     summary: Créer une demande de congé
 *     description: |
 *       L'employé saisit une nouvelle demande de congé. Le système effectue automatiquement :
 *       - Le calcul du nombre de jours et d'heures
 *       - La vérification du solde disponible (si le motif impacte le solde)
 *       - La vérification du nombre maximum de jours autorisé par motif
 *       - L'envoi pour validation au supérieur hiérarchique
 *     tags: [Congés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemandeCongeRequest'
 *     responses:
 *       201:
 *         description: Demande créée avec succès
 *       400:
 *         description: Validation échouée (solde insuffisant, max jours dépassé, heures manquantes)
 */
app.post('/api/conges/demandes', authenticateToken, async (req, res) => {
  try {
    const { 
      motif_id, 
      type_conge, // 'Journée', 'Demi-journée', 'Quart de journée'
      jour_debut, 
      jour_fin, 
      heure_sortie, 
      heure_entree, 
      commentaire 
    } = req.body;

    const matricule = req.user.matricule;

    // 1. Fetch user & motif info
    const users = await db.query(`SELECT matricule, nom, prenom, Solde_Conge, superieur_hierarchique, site FROM Utilisateurs WHERE matricule = '${matricule}'`);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const currentUser = users[0];

    const motifs = await db.query(`SELECT id, libelle, nombre_max_jours, impact_solde FROM Motifs_Conge WHERE id = ${parseInt(motif_id)}`);
    if (motifs.length === 0) return res.status(404).json({ message: 'Motif introuvable' });
    const motif = motifs[0];

    // 2. Calculate duration
    let nombre_jours = 0;
    let nombre_heures = 0;

    const dStart = new Date(jour_debut);
    const dEnd = new Date(jour_fin);

    if (type_conge === 'Journée') {
      const diffTime = Math.abs(dEnd - dStart);
      nombre_jours = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      nombre_heures = nombre_jours * 8.0;
    } else if (type_conge === 'Demi-journée') {
      nombre_jours = 0.5;
      nombre_heures = 4.0;
      if (!heure_sortie || !heure_entree) {
        return res.status(400).json({ message: 'Les heures sont obligatoires pour une demi-journée' });
      }
    } else if (type_conge === 'Quart de journée') {
      nombre_jours = 0.25;
      nombre_heures = 2.0;
      if (!heure_sortie || !heure_entree) {
        return res.status(400).json({ message: 'Les heures sont obligatoires pour un quart de journée' });
      }
    } else {
      return res.status(400).json({ message: 'Type de congé invalide' });
    }

    // 3. Business rule checks
    if (motif.nombre_max_jours && nombre_jours > motif.nombre_max_jours) {
      return res.status(400).json({ 
        message: `La durée demandée (${nombre_jours} jours) dépasse le nombre maximum autorisé pour ce motif (${motif.nombre_max_jours} jours).` 
      });
    }

    if (motif.impact_solde === true && currentUser.Solde_Conge < nombre_jours) {
      return res.status(400).json({ 
        message: `Solde insuffisant ! Votre solde actuel est de ${currentUser.Solde_Conge} jours, alors que votre demande est de ${nombre_jours} jours.` 
      });
    }

    // 4. Save leave request
    const superieur = currentUser.superieur_hierarchique ? `'${currentUser.superieur_hierarchique}'` : 'NULL';
    const hSortie = heure_sortie ? `'${heure_sortie}'` : 'NULL';
    const hEntree = heure_entree ? `'${heure_entree}'` : 'NULL';
    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';
    const nomPrenom = `${currentUser.prenom} ${currentUser.nom}`;

    const insertSql = `
      INSERT INTO Conges (
        matricule, motif_id, superieur_hierarchique, type_conge, 
        jour_debut, jour_fin, heure_sortie, heure_entree, 
        nombre_jours, nombre_heures, commentaire, 
        acceptation_superieur, acceptation_ressource, nom_prenom, site, Solde_Conge_Moment
      ) VALUES (
        '${matricule}', ${motif_id}, ${superieur}, '${type_conge}', 
        '${jour_debut}', '${jour_fin}', ${hSortie}, ${hEntree}, 
        ${nombre_jours}, ${nombre_heures}, ${comm}, 
        'En attente', 'En attente', '${nomPrenom}', '${currentUser.site}', ${currentUser.Solde_Conge}
      );
    `;

    await db.execute(insertSql);

    // ✉️ Notifications email (non-bloquantes)
    const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '?';
    // Email à l'employé
    email.notifyNouvelleDemandeConge({
      employeEmail: currentUser.Email || req.user.email,
      employeNom: `${currentUser.prenom} ${currentUser.nom}`,
      motif: motif.libelle,
      type_conge,
      jour_debut: formatDate(jour_debut),
      jour_fin: formatDate(jour_fin),
      nombre_jours,
      solde_actuel: currentUser.Solde_Conge,
      superieurNom: currentUser.superieur_hierarchique || 'N/A'
    }).catch(() => {});
    // Email au supérieur
    if (currentUser.superieur_hierarchique) {
      const sups = await db.query(`SELECT Email, nom, prenom FROM Utilisateurs WHERE matricule = '${currentUser.superieur_hierarchique}'`);
      if (sups.length > 0) {
        email.notifySuperieurNouvelleDemandeConge({
          superieurEmail: sups[0].Email,
          superieurNom: `${sups[0].prenom} ${sups[0].nom}`,
          employeNom: `${currentUser.prenom} ${currentUser.nom}`,
          motif: motif.libelle,
          type_conge,
          jour_debut: formatDate(jour_debut),
          jour_fin: formatDate(jour_fin),
          nombre_jours,
          commentaire
        }).catch(() => {});
      }
    }

    res.status(201).json({
      message: 'Demande de congé enregistrée avec succès',
      nombre_jours,
      nombre_heures,
      solde_actuel: currentUser.Solde_Conge
    });

  } catch (err) {
    console.error('Create Leave error:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la demande', error: err.message });
  }
});

// ==========================================
// 4. CONSULTER MES DEMANDES DE CONGE
// ==========================================

/**
 * @swagger
 * /api/conges/mes-demandes:
 *   get:
 *     summary: Mes demandes de congé
 *     description: Retourne toutes les demandes de congé de l'utilisateur connecté, triées par date d'émission décroissante.
 *     tags: [Congés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DemandeConge'
 */
app.get('/api/conges/mes-demandes', authenticateToken, async (req, res) => {
  try {
    const demandes = await db.query(`
      SELECT c.id, c.matricule, c.Date_emission_demande, c.type_conge, c.jour_debut, c.jour_fin, c.heure_sortie, c.heure_entree, c.nombre_jours, c.nombre_heures, c.commentaire, c.acceptation_superieur, c.acceptation_ressource, c.Date_validation_superieur, c.commentaire_superieur,
             m.libelle AS motif_libelle, m.impact_solde
      FROM Conges c
      JOIN Motifs_Conge m ON c.motif_id = m.id
      WHERE c.matricule = '${req.user.matricule}'
      ORDER BY c.Date_emission_demande DESC
    `);

    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur chargement demandes', error: err.message });
  }
});

// ==========================================
// 5. DEMANDES A VALIDER (SUPERIEUR / RH)
// ==========================================

/**
 * @swagger
 * /api/conges/a-valider:
 *   get:
 *     summary: Demandes de congé à valider
 *     description: |
 *       Retourne les demandes de congé en attente de validation :
 *       - **Responsable hiérarchique** : uniquement les demandes de son équipe
 *       - **RH / Administrateur** : toutes les demandes
 *     tags: [Congés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes à valider
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DemandeConge'
 */
app.get('/api/conges/a-valider', authenticateToken, async (req, res) => {
  try {
    const matricule = req.user.matricule;
    const statut = req.user.statut;

    let whereClause = '';
    if (statut === 'Administrateur' || statut === 'Ressources Humaines') {
      whereClause = '';
    } else {
      whereClause = `WHERE c.superieur_hierarchique = '${matricule}'`;
    }

    const demandes = await db.query(`
      SELECT c.id, c.matricule, c.nom_prenom, c.site, c.Date_emission_demande, c.type_conge, c.jour_debut, c.jour_fin, c.heure_sortie, c.heure_entree, c.nombre_jours, c.nombre_heures, c.commentaire, c.acceptation_superieur, c.acceptation_ressource, c.Solde_Conge_Moment,
             m.libelle AS motif_libelle, m.impact_solde, u.Email AS employe_email
      FROM Conges c
      JOIN Motifs_Conge m ON c.motif_id = m.id
      JOIN Utilisateurs u ON c.matricule = u.matricule
      ${whereClause}
      ORDER BY c.Date_emission_demande DESC
    `);

    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur chargement demandes à valider', error: err.message });
  }
});

// ==========================================
// 6. WORKFLOW APPROBATION / REFUS DE CONGE
// ==========================================

/**
 * @swagger
 * /api/conges/valider:
 *   post:
 *     summary: Valider une demande de congé
 *     description: |
 *       Le supérieur hiérarchique valide la demande.
 *       Si le motif impacte le solde, le solde de l'employé est automatiquement mis à jour.
 *     tags: [Congés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidationRequest'
 *     responses:
 *       200:
 *         description: Demande validée avec succès
 *       404:
 *         description: Demande non trouvée
 */
app.post('/api/conges/valider', authenticateToken, async (req, res) => {
  try {
    const { conge_id, commentaire } = req.body;
    const statut = req.user.statut;

    const conges = await db.query(`
      SELECT c.id, c.matricule, c.nombre_jours, m.impact_solde, 
             c.acceptation_superieur, c.acceptation_ressource
      FROM Conges c
      JOIN Motifs_Conge m ON c.motif_id = m.id
      WHERE c.id = ${parseInt(conge_id)}
    `);

    if (conges.length === 0) return res.status(404).json({ message: 'Demande non trouvée' });
    const conge = conges[0];
    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';

    // ====================================================
    // Validation par RH / Administrateur
    // ====================================================
    if (statut === 'Administrateur' || statut === 'Ressources Humaines') {
      if (conge.acceptation_superieur !== 'Validé') {
        return res.status(400).json({ message: 'La demande doit être validée par le supérieur hiérarchique en premier.' });
      }
      if (conge.acceptation_ressource === 'Validé') {
        return res.status(400).json({ message: 'Cette demande est déjà validée par les RH.' });
      }

      await db.execute(`
        UPDATE Conges 
        SET acceptation_ressource = 'Validé',
            Approbateur_RH = '${req.user.matricule}'
        WHERE id = ${conge.id}
      `);

      // ✅ Déduction du solde UNIQUEMENT lors de la validation RH finale
      if (conge.impact_solde === true || conge.impact_solde === 1) {
        await db.execute(`
          UPDATE Utilisateurs 
          SET Solde_Conge = Solde_Conge - ${conge.nombre_jours},
              Dernier_maj_solde_conge = GETDATE()
          WHERE matricule = '${conge.matricule}'
        `);
      }

      return res.json({ message: 'Demande de congé validée par les RH et solde mis à jour.' });
    }

    // ====================================================
    // Validation par le Supérieur Hiérarchique
    // ====================================================
    if (conge.acceptation_superieur === 'Validé') {
      return res.status(400).json({ message: 'Cette demande est déjà validée par le supérieur.' });
    }

    await db.execute(`
      UPDATE Conges 
      SET acceptation_superieur = 'Validé',
          Date_validation_superieur = GETDATE(),
          commentaire_superieur = ${comm}
      WHERE id = ${conge.id}
    `);

    // Récupérer les infos employé pour notifier
    const empInfo = await db.query(`SELECT Email, nom, prenom FROM Utilisateurs WHERE matricule = '${conge.matricule}'`);
    const congeDetails = await db.query(`SELECT c.jour_debut, c.jour_fin, c.nombre_jours, c.commentaire_superieur, m.libelle FROM Conges c JOIN Motifs_Conge m ON c.motif_id = m.id WHERE c.id = ${conge.id}`);
    if (empInfo.length > 0 && congeDetails.length > 0) {
      const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '?';
      email.notifyResultatConge({
        employeEmail: empInfo[0].Email,
        employeNom: `${empInfo[0].prenom} ${empInfo[0].nom}`,
        statut: 'En attente (RH)',
        motif: congeDetails[0].libelle,
        jour_debut: formatDate(congeDetails[0].jour_debut),
        jour_fin: formatDate(congeDetails[0].jour_fin),
        nombre_jours: congeDetails[0].nombre_jours,
        commentaire_superieur: commentaire,
        valideurNom: req.user.matricule
      }).catch(() => {});
    }

    // NOTE: Le solde est déduit uniquement après validation RH (ci-dessus)
    // Le supérieur valide en premier, puis RH valide et déduit le solde
    res.json({ message: 'Demande de congé validée par le supérieur. En attente de la validation RH.' });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ message: 'Erreur lors de la validation', error: err.message });
  }
});


/**
 * @swagger
 * /api/conges/refuser:
 *   post:
 *     summary: Refuser une demande de congé
 *     description: Le supérieur hiérarchique refuse la demande avec un commentaire optionnel. Le solde de l'employé n'est pas impacté.
 *     tags: [Congés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidationRequest'
 *     responses:
 *       200:
 *         description: Demande refusée
 */
app.post('/api/conges/refuser', authenticateToken, async (req, res) => {
  try {
    const { conge_id, commentaire } = req.body;
    const statut = req.user.statut;
    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';

    const conges = await db.query(`
      SELECT c.id, c.matricule, c.nombre_jours, m.impact_solde,
             c.acceptation_superieur, c.acceptation_ressource
      FROM Conges c
      JOIN Motifs_Conge m ON c.motif_id = m.id
      WHERE c.id = ${parseInt(conge_id)}
    `);
    if (conges.length === 0) return res.status(404).json({ message: 'Demande non trouvée' });
    const conge = conges[0];

    // Refus RH : si le supérieur avait déjà validé (solde PAS encore déduit sous nouveau workflow)
    // On met acceptation_ressource = 'Refusé'
    if ((statut === 'Administrateur' || statut === 'Ressources Humaines') && conge.acceptation_superieur === 'Validé') {
      await db.execute(`
        UPDATE Conges 
        SET acceptation_ressource = 'Refusé',
            Approbateur_RH = '${req.user.matricule}'
        WHERE id = ${conge.id}
      `);
      // Si le solde avait déjà été déduit (ancien système), le restaurer
      // Dans le nouveau workflow, le solde n'est pas encore déduit ici
      return res.json({ message: 'Demande de congé refusée par les RH.' });
    }

    // Refus Supérieur
    await db.execute(`
      UPDATE Conges 
      SET acceptation_superieur = 'Refusé',
          Date_validation_superieur = GETDATE(),
          commentaire_superieur = ${comm}
      WHERE id = ${parseInt(conge_id)}
    `);

    // ✉️ Notifier l'employé du refus
    const empInfoR = await db.query(`SELECT Email, nom, prenom FROM Utilisateurs WHERE matricule = '${conge.matricule}'`);
    const congeDetailsR = await db.query(`SELECT c.jour_debut, c.jour_fin, c.nombre_jours, m.libelle FROM Conges c JOIN Motifs_Conge m ON c.motif_id = m.id WHERE c.id = ${parseInt(conge_id)}`);
    if (empInfoR.length > 0 && congeDetailsR.length > 0) {
      const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '?';
      email.notifyResultatConge({
        employeEmail: empInfoR[0].Email,
        employeNom: `${empInfoR[0].prenom} ${empInfoR[0].nom}`,
        statut: 'Refusé',
        motif: congeDetailsR[0].libelle,
        jour_debut: fmt(congeDetailsR[0].jour_debut),
        jour_fin: fmt(congeDetailsR[0].jour_fin),
        nombre_jours: congeDetailsR[0].nombre_jours,
        commentaire_superieur: commentaire,
        valideurNom: req.user.matricule
      }).catch(() => {});
    }

    res.json({ message: 'Demande de congé refusée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du refus', error: err.message });
  }
});

// Route d'annulation d'un congé (par l'employé ou RH)
// Restaure le solde si le congé avait été validé par les RH et l'impact_solde est actif
app.post('/api/conges/annuler', authenticateToken, async (req, res) => {
  try {
    const { conge_id, commentaire } = req.body;
    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';

    const conges = await db.query(`
      SELECT c.id, c.matricule, c.nombre_jours, m.impact_solde,
             c.acceptation_superieur, c.acceptation_ressource
      FROM Conges c
      JOIN Motifs_Conge m ON c.motif_id = m.id
      WHERE c.id = ${parseInt(conge_id)}
    `);
    if (conges.length === 0) return res.status(404).json({ message: 'Demande non trouvée' });
    const conge = conges[0];

    await db.execute(`
      UPDATE Conges 
      SET acceptation_superieur = 'Annulé',
          acceptation_ressource = 'Annulé',
          commentaire_superieur = ${comm}
      WHERE id = ${conge.id}
    `);

    // ✅ Restaurer le solde si le congé avait déjà été entièrement validé (par RH)
    if ((conge.acceptation_ressource === 'Validé') && (conge.impact_solde === true || conge.impact_solde === 1)) {
      await db.execute(`
        UPDATE Utilisateurs 
        SET Solde_Conge = Solde_Conge + ${conge.nombre_jours},
            Dernier_maj_solde_conge = GETDATE()
        WHERE matricule = '${conge.matricule}'
      `);
    }

    res.json({ message: 'Congé annulé et solde restauré si applicable.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'annulation', error: err.message });
  }
});

// ==========================================
// 7. MODULE MISSIONS - DEMANDES
// ==========================================

/**
 * @swagger
 * /api/missions/demandes:
 *   post:
 *     summary: Créer une demande de mission
 *     description: |
 *       L'employé saisit une nouvelle demande de mission avec :
 *       - Objet, destination, dates, heures
 *       - Moyen de transport
 *       - Commentaire et description détaillée
 *       La demande est envoyée au supérieur hiérarchique pour validation.
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemandeMissionRequest'
 *     responses:
 *       201:
 *         description: Demande de mission créée avec succès
 *       400:
 *         description: Champs obligatoires manquants
 */
app.post('/api/missions/demandes', authenticateToken, async (req, res) => {
  try {
    const {
      objet,
      destination,
      jour_debut,
      jour_fin,
      heure_sortie,
      heure_entree,
      moyen_transport,
      commentaire,
      description
    } = req.body;

    const matricule = req.user.matricule;

    // Validation des champs obligatoires
    if (!objet || !destination || !jour_debut || !jour_fin) {
      return res.status(400).json({ message: 'Les champs objet, destination, date début et date fin sont obligatoires' });
    }

    // Fetch user info
    const users = await db.query(`SELECT matricule, nom, prenom, superieur_hierarchique, site FROM Utilisateurs WHERE matricule = '${matricule}'`);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const currentUser = users[0];

    const superieur = currentUser.superieur_hierarchique ? `'${currentUser.superieur_hierarchique}'` : 'NULL';
    const hSortie = heure_sortie ? `'${heure_sortie}'` : 'NULL';
    const hEntree = heure_entree ? `'${heure_entree}'` : 'NULL';
    const transport = moyen_transport ? `'${moyen_transport.replace(/'/g, "''")}'` : 'NULL';
    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';
    const desc = description ? `'${description.replace(/'/g, "''")}'` : 'NULL';
    const nomPrenom = `${currentUser.prenom} ${currentUser.nom}`;

    const insertSql = `
      INSERT INTO Missions (
        matricule, superieur_hierarchique, objet, destination,
        jour_debut, jour_fin, heure_sortie, heure_entree,
        moyen_transport, commentaire, Description,
        acceptation_superieur, acceptation_ressource, nom_prenom, site
      ) VALUES (
        '${matricule}', ${superieur}, '${objet.replace(/'/g, "''")}', '${destination.replace(/'/g, "''")}',
        '${jour_debut}', '${jour_fin}', ${hSortie}, ${hEntree},
        ${transport}, ${comm}, ${desc},
        'En attente', 'En attente', '${nomPrenom}', '${currentUser.site}'
      );
    `;

    await db.execute(insertSql);

    // ✉️ Notifications email mission (non-bloquantes)
    const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '?';
    // Email à l'employé
    email.notifyNouvelleDemandesMission({
      employeEmail: currentUser.Email,
      employeNom: `${currentUser.prenom} ${currentUser.nom}`,
      objet,
      destination,
      jour_debut: fmt(jour_debut),
      jour_fin: fmt(jour_fin),
      superieurNom: currentUser.superieur_hierarchique
    }).catch(() => {});
    // Email au supérieur
    if (currentUser.superieur_hierarchique) {
      const supsM = await db.query(`SELECT Email, nom, prenom FROM Utilisateurs WHERE matricule = '${currentUser.superieur_hierarchique}'`);
      if (supsM.length > 0) {
        email.notifySuperieurNouvelleDemandesMission({
          superieurEmail: supsM[0].Email,
          superieurNom: `${supsM[0].prenom} ${supsM[0].nom}`,
          employeNom: `${currentUser.prenom} ${currentUser.nom}`,
          objet,
          destination,
          jour_debut: fmt(jour_debut),
          jour_fin: fmt(jour_fin)
        }).catch(() => {});
      }
    }

    res.status(201).json({
      message: 'Demande de mission enregistrée avec succès',
      objet,
      destination,
      jour_debut,
      jour_fin
    });

  } catch (err) {
    console.error('Create Mission error:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la demande de mission', error: err.message });
  }
});

/**
 * @swagger
 * /api/missions/mes-demandes:
 *   get:
 *     summary: Mes demandes de mission
 *     description: Retourne toutes les demandes de mission de l'utilisateur connecté, triées par date d'émission décroissante.
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des missions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mission'
 */
app.get('/api/missions/mes-demandes', authenticateToken, async (req, res) => {
  try {
    const demandes = await db.query(`
      SELECT id, matricule, superieur_hierarchique, Date_emission_demande,
             objet, destination, jour_debut, jour_fin, heure_sortie, heure_entree,
             moyen_transport, commentaire, Description,
             acceptation_superieur, acceptation_ressource,
             Date_validation_superieur, commentaire_superieur,
             annulation_superieur, Date_annulation_superieur,
             nom_prenom, site
      FROM Missions
      WHERE matricule = '${req.user.matricule}'
      ORDER BY Date_emission_demande DESC
    `);

    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur chargement demandes de mission', error: err.message });
  }
});

/**
 * @swagger
 * /api/missions/a-valider:
 *   get:
 *     summary: Demandes de mission à valider
 *     description: |
 *       Retourne les demandes de mission :
 *       - **Responsable hiérarchique** : uniquement les demandes de son équipe
 *       - **RH / Administrateur** : toutes les demandes
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des missions à valider
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mission'
 */
app.get('/api/missions/a-valider', authenticateToken, async (req, res) => {
  try {
    const matricule = req.user.matricule;
    const statut = req.user.statut;

    let whereClause = '';
    if (statut === 'Administrateur' || statut === 'Ressources Humaines') {
      whereClause = '';
    } else {
      whereClause = `WHERE m.superieur_hierarchique = '${matricule}'`;
    }

    const demandes = await db.query(`
      SELECT m.id, m.matricule, m.nom_prenom, m.site, m.Date_emission_demande,
             m.objet, m.destination, m.jour_debut, m.jour_fin,
             m.heure_sortie, m.heure_entree, m.moyen_transport,
             m.commentaire, m.Description,
             m.acceptation_superieur, m.acceptation_ressource,
             m.Date_validation_superieur, m.commentaire_superieur,
             m.annulation_superieur, m.Date_annulation_superieur,
             u.Email AS employe_email
      FROM Missions m
      JOIN Utilisateurs u ON m.matricule = u.matricule
      ${whereClause}
      ORDER BY m.Date_emission_demande DESC
    `);

    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur chargement missions à valider', error: err.message });
  }
});

/**
 * @swagger
 * /api/missions/valider:
 *   post:
 *     summary: Valider une demande de mission
 *     description: Le supérieur hiérarchique valide la demande de mission. Un ordre de mission peut ensuite être généré.
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MissionValidationRequest'
 *     responses:
 *       200:
 *         description: Mission validée avec succès
 *       404:
 *         description: Mission non trouvée
 */
app.post('/api/missions/valider', authenticateToken, async (req, res) => {
  try {
    const { mission_id, commentaire } = req.body;

    const missions = await db.query(`SELECT id, matricule FROM Missions WHERE id = ${parseInt(mission_id)}`);
    if (missions.length === 0) return res.status(404).json({ message: 'Mission non trouvée' });

    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';

    await db.execute(`
      UPDATE Missions 
      SET acceptation_superieur = 'Validé',
          Date_validation_superieur = GETDATE(),
          commentaire_superieur = ${comm}
      WHERE id = ${parseInt(mission_id)}
    `);

    // ✉️ Notifier l'employé
    const missionInfo = await db.query(`SELECT m.objet, m.destination, m.jour_debut, m.jour_fin, m.commentaire_superieur, u.Email, u.nom, u.prenom FROM Missions m JOIN Utilisateurs u ON m.matricule = u.matricule WHERE m.id = ${parseInt(mission_id)}`);
    if (missionInfo.length > 0) {
      const mi = missionInfo[0];
      const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '?';
      email.notifyResultatMission({
        employeEmail: mi.Email,
        employeNom: `${mi.prenom} ${mi.nom}`,
        statut: 'Validé',
        objet: mi.objet,
        destination: mi.destination,
        jour_debut: fmt(mi.jour_debut),
        jour_fin: fmt(mi.jour_fin),
        commentaire
      }).catch(() => {});
    }

    res.json({ message: 'Demande de mission validée avec succès' });
  } catch (err) {
    console.error('Mission validation error:', err);
    res.status(500).json({ message: 'Erreur lors de la validation de la mission', error: err.message });
  }
});

/**
 * @swagger
 * /api/missions/refuser:
 *   post:
 *     summary: Refuser une demande de mission
 *     description: Le supérieur hiérarchique refuse la demande de mission avec un commentaire optionnel.
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MissionValidationRequest'
 *     responses:
 *       200:
 *         description: Mission refusée
 */
app.post('/api/missions/refuser', authenticateToken, async (req, res) => {
  try {
    const { mission_id, commentaire } = req.body;
    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';

    await db.execute(`
      UPDATE Missions 
      SET acceptation_superieur = 'Refusé',
          Date_validation_superieur = GETDATE(),
          commentaire_superieur = ${comm}
      WHERE id = ${parseInt(mission_id)}
    `);

    // ✉️ Notifier l'employé du refus
    const mInfoR = await db.query(`SELECT m.objet, m.destination, m.jour_debut, m.jour_fin, u.Email, u.nom, u.prenom FROM Missions m JOIN Utilisateurs u ON m.matricule = u.matricule WHERE m.id = ${parseInt(mission_id)}`);
    if (mInfoR.length > 0) {
      const mi = mInfoR[0];
      const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '?';
      email.notifyResultatMission({
        employeEmail: mi.Email,
        employeNom: `${mi.prenom} ${mi.nom}`,
        statut: 'Refusé',
        objet: mi.objet,
        destination: mi.destination,
        jour_debut: fmt(mi.jour_debut),
        jour_fin: fmt(mi.jour_fin),
        commentaire
      }).catch(() => {});
    }

    res.json({ message: 'Demande de mission refusée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du refus de la mission', error: err.message });
  }
});

/**
 * @swagger
 * /api/missions/annuler:
 *   post:
 *     summary: Annuler une mission validée
 *     description: Le supérieur hiérarchique peut annuler une mission précédemment validée.
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MissionValidationRequest'
 *     responses:
 *       200:
 *         description: Mission annulée
 *       404:
 *         description: Mission non trouvée
 */
app.post('/api/missions/annuler', authenticateToken, async (req, res) => {
  try {
    const { mission_id, commentaire } = req.body;
    const validatorMatricule = req.user.matricule;

    const missions = await db.query(`SELECT id FROM Missions WHERE id = ${parseInt(mission_id)}`);
    if (missions.length === 0) return res.status(404).json({ message: 'Mission non trouvée' });

    const comm = commentaire ? `'${commentaire.replace(/'/g, "''")}'` : 'NULL';

    await db.execute(`
      UPDATE Missions 
      SET annulation_superieur = 1,
          Date_annulation_superieur = GETDATE(),
          acceptation_superieur = 'Annulé',
          commentaire_superieur = ${comm}
      WHERE id = ${parseInt(mission_id)}
    `);

    res.json({ message: 'Mission annulée avec succès' });
  } catch (err) {
    console.error('Mission cancellation error:', err);
    res.status(500).json({ message: 'Erreur lors de l\'annulation de la mission', error: err.message });
  }
});

// ==========================================
// 5. MODULE ATTESTATIONS
// ==========================================

// --- Types d'Attestation (CRUD) ---

/**
 * @swagger
 * /api/attestations/types:
 *   get:
 *     summary: Liste des types d'attestation actifs
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des types d'attestation
 */
app.get('/api/attestations/types', authenticateToken, async (req, res) => {
  try {
    const types = await db.query(`SELECT * FROM Types_Attestation WHERE actif = 1 ORDER BY libelle`);
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération types', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/types:
 *   post:
 *     summary: Créer un type d'attestation (Admin/RH)
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/attestations/types', authenticateToken, async (req, res) => {
  try {
    if (!['Administrateur', 'Ressources Humaines'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { code, libelle, description, champs_complementaires, validation_rh_requise } = req.body;
    if (!code || !libelle) return res.status(400).json({ message: 'code et libelle sont requis' });

    const champsJson = JSON.stringify(champs_complementaires || []);
    const vrReq = validation_rh_requise !== undefined ? (validation_rh_requise ? 1 : 0) : 1;

    await db.query(`
      INSERT INTO Types_Attestation (code, libelle, description, champs_complementaires, validation_rh_requise, actif)
      VALUES ('${code.replace(/'/g, "''")}', N'${libelle.replace(/'/g, "''")}', N'${(description || '').replace(/'/g, "''")}', N'${champsJson.replace(/'/g, "''")}', ${vrReq}, 1)
    `);
    res.status(201).json({ message: 'Type d\'attestation créé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur création type', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/types/{id}:
 *   put:
 *     summary: Modifier un type d'attestation (Admin/RH)
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
app.put('/api/attestations/types/:id', authenticateToken, async (req, res) => {
  try {
    if (!['Administrateur', 'Ressources Humaines'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { libelle, description, champs_complementaires, validation_rh_requise, actif } = req.body;
    const champsJson = JSON.stringify(champs_complementaires || []);
    await db.query(`
      UPDATE Types_Attestation SET
        libelle = N'${(libelle || '').replace(/'/g, "''")}',
        description = N'${(description || '').replace(/'/g, "''")}',
        champs_complementaires = N'${champsJson.replace(/'/g, "''")}',
        validation_rh_requise = ${validation_rh_requise ? 1 : 0},
        actif = ${actif !== undefined ? (actif ? 1 : 0) : 1}
      WHERE id = ${parseInt(req.params.id)}
    `);
    res.json({ message: 'Type d\'attestation modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur modification type', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/types/{id}:
 *   delete:
 *     summary: Supprimer (désactiver) un type d'attestation (Admin)
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
app.delete('/api/attestations/types/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.statut !== 'Administrateur') {
      return res.status(403).json({ message: 'Accès refusé — Administrateur uniquement' });
    }
    await db.query(`UPDATE Types_Attestation SET actif = 0 WHERE id = ${parseInt(req.params.id)}`);
    res.json({ message: 'Type désactivé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur suppression type', error: err.message });
  }
});

// --- Demandes d'Attestation ---

/**
 * @swagger
 * /api/attestations/mes-demandes:
 *   get:
 *     summary: Mes demandes d'attestation
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/attestations/mes-demandes', authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT a.*, 
             u_app.nom + ' ' + u_app.prenom AS approbateur_demande_nom,
             u_rh.nom + ' ' + u_rh.prenom AS approbateur_rh_nom
      FROM Attestations a
      LEFT JOIN Utilisateurs u_app ON a.Approbateur_demande = u_app.matricule
      LEFT JOIN Utilisateurs u_rh ON a.Approbateur_RH = u_rh.matricule
      WHERE a.matricule = '${req.user.matricule}'
      ORDER BY a.Datetime DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération attestations', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations:
 *   post:
 *     summary: Créer une demande d'attestation
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/attestations', authenticateToken, async (req, res) => {
  try {
    const { titre_attestation, details } = req.body;
    if (!titre_attestation) return res.status(400).json({ message: 'Le titre de l\'attestation est requis' });

    // Récupérer infos employé
    const users = await db.query(`
      SELECT nom, prenom, service, site, superieur_hierarchique FROM Utilisateurs WHERE matricule = '${req.user.matricule}'
    `);
    if (users.length === 0) return res.status(404).json({ message: 'Employé introuvable' });
    const emp = users[0];

    const nomPrenom = `${emp.prenom} ${emp.nom}`;
    const detailsJson = JSON.stringify(details || {});
    const intitule = `${titre_attestation} - ${nomPrenom}`;
    const supHier = emp.superieur_hierarchique || null;
    const supVal = supHier ? `'${supHier}'` : 'NULL';

    await db.query(`
      INSERT INTO Attestations (Intitule, titre_attestation, matricule, Approbateur_demande, etat_demande, nom_prenom, service, site, Details)
      VALUES (
        N'${intitule.replace(/'/g, "''")}',
        N'${titre_attestation.replace(/'/g, "''")}',
        '${req.user.matricule}',
        ${supVal},
        N'En attente',
        N'${nomPrenom.replace(/'/g, "''")}',
        N'${(emp.service || '').replace(/'/g, "''")}',
        N'${(emp.site || '').replace(/'/g, "''")}',
        N'${detailsJson.replace(/'/g, "''")}'
      )
    `);

    // ✉️ Notification confirmation à l'employé
    const empEmailInfo = await db.query(`SELECT Email FROM Utilisateurs WHERE matricule = '${req.user.matricule}'`);
    if (empEmailInfo.length > 0) {
      email.notifyNouvelleDemandeAttestation({
        employeEmail: empEmailInfo[0].Email,
        employeNom: nomPrenom,
        typeAttestation: titre_attestation,
        intitule
      }).catch(() => {});
    }

    res.status(201).json({ message: 'Demande d\'attestation créée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur création attestation', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/a-valider:
 *   get:
 *     summary: Attestations en attente de validation RH
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/attestations/a-valider', authenticateToken, async (req, res) => {
  try {
    if (!['Ressources Humaines', 'Administrateur'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const rows = await db.query(`
      SELECT a.*, u_emp.nom + ' ' + u_emp.prenom AS employe_nom, u_emp.fonction AS employe_fonction
      FROM Attestations a
      JOIN Utilisateurs u_emp ON a.matricule = u_emp.matricule
      WHERE a.etat_demande = 'En attente'
      ORDER BY a.Datetime DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération attestations à valider', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/{id}/valider:
 *   post:
 *     summary: Valider une demande d'attestation (RH)
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
app.post('/api/attestations/:id/valider', authenticateToken, async (req, res) => {
  try {
    if (!['Ressources Humaines', 'Administrateur'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    await db.query(`
      UPDATE Attestations SET
        etat_demande = 'Validé',
        Approbateur_RH = '${req.user.matricule}'
      WHERE id = ${parseInt(req.params.id)}
    `);
    res.json({ message: 'Attestation validée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur validation attestation', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/{id}/refuser:
 *   post:
 *     summary: Refuser une demande d'attestation (RH)
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
app.post('/api/attestations/:id/refuser', authenticateToken, async (req, res) => {
  try {
    if (!['Ressources Humaines', 'Administrateur'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    await db.query(`
      UPDATE Attestations SET
        etat_demande = 'Refusé',
        Approbateur_RH = '${req.user.matricule}'
      WHERE id = ${parseInt(req.params.id)}
    `);
    res.json({ message: 'Attestation refusée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur refus attestation', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/{id}/generer:
 *   post:
 *     summary: Marquer une attestation comme générée / PDF prêt (RH)
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
app.post('/api/attestations/:id/generer', authenticateToken, async (req, res) => {
  try {
    if (!['Ressources Humaines', 'Administrateur'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { pdf_url } = req.body;
    const pdfVal = pdf_url ? `N'${pdf_url.replace(/'/g, "''")}'` : 'NULL';
    await db.query(`
      UPDATE Attestations SET
        etat_demande = 'Généré',
        Approbateur_RH = '${req.user.matricule}',
        pdf_url = ${pdfVal}
      WHERE id = ${parseInt(req.params.id)}
    `);

    // ✉️ Notifier l'employé que son attestation est prête
    const attInfo = await db.query(`
      SELECT a.Intitule, a.titre_attestation, u.Email, u.nom, u.prenom
      FROM Attestations a JOIN Utilisateurs u ON a.matricule = u.matricule
      WHERE a.id = ${parseInt(req.params.id)}
    `);
    if (attInfo.length > 0) {
      const ai = attInfo[0];
      email.notifyAttestationGeneree({
        employeEmail: ai.Email,
        employeNom: `${ai.prenom} ${ai.nom}`,
        typeAttestation: ai.titre_attestation,
        intitule: ai.Intitule,
        dateGeneration: new Date().toLocaleDateString('fr-FR')
      }).catch(() => {});
    }

    res.json({ message: 'Attestation marquée comme générée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur génération attestation', error: err.message });
  }
});

/**
 * @swagger
 * /api/attestations/{id}:
 *   delete:
 *     summary: Annuler / supprimer une demande d'attestation (par l'employé)
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
app.delete('/api/attestations/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(`SELECT matricule, etat_demande FROM Attestations WHERE id = ${parseInt(req.params.id)}`);
    if (rows.length === 0) return res.status(404).json({ message: 'Attestation introuvable' });
    const att = rows[0];
    if (att.matricule !== req.user.matricule && !['Administrateur', 'Ressources Humaines'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    if (!['En attente'].includes(att.etat_demande)) {
      return res.status(400).json({ message: 'Seules les demandes en attente peuvent être annulées' });
    }
    await db.query(`DELETE FROM Attestations WHERE id = ${parseInt(req.params.id)}`);
    res.json({ message: 'Demande d\'attestation annulée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur annulation attestation', error: err.message });
  }
});

// ==========================================
// PDF GENERATION
// ==========================================

/**
 * @swagger
 * /api/attestations/{id}/pdf:
 *   get:
 *     summary: Générer et télécharger le PDF d'une attestation
 *     tags: [Attestations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
app.get('/api/attestations/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Récupérer l'attestation avec infos de l'approbateur RH
    const rows = await db.query(`
      SELECT a.*,
             u_rh.nom + ' ' + u_rh.prenom AS approbateur_rh_nom,
             u_rh.fonction AS approbateur_rh_fonction
      FROM Attestations a
      LEFT JOIN Utilisateurs u_rh ON a.Approbateur_RH = u_rh.matricule
      WHERE a.id = ${id}
    `);

    if (rows.length === 0) return res.status(404).json({ message: 'Attestation introuvable' });
    const att = rows[0];

    // Vérifier que l'employé est bien le demandeur ou RH/Admin
    if (att.matricule !== req.user.matricule && !['Ressources Humaines', 'Administrateur'].includes(req.user.statut)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier que l'attestation est validée ou générée
    if (!['Validé', 'Généré'].includes(att.etat_demande)) {
      return res.status(400).json({ message: 'Le document PDF n\'est disponible que pour les attestations validées' });
    }

    // Parser les détails JSON
    let details = {};
    try {
      details = typeof att.Details === 'string' ? JSON.parse(att.Details) : (att.Details || {});
    } catch (_) {}

    // Générer le PDF
    const doc = new PDFDocument({ size: 'A4', margin: 60 });

    const filename = `attestation_${id}_${att.matricule}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ---- EN-TÊTE ----
    const NAVY = '#1E2B37';
    const GOLD = '#C9A84C';
    const pageWidth = 595.28;
    const margin = 60;
    const contentWidth = pageWidth - margin * 2;

    // Bande de couleur haute
    doc.rect(0, 0, pageWidth, 8).fill(GOLD);

    // Bloc entreprise (haut à droite)
    doc.fontSize(18).font('Helvetica-Bold').fillColor(NAVY)
       .text('KILANI GROUP', margin, 30, { align: 'left' });
    doc.fontSize(9).font('Helvetica').fillColor('#555')
       .text('Direction des Ressources Humaines', margin, 52, { align: 'left' });

    // Numéro de document (haut à droite)
    const now = new Date();
    const dateStr = `${now.getDate().toString().padLeft ? now.getDate().toString().padStart(2,'0') : now.getDate()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
    doc.fontSize(8).font('Helvetica').fillColor('#888')
       .text(`Réf : ATT-${String(id).padStart(4,'0')}`, margin, 30, { align: 'right', width: contentWidth })
       .text(`Date d'émission : ${dateStr}`, margin, 42, { align: 'right', width: contentWidth });

    // Ligne séparatrice
    doc.moveTo(margin, 75).lineTo(pageWidth - margin, 75).strokeColor(GOLD).lineWidth(1.5).stroke();

    // ---- TITRE ----
    doc.moveDown(2);
    doc.rect(margin, 95, contentWidth, 40).fill(NAVY);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('white')
       .text(att.titre_attestation.toUpperCase(), margin, 108, { align: 'center', width: contentWidth });

    // ---- CORPS ----
    doc.moveDown(0.5);
    let y = 155;

    // Section : Informations de l'employé
    doc.rect(margin, y, contentWidth, 22).fill('#F5F6FA');
    doc.fontSize(10).font('Helvetica-Bold').fillColor(NAVY)
       .text('INFORMATIONS DE L\'EMPLOYÉ', margin + 8, y + 6);
    y += 30;

    const fieldStyle = { width: contentWidth, lineGap: 4 };
    const addField = (label, value) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#444').text(label + ' :', margin, y, { continued: true });
      doc.font('Helvetica').fillColor('#222').text('  ' + (value || '—'), { ...fieldStyle });
      y += 18;
    };

    addField('Nom et Prénom', att.nom_prenom);
    addField('Matricule', att.matricule);
    addField('Service', att.service);
    addField('Site', att.site);

    y += 8;
    // Section : Détails de la demande
    doc.rect(margin, y, contentWidth, 22).fill('#F5F6FA');
    doc.fontSize(10).font('Helvetica-Bold').fillColor(NAVY)
       .text('DÉTAILS DE L\'ATTESTATION', margin + 8, y + 6);
    y += 30;

    // Date de demande
    const dateDemande = att.Datetime ? new Date(att.Datetime) : now;
    const dateDemStr = `${dateDemande.getDate().toString().padStart(2,'0')}/${(dateDemande.getMonth()+1).toString().padStart(2,'0')}/${dateDemande.getFullYear()}`;
    addField('Date de la demande', dateDemStr);
    addField('Type d\'attestation', att.titre_attestation);

    // Champs complémentaires
    Object.entries(details).forEach(([k, v]) => {
      const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');
      addField(label, String(v));
    });

    // ---- CONTENU TEXTUEL ----
    y += 16;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#DDD').lineWidth(0.5).stroke();
    y += 16;

    // Texte de l'attestation selon le type
    let texteAttestation = `Nous soussignés, la Direction des Ressources Humaines de Kilani Group, \ncertifions par la présente que ${att.nom_prenom || 'l\'employé(e)'} \n(Matricule : ${att.matricule}) travaille au sein de notre société \ndans le service ${att.service || '—'} sur le site ${att.site || '—'}.`;

    const titre = (att.titre_attestation || '').toLowerCase();
    if (titre.includes('salaire')) {
      texteAttestation = `Nous soussignés, la Direction des Ressources Humaines de Kilani Group, \ncertifions que ${att.nom_prenom} (Matricule : ${att.matricule}), \noccupe un poste au sein de notre société dans le service ${att.service || '—'}.\n\nCette attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit, \nà la demande de : ${details.destinataire || '—'}, pour objet : ${details.objet || '—'}.`;
    } else if (titre.includes('présence')) {
      texteAttestation = `Nous soussignés, la Direction des Ressources Humaines de Kilani Group, \ncertifions que ${att.nom_prenom} (Matricule : ${att.matricule}) \na été présent(e) au sein de notre entreprise du ${details.date_debut || '—'} au ${details.date_fin || '—'}.`;
    } else if (titre.includes('paie') || titre.includes('fiche')) {
      texteAttestation = `FICHE DE PAIE\n\nEmployé(e) : ${att.nom_prenom}\nMatricule : ${att.matricule}\nService : ${att.service || '—'}\nPériode : ${details.mois || '—'} ${details.annee || '—'}\n\nCe document constitue la fiche de paie officielle pour la période indiquée.`;
    } else if (titre.includes('congé')) {
      texteAttestation = `Nous certifions que ${att.nom_prenom} (Matricule : ${att.matricule}) \nbénéficie d'un congé validé du ${details.date_debut || '—'} au ${details.date_fin || '—'}.`;
    }

    doc.fontSize(10).font('Helvetica').fillColor('#333')
       .text(texteAttestation, margin, y, { width: contentWidth, lineGap: 5, align: 'justify' });

    // ---- PIED DE PAGE ----
    const pageHeight = 841.89;
    const footerY = pageHeight - 160;

    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor(GOLD).lineWidth(1).stroke();

    // Bloc approbateur
    const approuveY = footerY + 16;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NAVY)
       .text('Approuvé par :', margin, approuveY);
    doc.fontSize(9).font('Helvetica').fillColor('#333')
       .text(att.approbateur_rh_nom || att.nom_prenom || '—', margin, approuveY + 14)
       .text(`Responsable RH`, margin, approuveY + 26);

    // Cachet / Date d'approbation
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NAVY)
       .text('Date d\'approbation :', pageWidth - margin - 160, approuveY, { width: 160, align: 'left' });
    doc.fontSize(9).font('Helvetica').fillColor('#333')
       .text(dateStr, pageWidth - margin - 160, approuveY + 14, { width: 160, align: 'left' });

    // Ligne de signature
    doc.moveTo(pageWidth - margin - 160, approuveY + 50)
       .lineTo(pageWidth - margin - 10, approuveY + 50)
       .strokeColor('#999').lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#999')
       .text('Signature & Cachet', pageWidth - margin - 160, approuveY + 54, { width: 150, align: 'center' });

    // Mention légale
    doc.rect(0, pageHeight - 40, pageWidth, 40).fill(NAVY);
    doc.fontSize(7).font('Helvetica').fillColor('#AAA')
       .text('Document généré automatiquement par le Système RH de Kilani Group — Confidentiel', margin, pageHeight - 26, { align: 'center', width: contentWidth });

    // Bande de couleur basse
    doc.rect(0, pageHeight - 8, pageWidth, 8).fill(GOLD);

    // Mettre à jour l'état en "Généré" si ce n'est pas déjà le cas
    if (att.etat_demande === 'Validé') {
      await db.query(`UPDATE Attestations SET etat_demande = 'Généré' WHERE id = ${id}`);
    }

    doc.end();
  } catch (err) {
    console.error('Erreur génération PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur génération PDF', error: err.message });
    }
  }
});

// ==========================================
// INTELLIGENCE ARTIFICIELLE (GEMINI)
// ==========================================
const { GoogleGenAI } = require('@google/genai');

// Initialize safely in case the key is missing initially
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Helper to fetch user context
async function getUserContext(matricule) {
  const userRows = await db.query(`SELECT nom, prenom, Statut, Email, date_recrutement, Solde_Conge, superieur_hierarchique, service, site FROM Utilisateurs WHERE matricule = '${matricule}'`);
  if (userRows.length === 0) return null;
  const user = userRows[0];
  
  // Get latest leaves
  const leaves = await db.query(`SELECT TOP 5 jour_debut, jour_fin, nombre_jours, acceptation_superieur, acceptation_ressource FROM Conges WHERE matricule = '${matricule}' ORDER BY Date_emission_demande DESC`);
  // Get active missions
  const missions = await db.query(`SELECT TOP 3 objet, destination, jour_debut, jour_fin, acceptation_superieur, acceptation_ressource FROM Missions WHERE matricule = '${matricule}' AND acceptation_superieur NOT IN ('Refusé') ORDER BY Date_emission_demande DESC`);
  
  return { user, leaves, missions };
}

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Poser une question à l'Assistant RH IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/ai/chats', authenticateToken, async (req, res) => {
  try {
    const { titre } = req.body;
    const finalTitre = titre || 'Nouvelle discussion';
    const result = await db.query(`
      INSERT INTO AiChats (matricule, titre) 
      OUTPUT INSERTED.id
      VALUES ('${req.user.matricule}', '${finalTitre.replace(/'/g, "''")}')
    `);
    res.json({ id: result[0].id, titre: finalTitre });
  } catch (err) {
    console.error('Erreur création chat:', err);
    res.status(500).json({ message: 'Erreur lors de la création du chat' });
  }
});

app.get('/api/ai/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await db.query(`SELECT * FROM AiChats WHERE matricule = '${req.user.matricule}' ORDER BY date_mise_a_jour DESC`);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération chats' });
  }
});

app.get('/api/ai/chats/:id', authenticateToken, async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await db.query(`SELECT * FROM AiChats WHERE id = ${chatId} AND matricule = '${req.user.matricule}'`);
    if (chat.length === 0) return res.status(404).json({ message: 'Chat non trouvé' });
    
    const messages = await db.query(`SELECT * FROM AiMessages WHERE chat_id = ${chatId} ORDER BY date_envoi ASC`);
    res.json({ chat: chat[0], messages });
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération messages' });
  }
});

app.put('/api/ai/chats/:id/archive', authenticateToken, async (req, res) => {
  try {
    const chatId = req.params.id;
    await db.query(`UPDATE AiChats SET is_archived = 1 WHERE id = ${chatId} AND matricule = '${req.user.matricule}'`);
    res.json({ message: 'Chat archivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur archivage chat' });
  }
});

app.delete('/api/ai/chats/:id', authenticateToken, async (req, res) => {
  try {
    const chatId = req.params.id;
    await db.query(`DELETE FROM AiChats WHERE id = ${chatId} AND matricule = '${req.user.matricule}'`);
    res.json({ message: 'Chat supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur suppression chat' });
  }
});

app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ message: "Le module IA n'est pas configuré sur le serveur (GEMINI_API_KEY manquante)." });
    
    const { message, chatId } = req.body;
    if (!message) return res.status(400).json({ message: 'Message requis' });
    
    const context = await getUserContext(req.user.matricule);
    if (!context) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    let activeChatId = chatId;
    
    // Si aucun chatId fourni, on crée un chat automatiquement avec les premiers mots du message
    if (!activeChatId) {
       const titre = message.substring(0, 30) + (message.length > 30 ? '...' : '');
       const result = await db.query(`
         INSERT INTO AiChats (matricule, titre) 
         OUTPUT INSERTED.id
         VALUES ('${req.user.matricule}', '${titre.replace(/'/g, "''")}')
       `);
       activeChatId = result[0].id;
    } else {
       // update last activity
       await db.query(`UPDATE AiChats SET date_mise_a_jour = GETDATE() WHERE id = ${activeChatId}`);
    }

    // Sauvegarder le message de l'utilisateur
    await db.query(`
      INSERT INTO AiMessages (chat_id, role, content) 
      VALUES (${activeChatId}, 'user', '${message.replace(/'/g, "''")}')
    `);

    // Récupérer l'historique récent
    const historyRows = await db.query(`
      SELECT TOP 20 role, content FROM AiMessages 
      WHERE chat_id = ${activeChatId} 
      ORDER BY date_envoi DESC
    `);
    
    // Inverser pour avoir l'ordre chronologique
    historyRows.reverse();

    const systemInstruction = `
Tu es l'assistant RH virtuel intelligent de l'entreprise Kilani Group.
Ton rôle est de répondre aux questions de l'employé de manière polie, concise et professionnelle.
Voici les informations concernant l'employé actuel :
- Nom : ${context.user.nom} ${context.user.prenom}
- Service : ${context.user.service}, Site : ${context.user.site}
- Manager (Supérieur) : ${context.user.superieur_hierarchique || 'Non défini'}
- Solde Congé : ${context.user.Solde_Conge} jours


Historique récent de congés : 
${JSON.stringify(context.leaves)}

Missions récentes :
${JSON.stringify(context.missions)}

Règles :
1. Ne donne pas d'informations sur d'autres employés.
2. Si tu ne connais pas la réponse, dis-le poliment et suggère de contacter le service RH.
3. Formate tes réponses en texte clair (le Markdown est accepté pour mettre en gras).
`;

    // Préparer les contents pour Gemini
    const contents = historyRows.map(row => ({
      role: row.role,
      parts: [{ text: row.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { systemInstruction }
    });
    
    const reply = response.text;

    // Sauvegarder la réponse de l'IA
    await db.query(`
      INSERT INTO AiMessages (chat_id, role, content) 
      VALUES (${activeChatId}, 'model', '${reply.replace(/'/g, "''")}')
    `);

    res.json({ reply: reply, chatId: activeChatId });
  } catch (err) {
    console.error('Erreur AI Chat:', err);
    res.status(500).json({ message: "Erreur lors de la communication avec l'IA", error: err.message });
  }
});

/**
 * @swagger
 * /api/ai/verify-leave:
 *   post:
 *     summary: Vérifier une demande de congé avec l'IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/ai/verify-leave', authenticateToken, async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ message: "L'IA n'est pas configurée (GEMINI_API_KEY manquante)." });
    
    const { date_debut, date_fin, type_conge } = req.body;
    
    const userRows = await db.query(`SELECT nom, prenom, Solde_Conge, service, site FROM Utilisateurs WHERE matricule = '${req.user.matricule}'`);
    if (userRows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const user = userRows[0];
    
    // Vérifier les chevauchements dans le même service (colonnes correctes de la table Conges)
    const overlaps = await db.query(`
      SELECT c.jour_debut, c.jour_fin, u.nom, u.prenom 
      FROM Conges c 
      JOIN Utilisateurs u ON c.matricule = u.matricule
      WHERE u.service = '${user.service}' 
        AND u.matricule != '${req.user.matricule}'
        AND c.acceptation_superieur IN ('Validé', 'En attente')
        AND (c.jour_debut <= '${date_fin}' AND c.jour_fin >= '${date_debut}')
    `);
    
    const prompt = `
En tant qu'assistant RH, analyse cette demande de congé :
Employé : ${user.nom} ${user.prenom} (Service: ${user.service})
Solde actuel : ${user.Solde_Conge} jours.
Demande : du ${date_debut} au ${date_fin} (Type: ${type_conge}).
Chevauchements dans le même service : ${overlaps.length > 0 ? JSON.stringify(overlaps) : 'Aucun'}.

Produis une réponse courte et directe (2 ou 3 phrases max) adressée à l'employé.
Donne ton avis sur la faisabilité de la demande (risque de refus s'il y a trop d'absences dans le service ou si le solde est faible). Commence par "⚠️ Analyse IA :" ou "✅ Analyse IA :".
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ analysis: response.text });
  } catch (err) {
    console.error('Erreur AI Verify:', err);
    res.status(500).json({ message: 'Erreur lors de l\'analyse IA', error: err.message });
  }
});

// ==========================================
// ADMINISTRATION (BACKOFFICE)
// ==========================================
app.use('/api/admin', authenticateToken, require('./adminRoutes'));

// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Backend Kilani HR à l'écoute sur http://localhost:${PORT}`);
  console.log(`📄 Documentation Swagger: http://localhost:${PORT}/api-docs`);
});
