/**
 * Script d'initialisation de la base de données KilaniHRDB
 * Exécute le script SQL init_db.sql directement via le driver mssql
 */
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
  user: 'sa',
  password: 'MotDePasse123!',
  server: '127.0.0.1',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function runInit() {
  let pool;
  try {
    // 1. Connexion sans DB pour créer KilaniHRDB
    console.log('📡 Connexion au serveur SQL (master)...');
    pool = await sql.connect(config);

    // 2. Créer la DB si elle n'existe pas
    console.log('🔧 Création de KilaniHRDB si nécessaire...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'KilaniHRDB')
      BEGIN
          CREATE DATABASE KilaniHRDB;
          PRINT 'Base de données KilaniHRDB créée.';
      END
      ELSE
          PRINT 'Base de données KilaniHRDB existe déjà.';
    `);

    await pool.close();

    // 3. Reconnexion sur KilaniHRDB
    console.log('📡 Connexion à KilaniHRDB...');
    pool = await sql.connect({ ...config, database: 'KilaniHRDB' });

    // 4. Drop tables dans le bon ordre (FK)
    console.log('🗑️  Suppression des tables existantes...');
    await pool.request().query(`
      IF OBJECT_ID('dbo.Attestations', 'U') IS NOT NULL DROP TABLE dbo.Attestations;
      IF OBJECT_ID('dbo.Missions', 'U') IS NOT NULL DROP TABLE dbo.Missions;
      IF OBJECT_ID('dbo.Conges', 'U') IS NOT NULL DROP TABLE dbo.Conges;
      IF OBJECT_ID('dbo.Utilisateurs', 'U') IS NOT NULL DROP TABLE dbo.Utilisateurs;
      IF OBJECT_ID('dbo.Motifs_Conge', 'U') IS NOT NULL DROP TABLE dbo.Motifs_Conge;
      IF OBJECT_ID('dbo.Types_Attestation', 'U') IS NOT NULL DROP TABLE dbo.Types_Attestation;
    `);

    // 5. Créer les tables
    console.log('📋 Création des tables...');
    await pool.request().query(`
      CREATE TABLE Motifs_Conge (
          id INT IDENTITY(1,1) PRIMARY KEY,
          libelle NVARCHAR(100) NOT NULL,
          description NVARCHAR(255),
          nombre_max_jours INT NULL,
          impact_solde BIT NOT NULL DEFAULT 1,
          validation_hierarchique_obligatoire BIT NOT NULL DEFAULT 1,
          actif BIT NOT NULL DEFAULT 1
      );
    `);

    await pool.request().query(`
      CREATE TABLE Utilisateurs (
          matricule NVARCHAR(50) PRIMARY KEY,
          nom NVARCHAR(100) NOT NULL,
          prenom NVARCHAR(100) NOT NULL,
          fonction NVARCHAR(100),
          site NVARCHAR(100),
          service NVARCHAR(100),
          date_recrutement DATE,
          signataire BIT DEFAULT 0,
          Email NVARCHAR(150) UNIQUE NOT NULL,
          password_hash NVARCHAR(255) NOT NULL,
          Solde_Conge DECIMAL(5,2) DEFAULT 0.00,
          Droit_Mensuel DECIMAL(4,2) DEFAULT 1.75,
          Dernier_maj_solde_conge DATETIME DEFAULT GETDATE(),
          Etat NVARCHAR(20) DEFAULT 'Actif',
          Statut NVARCHAR(30) NOT NULL,
          Societe NVARCHAR(100) DEFAULT 'Kilani Group',
          superieur_hierarchique NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule)
      );
    `);

    await pool.request().query(`
      CREATE TABLE Conges (
          id INT IDENTITY(1,1) PRIMARY KEY,
          matricule NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          motif_id INT NOT NULL FOREIGN KEY REFERENCES Motifs_Conge(id),
          superieur_hierarchique NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          Date_emission_demande DATETIME DEFAULT GETDATE(),
          type_conge NVARCHAR(30) NOT NULL,
          jour_debut DATE NOT NULL,
          jour_fin DATE NOT NULL,
          heure_sortie NVARCHAR(10) NULL,
          heure_entree NVARCHAR(10) NULL,
          nombre_jours DECIMAL(4,2) NOT NULL,
          nombre_heures DECIMAL(4,2) NOT NULL DEFAULT 0.00,
          commentaire NVARCHAR(MAX) NULL,
          piece_jointe NVARCHAR(255) NULL,
          acceptation_superieur NVARCHAR(20) DEFAULT 'En attente',
          Date_validation_superieur DATETIME NULL,
          commentaire_superieur NVARCHAR(MAX) NULL,
          acceptation_ressource NVARCHAR(20) DEFAULT 'En attente',
          Approbateur_RH NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          nom_prenom NVARCHAR(200),
          site NVARCHAR(100),
          Solde_Conge_Moment DECIMAL(5,2)
      );
    `);

    await pool.request().query(`
      CREATE TABLE Missions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          matricule NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          superieur_hierarchique NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          charge_ressource_humaine NVARCHAR(50) NULL,
          Date_emission_demande DATETIME DEFAULT GETDATE(),
          objet NVARCHAR(255) NOT NULL,
          destination NVARCHAR(255) NOT NULL,
          jour_debut DATE NOT NULL,
          jour_fin DATE NOT NULL,
          heure_sortie NVARCHAR(10) NULL,
          heure_entree NVARCHAR(10) NULL,
          moyen_transport NVARCHAR(100) NULL,
          commentaire NVARCHAR(MAX) NULL,
          Description NVARCHAR(MAX) NULL,
          acceptation_superieur NVARCHAR(20) DEFAULT 'En attente',
          Date_validation_superieur DATETIME NULL,
          commentaire_superieur NVARCHAR(MAX) NULL,
          acceptation_ressource NVARCHAR(20) DEFAULT 'En attente',
          annulation_superieur BIT DEFAULT 0,
          Date_annulation_superieur DATETIME NULL,
          Matricule_RH NVARCHAR(50) NULL,
          Approbateur_RH NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          nom_prenom NVARCHAR(200),
          site NVARCHAR(100)
      );
    `);

    // 6. Insérer les motifs
    console.log('📥 Insertion des motifs de congé...');
    await pool.request().query(`
      INSERT INTO Motifs_Conge (libelle, description, nombre_max_jours, impact_solde, validation_hierarchique_obligatoire, actif)
      VALUES 
      (N'Congé annuel', N'Congé payé annuel selon le solde disponible', NULL, 1, 1, 1),
      (N'Mariage', N'Autorisation d''absence pour mariage de l''employé', 3, 0, 1, 1),
      (N'Décès', N'Autorisation d''absence pour événement familial', 3, 0, 1, 1),
      (N'Formation', N'Absence pour formation professionnelle', 10, 0, 1, 1),
      (N'Maladie', N'Absence pour raison de santé (certificat médical)', 15, 0, 1, 1);
    `);

    // 7. Insérer les utilisateurs
    const defaultPwd = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
    console.log('👥 Insertion des utilisateurs...');
    await pool.request().query(`
      INSERT INTO Utilisateurs (matricule, nom, prenom, fonction, site, service, date_recrutement, signataire, Email, password_hash, Solde_Conge, Droit_Mensuel, Etat, Statut, Societe, superieur_hierarchique)
      VALUES 
      ('ADM001', N'Kilani', N'Admin', N'Administrateur SI', N'Siège Charguia', N'Informatique', '2020-01-15', 1, 'admin@kilani.tn', '${defaultPwd}', 25.00, 1.75, 'Actif', N'Administrateur', N'Kilani Group', NULL),
      ('RH001', N'Ben Ahmed', N'Monia', N'Responsable RH', N'Siège Charguia', N'Ressources Humaines', '2021-03-01', 1, 'rh@kilani.tn', '${defaultPwd}', 22.50, 1.75, 'Actif', N'Ressources Humaines', N'Kilani Group', 'ADM001'),
      ('MGR001', N'Ben Salah', N'Karim', N'Chef de Département', N'Siège Charguia', N'Logistique', '2021-06-10', 0, 'karim.bensalah@kilani.tn', '${defaultPwd}', 18.00, 1.75, 'Actif', N'Responsable Hiérarchique', N'Kilani Group', 'RH001');
    `);

    await pool.request().query(`
      INSERT INTO Utilisateurs (matricule, nom, prenom, fonction, site, service, date_recrutement, signataire, Email, password_hash, Solde_Conge, Droit_Mensuel, Etat, Statut, Societe, superieur_hierarchique)
      VALUES 
      ('EMP001', N'Trabelsi', N'Youssef', N'Ingénieur Réseau', N'Siège Charguia', N'Logistique', '2022-09-15', 0, 'youssef.trabelsi@kilani.tn', '${defaultPwd}', 15.00, 1.75, 'Actif', N'Employé', N'Kilani Group', 'MGR001'),
      ('EMP002', N'Saidi', N'Amira', N'Analyste Données', N'Siège Charguia', N'Logistique', '2023-02-01', 0, 'amira.saidi@kilani.tn', '${defaultPwd}', 12.50, 1.75, 'Actif', N'Employé', N'Kilani Group', 'MGR001');
    `);

    // 8. Insérer des demandes de congé de démonstration
    console.log('📄 Insertion des demandes de congé de démonstration...');
    await pool.request().query(`
      INSERT INTO Conges (matricule, motif_id, superieur_hierarchique, Date_emission_demande, type_conge, jour_debut, jour_fin, heure_sortie, heure_entree, nombre_jours, nombre_heures, commentaire, acceptation_superieur, acceptation_ressource, nom_prenom, site, Solde_Conge_Moment)
      VALUES 
      ('EMP001', 1, 'MGR001', DATEADD(day,-10,GETDATE()), N'Journée', '2026-07-01', '2026-07-03', NULL, NULL, 3.0, 24.0, N'Congé annuel de repos', N'Validé', N'Validé', N'Youssef Trabelsi', N'Siège Charguia', 18.00),
      ('EMP001', 2, 'MGR001', DATEADD(day,-2,GETDATE()), N'Journée', '2026-08-10', '2026-08-12', NULL, NULL, 3.0, 24.0, N'Mariage familial', N'En attente', N'En attente', N'Youssef Trabelsi', N'Siège Charguia', 15.00);
    `);

    // 9. Insérer des demandes de mission de démonstration
    console.log('🚀 Insertion des demandes de mission de démonstration...');
    await pool.request().query(`
      INSERT INTO Missions (matricule, superieur_hierarchique, Date_emission_demande, objet, destination, jour_debut, jour_fin, heure_sortie, heure_entree, moyen_transport, commentaire, Description, acceptation_superieur, acceptation_ressource, nom_prenom, site)
      VALUES 
      ('EMP001', 'MGR001', DATEADD(day,-5,GETDATE()), N'Réunion technique avec le client', N'Sfax', '2026-08-01', '2026-08-02', '08:00', '18:00', N'Voiture de service', N'Réunion de suivi du projet réseau', N'Mission technique pour le suivi du déploiement réseau chez le client à Sfax', N'Validé', N'En attente', N'Youssef Trabelsi', N'Siège Charguia'),
      ('EMP001', 'MGR001', DATEADD(day,-1,GETDATE()), N'Formation sécurité informatique', N'Tunis - Centre de Formation', '2026-08-15', '2026-08-16', '09:00', '17:00', N'Voiture personnelle', N'Formation certifiante en sécurité', N'Participation à la formation certifiante en cybersécurité', N'En attente', N'En attente', N'Youssef Trabelsi', N'Siège Charguia');
    `);

    await pool.request().query(`
      INSERT INTO Missions (matricule, superieur_hierarchique, Date_emission_demande, objet, destination, jour_debut, jour_fin, heure_sortie, heure_entree, moyen_transport, commentaire, Description, acceptation_superieur, acceptation_ressource, nom_prenom, site)
      VALUES 
      ('EMP002', 'MGR001', DATEADD(day,-3,GETDATE()), N'Audit qualité fournisseur', N'Sousse', '2026-08-05', '2026-08-05', '07:00', '19:00', N'Bus', N'Audit annuel du fournisseur principal', N'Déplacement pour l''audit qualité annuel chez le fournisseur à Sousse', N'En attente', N'En attente', N'Amira Saidi', N'Siège Charguia');
    `);

    // 10. Créer la table Types_Attestation
    console.log('📋 Création table Types_Attestation...');
    await pool.request().query(`
      CREATE TABLE Types_Attestation (
          id INT IDENTITY(1,1) PRIMARY KEY,
          code NVARCHAR(50) NOT NULL UNIQUE,
          libelle NVARCHAR(150) NOT NULL,
          description NVARCHAR(MAX) NULL,
          champs_complementaires NVARCHAR(MAX) NULL,
          validation_rh_requise BIT NOT NULL DEFAULT 1,
          actif BIT NOT NULL DEFAULT 1
      );
    `);

    // 11. Créer la table Attestations
    console.log('📄 Création table Attestations...');
    await pool.request().query(`
      CREATE TABLE Attestations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          Intitule NVARCHAR(150) NOT NULL,
          titre_attestation NVARCHAR(150) NOT NULL,
          matricule NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          Datetime DATETIME DEFAULT GETDATE(),
          Approbateur_demande NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          etat_demande NVARCHAR(30) NOT NULL DEFAULT 'En attente',
          nom_prenom NVARCHAR(200) NULL,
          service NVARCHAR(100) NULL,
          Approbateur_RH NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
          site NVARCHAR(100) NULL,
          Details NVARCHAR(MAX) NULL,
          pdf_url NVARCHAR(500) NULL
      );
    `);

    // 12. Insérer les types d'attestation
    console.log('📋 Insertion des types d\'attestation...');
    await pool.request().query(`
      INSERT INTO Types_Attestation (code, libelle, description, champs_complementaires, validation_rh_requise, actif)
      VALUES
      ('TRAVAIL',   N'Attestation de travail',   N'Certifie que l''employé travaille dans l''entreprise', N'[]', 1, 1),
      ('SALAIRE',   N'Attestation de salaire',   N'Certifie le salaire mensuel de l''employé', N'[{"nom":"destinataire","label":"Destinataire","type":"text","requis":true},{"nom":"objet","label":"Objet","type":"text","requis":false}]', 1, 1),
      ('FICHE_PAIE',N'Fiche de paie',            N'Document mensuel de paie détaillé', N'[{"nom":"mois","label":"Mois","type":"select","options":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],"requis":true},{"nom":"annee","label":"Année","type":"number","requis":true}]', 1, 1),
      ('PRESENCE',  N'Attestation de présence',  N'Certifie la présence de l''employé sur une période donnée', N'[{"nom":"date_debut","label":"Date début","type":"date","requis":true},{"nom":"date_fin","label":"Date fin","type":"date","requis":true}]', 1, 1),
      ('CONGE',     N'Attestation de congé',     N'Certifie la prise de congé validée', N'[{"nom":"date_debut","label":"Date début","type":"date","requis":true},{"nom":"date_fin","label":"Date fin","type":"date","requis":true}]', 0, 1);
    `);

    // 13. Insérer des attestations de démonstration
    console.log('📄 Insertion des demandes d\'attestation de démonstration...');
    await pool.request().query(`
      INSERT INTO Attestations (Intitule, titre_attestation, matricule, Datetime, etat_demande, nom_prenom, service, site, Details)
      VALUES
      (N'Attestation de travail - Youssef Trabelsi', N'Attestation de travail', 'EMP001', DATEADD(day,-7,GETDATE()), N'Validé',     N'Youssef Trabelsi', N'Logistique', N'Siège Charguia', N'{}'),
      (N'Fiche de paie - Juin 2026',                 N'Fiche de paie',          'EMP001', DATEADD(day,-3,GETDATE()), N'En attente', N'Youssef Trabelsi', N'Logistique', N'Siège Charguia', N'{"mois":"Juin","annee":"2026"}'),
      (N'Attestation de salaire - Banque BH',        N'Attestation de salaire',  'EMP002', DATEADD(day,-1,GETDATE()), N'En attente', N'Amira Saidi',      N'Logistique', N'Siège Charguia', N'{"destinataire":"Banque de l''Habitat","objet":"Ouverture de compte"}');
    `);

    console.log('');
    console.log('✅ Base de données KilaniHRDB initialisée avec succès !');
    console.log('');
    console.log('Tables créées :');
    console.log('  📋 Motifs_Conge (5 motifs)');
    console.log('  👥 Utilisateurs (5 comptes)');
    console.log('  📝 Conges (2 demandes de démonstration)');
    console.log('  🚀 Missions (3 demandes de démonstration)');
    console.log('  🏷️  Types_Attestation (5 types)');
    console.log('  📄 Attestations (3 demandes de démonstration)');
    console.log('');
    console.log('Comptes de test (mot de passe: password123) :');
    console.log('  👤 ADM001 / admin@kilani.tn  → Administrateur');
    console.log('  👤 RH001  / rh@kilani.tn     → Ressources Humaines');
    console.log('  👤 MGR001 / karim.bensalah@kilani.tn → Responsable');
    console.log('  👤 EMP001 / youssef.trabelsi@kilani.tn → Employé');
    console.log('  👤 EMP002 / amira.saidi@kilani.tn → Employé');

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur initialisation:', err.message);
    if (pool) await pool.close().catch(() => {});
    process.exit(1);
  }
}

runInit();
