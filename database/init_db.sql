-- =========================================================
-- Script SQL d'initialisation de la Base de Données KilaniHRDB
-- Groupe Kilani - Application RH
-- =========================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'KilaniHRDB')
BEGIN
    CREATE DATABASE KilaniHRDB;
END
GO

USE KilaniHRDB;
GO

-- 1. Drop tables dans le bon ordre (FK)
IF OBJECT_ID('dbo.Attestations', 'U') IS NOT NULL DROP TABLE dbo.Attestations;
IF OBJECT_ID('dbo.Missions', 'U') IS NOT NULL DROP TABLE dbo.Missions;
IF OBJECT_ID('dbo.Conges', 'U') IS NOT NULL DROP TABLE dbo.Conges;
IF OBJECT_ID('dbo.Utilisateurs', 'U') IS NOT NULL DROP TABLE dbo.Utilisateurs;
IF OBJECT_ID('dbo.Motifs_Conge', 'U') IS NOT NULL DROP TABLE dbo.Motifs_Conge;
IF OBJECT_ID('dbo.AiMessages', 'U') IS NOT NULL DROP TABLE dbo.AiMessages;
IF OBJECT_ID('dbo.AiChats', 'U') IS NOT NULL DROP TABLE dbo.AiChats;
IF OBJECT_ID('dbo.Types_Attestation', 'U') IS NOT NULL DROP TABLE dbo.Types_Attestation;

-- 2. Table Motifs_Conge
CREATE TABLE Motifs_Conge (
    id INT IDENTITY(1,1) PRIMARY KEY,
    libelle NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    nombre_max_jours INT NULL,
    impact_solde BIT NOT NULL DEFAULT 1,
    validation_hierarchique_obligatoire BIT NOT NULL DEFAULT 1,
    actif BIT NOT NULL DEFAULT 1
);

-- 3. Table Utilisateurs
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
    Statut NVARCHAR(30) NOT NULL, -- Employe, Responsable Hiérarchique, Ressources Humaines, Administrateur
    Societe NVARCHAR(100) DEFAULT 'Kilani Group',
    superieur_hierarchique NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule)
);

-- 4. Table Conges
CREATE TABLE Conges (
    id INT IDENTITY(1,1) PRIMARY KEY,
    matricule NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
    motif_id INT NOT NULL FOREIGN KEY REFERENCES Motifs_Conge(id),
    superieur_hierarchique NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
    Date_emission_demande DATETIME DEFAULT GETDATE(),
    type_conge NVARCHAR(30) NOT NULL, -- Journee, Demi-journee, Quart de journee
    jour_debut DATE NOT NULL,
    jour_fin DATE NOT NULL,
    heure_sortie NVARCHAR(10) NULL,
    heure_entree NVARCHAR(10) NULL,
    nombre_jours DECIMAL(4,2) NOT NULL,
    nombre_heures DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    commentaire NVARCHAR(MAX) NULL,
    piece_jointe NVARCHAR(255) NULL,
    acceptation_superieur NVARCHAR(20) DEFAULT 'En attente', -- En attente, Validé, Refusé
    Date_validation_superieur DATETIME NULL,
    commentaire_superieur NVARCHAR(MAX) NULL,
    acceptation_ressource NVARCHAR(20) DEFAULT 'En attente', -- En attente, Validé, Refusé
    Approbateur_RH NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
    nom_prenom NVARCHAR(200),
    site NVARCHAR(100),
    Solde_Conge_Moment DECIMAL(5,2)
);

-- 5. Table Missions
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

-- 6. Table Types_Attestation (CRUD des types)
CREATE TABLE Types_Attestation (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    libelle NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    champs_complementaires NVARCHAR(MAX) NULL, -- JSON: liste des champs requis
    validation_rh_requise BIT NOT NULL DEFAULT 1,
    actif BIT NOT NULL DEFAULT 1
);

-- 7. Table Attestations
CREATE TABLE Attestations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    Intitule NVARCHAR(150) NOT NULL,          -- Libellé / titre interne
    titre_attestation NVARCHAR(150) NOT NULL,  -- Type officiel (Attestation de travail, etc.)
    matricule NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
    Datetime DATETIME DEFAULT GETDATE(),       -- Date de la demande
    Approbateur_demande NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule), -- Supérieur qui valide
    etat_demande NVARCHAR(30) NOT NULL DEFAULT 'En attente', -- En attente, Validé, Refusé, Généré
    nom_prenom NVARCHAR(200) NULL,             -- Dénomination de l'employé
    service NVARCHAR(100) NULL,
    Approbateur_RH NVARCHAR(50) NULL FOREIGN KEY REFERENCES Utilisateurs(matricule),
    site NVARCHAR(100) NULL,
    Details NVARCHAR(MAX) NULL,               -- JSON: champs complémentaires (mois/année, destinataire, objet...)
    pdf_url NVARCHAR(500) NULL                -- URL du document PDF généré
);

