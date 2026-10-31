const express = require('express');
const router = express.Router();
const db = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware to check if user is Admin or RH
const checkAdminOrRH = (req, res, next) => {
  const statut = req.user.statut;
  if (statut !== 'Administrateur' && statut !== 'Ressources Humaines') {
    return res.status(403).json({ message: 'Accès refusé: Réservé aux administrateurs ou RH' });
  }
  next();
};

router.use(checkAdminOrRH);

// ==========================================
// DASHBOARD STATS
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const [empCount] = await db.query(`SELECT COUNT(*) as total FROM Utilisateurs WHERE Etat = 'Actif'`);
    const [leavesPending] = await db.query(`SELECT COUNT(*) as total FROM Conges WHERE acceptation_superieur = 'En attente'`);
    const [missionsPending] = await db.query(`SELECT COUNT(*) as total FROM Missions WHERE acceptation_superieur = 'En attente'`);
    const [attestPending] = await db.query(`SELECT COUNT(*) as total FROM Attestations WHERE etat_demande = 'En attente'`);
    const [leavesValidated] = await db.query(`SELECT COUNT(*) as total FROM Conges WHERE acceptation_superieur = 'Validé'`);
    const [leavesRefused] = await db.query(`SELECT COUNT(*) as total FROM Conges WHERE acceptation_superieur = 'Refusé'`);
    const [missionsValidated] = await db.query(`SELECT COUNT(*) as total FROM Missions WHERE acceptation_superieur = 'Validé'`);

    // Congés par département
    const byDept = await db.query(`
      SELECT u.service as dept, COUNT(*) as total
      FROM Conges c
      JOIN Utilisateurs u ON c.matricule = u.matricule
      WHERE c.acceptation_superieur = 'Validé'
      GROUP BY u.service
    `);

    // Dernières demandes
    const recentRequests = await db.query(`
      SELECT TOP 10 'Congé' as type_demande, c.id, c.matricule, u.nom, u.prenom, u.service,
             c.jour_debut as date_debut, c.jour_fin as date_fin,
             c.acceptation_superieur as statut, c.Date_emission_demande as date_creation
      FROM Conges c
      JOIN Utilisateurs u ON c.matricule = u.matricule
      UNION ALL
      SELECT TOP 10 'Mission' as type_demande, m.id, m.matricule, u.nom, u.prenom, u.service,
             m.jour_debut, m.jour_fin,
             m.acceptation_superieur as statut, m.Date_emission_demande as date_creation
      FROM Missions m
      JOIN Utilisateurs u ON m.matricule = u.matricule
      ORDER BY date_creation DESC
    `);

    res.json({
      employees: empCount.total,
      leavesPending: leavesPending.total,
      missionsPending: missionsPending.total,
      attestPending: attestPending.total,
      leavesValidated: leavesValidated.total,
      leavesRefused: leavesRefused.total,
      missionsValidated: missionsValidated.total,
      byDept,
      recentRequests
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1. UTILISATEURS / EMPLOYÉS
// ==========================================

router.get('/employees', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.matricule, u.nom, u.prenom, u.Email, u.fonction, u.service, u.site,
             u.Statut, u.Etat, u.Solde_Conge, u.Droit_Mensuel, u.date_recrutement,
             u.superieur_hierarchique, u.Societe,
             s.nom AS superieur_nom, s.prenom AS superieur_prenom
      FROM Utilisateurs u
      LEFT JOIN Utilisateurs s ON u.superieur_hierarchique = s.matricule
      ORDER BY u.nom
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const { matricule, nom, prenom, Email, fonction, service, site, Statut, Etat, superieur_hierarchique, Droit_Mensuel, date_recrutement, Societe } = req.body;
    const defaultPassword = hashPassword('password123');
    await db.query(`
      INSERT INTO Utilisateurs (matricule, nom, prenom, Email, fonction, service, site, Statut, Etat, superieur_hierarchique, Droit_Mensuel, date_recrutement, Societe, password_hash)
      VALUES ('${matricule}', '${nom}', '${prenom}', '${Email}', '${fonction}', '${service}', '${site}', '${Statut}', '${Etat || 'Actif'}',
              ${superieur_hierarchique ? `'${superieur_hierarchique}'` : 'NULL'}, ${Droit_Mensuel || 1.75}, ${date_recrutement ? `'${date_recrutement}'` : 'NULL'}, '${Societe || 'Kilani Group'}', '${defaultPassword}')
    `);
    res.json({ message: 'Employé créé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/employees/:matricule', async (req, res) => {
  try {
    const { nom, prenom, Email, fonction, service, site, Statut, Etat, superieur_hierarchique, Droit_Mensuel, date_recrutement, Societe } = req.body;
    await db.query(`
      UPDATE Utilisateurs SET
        nom='${nom}', prenom='${prenom}', Email='${Email}', fonction='${fonction}',
        service='${service}', site='${site}', Statut='${Statut}', Etat='${Etat}',
        superieur_hierarchique=${superieur_hierarchique ? `'${superieur_hierarchique}'` : 'NULL'},
        Droit_Mensuel=${Droit_Mensuel || 1.75},
        date_recrutement=${date_recrutement ? `'${date_recrutement}'` : 'NULL'},
        Societe='${Societe || 'Kilani Group'}'
      WHERE matricule='${req.params.matricule}'
    `);
    res.json({ message: 'Employé mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/employees/:matricule', async (req, res) => {
  try {
    await db.query(`UPDATE Utilisateurs SET Etat='Inactif' WHERE matricule='${req.params.matricule}'`);
    res.json({ message: 'Employé désactivé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password
router.post('/employees/:matricule/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hashed = hashPassword(newPassword || 'password123');
    await db.query(`UPDATE Utilisateurs SET password_hash='${hashed}' WHERE matricule='${req.params.matricule}'`);
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. MOTIFS CONGÉ
// ==========================================
router.get('/leave-motifs', async (req, res) => {
  try {
    const rows = await db.query(`SELECT * FROM Motifs_Conge ORDER BY libelle`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/leave-motifs', async (req, res) => {
  try {
    const { libelle, description, nombre_max_jours, impact_solde, validation_hierarchique_obligatoire } = req.body;
    await db.query(`
      INSERT INTO Motifs_Conge (libelle, description, nombre_max_jours, impact_solde, validation_hierarchique_obligatoire)
      VALUES ('${libelle}', '${description || ''}', ${nombre_max_jours || 'NULL'}, ${impact_solde ? 1 : 0}, ${validation_hierarchique_obligatoire ? 1 : 0})
    `);
    res.json({ message: 'Motif créé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/leave-motifs/:id', async (req, res) => {
  try {
    const { libelle, description, nombre_max_jours, impact_solde, validation_hierarchique_obligatoire, actif } = req.body;
    await db.query(`
      UPDATE Motifs_Conge SET
        libelle='${libelle}', description='${description || ''}',
        nombre_max_jours=${nombre_max_jours || 'NULL'},
        impact_solde=${impact_solde ? 1 : 0},
        validation_hierarchique_obligatoire=${validation_hierarchique_obligatoire ? 1 : 0},
        actif=${actif !== undefined ? (actif ? 1 : 0) : 1}
      WHERE id=${req.params.id}
    `);
    res.json({ message: 'Motif mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/leave-motifs/:id', async (req, res) => {
  try {
    await db.query(`UPDATE Motifs_Conge SET actif=0 WHERE id=${req.params.id}`);
    res.json({ message: 'Motif désactivé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. TYPES D'ATTESTATION
// ==========================================
router.get('/attestation-types', async (req, res) => {
  try {
    const rows = await db.query(`SELECT * FROM Types_Attestation ORDER BY libelle`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attestation-types', async (req, res) => {
  try {
    const { code, libelle, description, validation_rh_requise } = req.body;
    await db.query(`
      INSERT INTO Types_Attestation (code, libelle, description, validation_rh_requise)
      VALUES ('${code}', '${libelle}', '${description || ''}', ${validation_rh_requise ? 1 : 0})
    `);
    res.json({ message: 'Type créé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/attestation-types/:id', async (req, res) => {
  try {
    const { code, libelle, description, validation_rh_requise, actif } = req.body;
    await db.query(`
      UPDATE Types_Attestation SET
        code='${code}', libelle='${libelle}', description='${description || ''}',
        validation_rh_requise=${validation_rh_requise ? 1 : 0},
        actif=${actif !== undefined ? (actif ? 1 : 0) : 1}
      WHERE id=${req.params.id}
    `);
    res.json({ message: 'Type mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/attestation-types/:id', async (req, res) => {
  try {
    await db.query(`UPDATE Types_Attestation SET actif=0 WHERE id=${req.params.id}`);
    res.json({ message: 'Type désactivé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. CONGÉS (Consultation + filtres complets)
// ==========================================
router.get('/leaves', async (req, res) => {
  try {
    const { statut, matricule, service, superieur, motif_id, periode_debut, periode_fin } = req.query;
    let query = `
      SELECT c.id, c.matricule, u.nom, u.prenom, u.service, c.type_conge,
             c.jour_debut, c.jour_fin, c.nombre_jours, c.commentaire,
             c.acceptation_superieur, c.acceptation_ressource,
             c.Date_emission_demande,
             sup.nom AS superieur_nom, sup.prenom AS superieur_prenom,
             m.libelle AS nom_motif, u.Solde_Conge AS Solde_Conge_avant, c.Solde_Conge_Moment
      FROM Conges c
      JOIN Utilisateurs u ON c.matricule = u.matricule
      LEFT JOIN Utilisateurs sup ON c.superieur_hierarchique = sup.matricule
      LEFT JOIN Motifs_Conge m ON c.motif_id = m.id
      WHERE 1=1
    `;
    if (statut) query += ` AND c.acceptation_superieur = '${statut}'`;
    if (matricule) query += ` AND c.matricule = '${matricule}'`;
    if (service) query += ` AND u.service = '${service}'`;
    if (superieur) query += ` AND c.superieur_hierarchique = '${superieur}'`;
    if (motif_id) query += ` AND c.motif_id = ${motif_id}`;
    if (periode_debut && periode_fin) {
      query += ` AND (c.jour_debut <= '${periode_fin}' AND c.jour_fin >= '${periode_debut}')`;
    }
    query += ` ORDER BY c.Date_emission_demande DESC`;
    const leaves = await db.query(query);
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. MISSIONS (Consultation + filtres)
// ==========================================
router.get('/missions', async (req, res) => {
  try {
    const { statut, matricule, service, superieur, periode_debut, periode_fin } = req.query;
    let query = `
      SELECT m.id, m.matricule, u.nom, u.prenom, u.service,
             m.objet, m.destination, m.jour_debut, m.jour_fin,
             m.moyen_transport, m.acceptation_superieur, m.acceptation_ressource,
             m.Date_emission_demande,
             sup.nom AS superieur_nom, sup.prenom AS superieur_prenom
      FROM Missions m
      JOIN Utilisateurs u ON m.matricule = u.matricule
      LEFT JOIN Utilisateurs sup ON m.superieur_hierarchique = sup.matricule
      WHERE 1=1
    `;
    if (statut) query += ` AND m.acceptation_superieur = '${statut}'`;
    if (matricule) query += ` AND m.matricule = '${matricule}'`;
    if (service) query += ` AND u.service = '${service}'`;
    if (superieur) query += ` AND m.superieur_hierarchique = '${superieur}'`;
    if (periode_debut && periode_fin) {
      query += ` AND (m.jour_debut <= '${periode_fin}' AND m.jour_fin >= '${periode_debut}')`;
    }
    query += ` ORDER BY m.Date_emission_demande DESC`;
    const missions = await db.query(query);
    res.json(missions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ATTESTATIONS (Consultation + filtres)
// ==========================================
router.get('/attestations', async (req, res) => {
  try {
    const { statut, matricule, service } = req.query;
    let query = `
      SELECT a.id, a.matricule, u.nom, u.prenom, u.service,
             a.Intitule, a.titre_attestation, a.etat_demande, a.Datetime,
             app.nom AS approbateur_nom, app.prenom AS approbateur_prenom
      FROM Attestations a
      JOIN Utilisateurs u ON a.matricule = u.matricule
      LEFT JOIN Utilisateurs app ON a.Approbateur_demande = app.matricule
      WHERE 1=1
    `;
    if (statut) query += ` AND a.etat_demande = '${statut}'`;
    if (matricule) query += ` AND a.matricule = '${matricule}'`;
    if (service) query += ` AND u.service = '${service}'`;
    query += ` ORDER BY a.Datetime DESC`;
    const attestations = await db.query(query);
    res.json(attestations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. PARAMÉTRAGE DES DROITS MENSUELS
// ==========================================
// Mettre à jour le droit mensuel global (tous les actifs)
router.post('/settings/monthly-rights', async (req, res) => {
  try {
    const { droit_mensuel, appliquer_a_tous } = req.body;
    if (appliquer_a_tous) {
      await db.query(`UPDATE Utilisateurs SET Droit_Mensuel=${droit_mensuel} WHERE Etat='Actif'`);
    }
    res.json({ message: `Droit mensuel mis à jour à ${droit_mensuel} jours/mois` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calcul et crédit mensuel des congés
router.post('/settings/credit-monthly', async (req, res) => {
  try {
    await db.query(`
      UPDATE Utilisateurs
      SET Solde_Conge = Solde_Conge + Droit_Mensuel,
          Dernier_maj_solde_conge = GETDATE()
      WHERE Etat = 'Actif'
    `);
    res.json({ message: 'Soldes crédités avec succès pour tous les employés actifs' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir les services distincts
router.get('/services', async (req, res) => {
  try {
    const rows = await db.query(`SELECT DISTINCT service FROM Utilisateurs WHERE service IS NOT NULL ORDER BY service`);
    res.json(rows.map(r => r.service));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir les supérieurs hiérarchiques
router.get('/managers', async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT matricule, nom, prenom, service, site
      FROM Utilisateurs
      WHERE Statut IN ('Responsable Hiérarchique', 'Ressources Humaines', 'Administrateur')
        AND Etat = 'Actif'
      ORDER BY nom
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