-- ==========================================
-- Tables Historique IA
-- ==========================================

-- Table AiChats
CREATE TABLE AiChats (
    id INT IDENTITY(1,1) PRIMARY KEY,
    matricule NVARCHAR(50) NOT NULL,
    titre NVARCHAR(255) NOT NULL,
    is_archived BIT NOT NULL DEFAULT 0,
    date_creation DATETIME DEFAULT GETDATE(),
    date_mise_a_jour DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_AiChats_Utilisateurs FOREIGN KEY (matricule) REFERENCES Utilisateurs(matricule) ON DELETE CASCADE
);

-- Table AiMessages
CREATE TABLE AiMessages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chat_id INT NOT NULL,
    role NVARCHAR(10) NOT NULL CHECK (role IN ('user', 'model')),
    content NVARCHAR(MAX) NOT NULL,
    date_envoi DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_AiMessages_AiChats FOREIGN KEY (chat_id) REFERENCES AiChats(id) ON DELETE CASCADE
);

-- ==========================================
-- INSERTION DES DONNÉES DE DÉPART
-- =========================================================

-- Types d'attestation
INSERT INTO Types_Attestation (code, libelle, description, champs_complementaires, validation_rh_requise, actif)
VALUES
('TRAVAIL',   N'Attestation de travail',    N'Certifie que l''employé travaille dans l''entreprise',         N'[]',                                                            1, 1),
('SALAIRE',   N'Attestation de salaire',    N'Certifie le salaire mensuel de l''employé',                   N'[{"nom":"destinataire","label":"Destinataire","type":"text","requis":true},{"nom":"objet","label":"Objet","type":"text","requis":false}]', 1, 1),
('FICHE_PAIE',N'Fiche de paie',             N'Document mensuel de paie détaillé',                          N'[{"nom":"mois","label":"Mois","type":"select","options":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],"requis":true},{"nom":"annee","label":"Année","type":"number","requis":true}]', 1, 1),
('PRESENCE',  N'Attestation de présence',   N'Certifie la présence de l''employé sur une période donnée',  N'[{"nom":"date_debut","label":"Date début","type":"date","requis":true},{"nom":"date_fin","label":"Date fin","type":"date","requis":true}]', 1, 1),
('CONGE',     N'Attestation de congé',      N'Certifie la prise de congé validée',                         N'[{"nom":"date_debut","label":"Date début","type":"date","requis":true},{"nom":"date_fin","label":"Date fin","type":"date","requis":true}]', 0, 1);

-- Insertion des Motifs de Congé
INSERT INTO Motifs_Conge (libelle, description, nombre_max_jours, impact_solde, validation_hierarchique_obligatoire, actif)
VALUES 
(N'Congé annuel', N'Congé payé annuel selon le solde disponible', NULL, 1, 1, 1),
(N'Mariage', N'Autorisation d''absence pour mariage de l''employé', 3, 0, 1, 1),
(N'Décès', N'Autorisation d''absence pour événement familial', 3, 0, 1, 1),
(N'Formation', N'Absence pour formation professionnelle', 10, 0, 1, 1),
(N'Maladie', N'Absence pour raison de santé (certificat médical)', 15, 0, 1, 1);

-- Password Hash pour 'password123' (SHA256)
DECLARE @DefaultPwd NVARCHAR(255) = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

-- Insertion des Utilisateurs
INSERT INTO Utilisateurs (matricule, nom, prenom, fonction, site, service, date_recrutement, signataire, Email, password_hash, Solde_Conge, Droit_Mensuel, Etat, Statut, Societe, superieur_hierarchique)
VALUES 
('ADM001', N'Kilani', N'Admin', N'Administrateur SI', N'Siège Charguia', N'Informatique', '2020-01-15', 1, 'admin@kilani.tn', @DefaultPwd, 25.00, 1.75, 'Actif', N'Administrateur', N'Kilani Group', NULL),
('RH001', N'Ben Ahmed', N'Monia', N'Responsable RH', N'Siège Charguia', N'Ressources Humaines', '2021-03-01', 1, 'rh@kilani.tn', @DefaultPwd, 22.50, 1.75, 'Actif', N'Ressources Humaines', N'Kilani Group', 'ADM001'),
('MGR001', N'Ben Salah', N'Karim', N'Chef de Département', N'Siège Charguia', N'Logistique', '2021-06-10', 0, 'karim.bensalah@kilani.tn', @DefaultPwd, 18.00, 1.75, 'Actif', N'Responsable Hiérarchique', N'Kilani Group', 'RH001');

INSERT INTO Utilisateurs (matricule, nom, prenom, fonction, site, service, date_recrutement, signataire, Email, password_hash, Solde_Conge, Droit_Mensuel, Etat, Statut, Societe, superieur_hierarchique)
VALUES 
('EMP001', N'Trabelsi', N'Youssef', N'Ingénieur Réseau', N'Siège Charguia', N'Logistique', '2022-09-15', 0, 'youssef.trabelsi@kilani.tn', @DefaultPwd, 15.00, 1.75, 'Actif', N'Employé', N'Kilani Group', 'MGR001'),
('EMP002', N'Saidi', N'Amira', N'Analyste Données', N'Siège Charguia', N'Logistique', '2023-02-01', 0, 'amira.saidi@kilani.tn', @DefaultPwd, 12.50, 1.75, 'Actif', N'Employé', N'Kilani Group', 'MGR001');

-- Demandes de congé de démonstration
INSERT INTO Conges (matricule, motif_id, superieur_hierarchique, Date_emission_demande, type_conge, jour_debut, jour_fin, heure_sortie, heure_entree, nombre_jours, nombre_heures, commentaire, acceptation_superieur, acceptation_ressource, nom_prenom, site, Solde_Conge_Moment)
VALUES 
('EMP001', 1, 'MGR001', DATEADD(day,-10,GETDATE()), N'Journée', '2026-07-01', '2026-07-03', NULL, NULL, 3.0, 24.0, N'Congé annuel de repos', N'Validé', N'Validé', N'Youssef Trabelsi', N'Siège Charguia', 18.00),
('EMP001', 2, 'MGR001', DATEADD(day,-2,GETDATE()), N'Journée', '2026-08-10', '2026-08-12', NULL, NULL, 3.0, 24.0, N'Mariage familial', N'En attente', N'En attente', N'Youssef Trabelsi', N'Siège Charguia', 15.00);

-- Demandes de mission de démonstration
INSERT INTO Missions (matricule, superieur_hierarchique, Date_emission_demande, objet, destination, jour_debut, jour_fin, heure_sortie, heure_entree, moyen_transport, commentaire, Description, acceptation_superieur, acceptation_ressource, nom_prenom, site)
VALUES 
('EMP001', 'MGR001', DATEADD(day,-5,GETDATE()), N'Réunion technique avec le client', N'Sfax', '2026-08-01', '2026-08-02', '08:00', '18:00', N'Voiture de service', N'Réunion de suivi du projet réseau', N'Mission technique pour le suivi du déploiement réseau chez le client à Sfax', N'Validé', N'En attente', N'Youssef Trabelsi', N'Siège Charguia'),
('EMP001', 'MGR001', DATEADD(day,-1,GETDATE()), N'Formation sécurité informatique', N'Tunis - Centre de Formation', '2026-08-15', '2026-08-16', '09:00', '17:00', N'Voiture personnelle', N'Formation certifiante en sécurité', N'Participation à la formation certifiante en cybersécurité', N'En attente', N'En attente', N'Youssef Trabelsi', N'Siège Charguia'),
('EMP002', 'MGR001', DATEADD(day,-3,GETDATE()), N'Audit qualité fournisseur', N'Sousse', '2026-08-05', '2026-08-05', '07:00', '19:00', N'Bus', N'Audit annuel du fournisseur principal', N'Déplacement pour l''audit qualité annuel chez le fournisseur à Sousse', N'En attente', N'En attente', N'Amira Saidi', N'Siège Charguia');

-- Demandes d'attestation de démonstration
INSERT INTO Attestations (Intitule, titre_attestation, matricule, Datetime, etat_demande, nom_prenom, service, site, Details)
VALUES
(N'Attestation de travail - Youssef Trabelsi',   N'Attestation de travail',    'EMP001', DATEADD(day,-7,GETDATE()),  N'Validé',    N'Youssef Trabelsi', N'Logistique', N'Siège Charguia', N'{}'),
(N'Fiche de paie - Juin 2026',                   N'Fiche de paie',             'EMP001', DATEADD(day,-3,GETDATE()),  N'En attente',N'Youssef Trabelsi', N'Logistique', N'Siège Charguia', N'{"mois":"Juin","annee":"2026"}'),
(N'Attestation de salaire - Banque BH',          N'Attestation de salaire',    'EMP002', DATEADD(day,-1,GETDATE()),  N'En attente',N'Amira Saidi',      N'Logistique', N'Siège Charguia', N'{"destinataire":"Banque de l''Habitat","objet":"Ouverture de compte"}');

GO
