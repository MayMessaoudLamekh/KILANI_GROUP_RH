const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kilani Group - API RH',
      version: '1.0.0',
      description: `
API REST sécurisée pour l'application de Gestion des Ressources Humaines du Groupe Kilani.

**Modules disponibles :**
- 🔐 Authentification & Profil
- 📅 Gestion des Congés (demandes, validation, motifs)
- 🚀 Gestion des Missions (demandes, validation, annulation)

**Authentification :** Toutes les routes protégées nécessitent un token JWT dans le header \`Authorization: Bearer <token>\`.
      `,
      contact: {
        name: 'Équipe IT Kilani Group',
        email: 'admin@kilani.tn',
      },
    },
    servers: [
      {
        url: 'http://localhost:5050',
        description: 'Serveur de développement local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /api/auth/login',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: { type: 'string', description: 'Matricule ou Email', example: 'EMP001' },
            password: { type: 'string', description: 'Mot de passe', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Connexion réussie' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        User: {
          type: 'object',
          properties: {
            matricule: { type: 'string', example: 'EMP001' },
            nom: { type: 'string', example: 'Trabelsi' },
            prenom: { type: 'string', example: 'Youssef' },
            fonction: { type: 'string', example: 'Ingénieur Réseau' },
            site: { type: 'string', example: 'Siège Charguia' },
            service: { type: 'string', example: 'Logistique' },
            Email: { type: 'string', example: 'youssef.trabelsi@kilani.tn' },
            Solde_Conge: { type: 'number', example: 15.0 },
            Droit_Mensuel: { type: 'number', example: 1.75 },
            Etat: { type: 'string', example: 'Actif' },
            Statut: { type: 'string', enum: ['Employé', 'Responsable Hiérarchique', 'Ressources Humaines', 'Administrateur'], example: 'Employé' },
            Societe: { type: 'string', example: 'Kilani Group' },
            superieur_hierarchique: { type: 'string', example: 'MGR001' },
          },
        },
        MotifConge: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            libelle: { type: 'string', example: 'Congé annuel' },
            description: { type: 'string', example: 'Congé payé annuel selon le solde disponible' },
            nombre_max_jours: { type: 'integer', nullable: true, example: null },
            impact_solde: { type: 'boolean', example: true },
            validation_hierarchique_obligatoire: { type: 'boolean', example: true },
            actif: { type: 'boolean', example: true },
          },
        },
        DemandeCongeRequest: {
          type: 'object',
          required: ['motif_id', 'type_conge', 'jour_debut', 'jour_fin'],
          properties: {
            motif_id: { type: 'integer', description: 'ID du motif de congé', example: 1 },
            type_conge: { type: 'string', enum: ['Journée', 'Demi-journée', 'Quart de journée'], example: 'Journée' },
            jour_debut: { type: 'string', format: 'date', example: '2026-08-01' },
            jour_fin: { type: 'string', format: 'date', example: '2026-08-03' },
            heure_sortie: { type: 'string', nullable: true, description: 'Obligatoire pour demi/quart journée', example: '08:00' },
            heure_entree: { type: 'string', nullable: true, description: 'Obligatoire pour demi/quart journée', example: '12:00' },
            commentaire: { type: 'string', nullable: true, example: 'Congé pour événement familial' },
          },
        },
        DemandeConge: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            matricule: { type: 'string', example: 'EMP001' },
            nom_prenom: { type: 'string', example: 'Youssef Trabelsi' },
            site: { type: 'string', example: 'Siège Charguia' },
            Date_emission_demande: { type: 'string', format: 'date-time' },
            type_conge: { type: 'string', example: 'Journée' },
            jour_debut: { type: 'string', format: 'date', example: '2026-08-01' },
            jour_fin: { type: 'string', format: 'date', example: '2026-08-03' },
            nombre_jours: { type: 'number', example: 3.0 },
            nombre_heures: { type: 'number', example: 24.0 },
            acceptation_superieur: { type: 'string', enum: ['En attente', 'Validé', 'Refusé'], example: 'En attente' },
            acceptation_ressource: { type: 'string', enum: ['En attente', 'Validé', 'Refusé'], example: 'En attente' },
            motif_libelle: { type: 'string', example: 'Congé annuel' },
          },
        },
        ValidationRequest: {
          type: 'object',
          required: ['conge_id'],
          properties: {
            conge_id: { type: 'integer', description: 'ID de la demande de congé', example: 1 },
            commentaire: { type: 'string', nullable: true, example: 'Validé, bon repos' },
          },
        },
        DemandeMissionRequest: {
          type: 'object',
          required: ['objet', 'destination', 'jour_debut', 'jour_fin'],
          properties: {
            objet: { type: 'string', description: 'Objet de la mission', example: 'Réunion technique avec le client' },
            destination: { type: 'string', description: 'Destination de la mission', example: 'Sfax' },
            jour_debut: { type: 'string', format: 'date', example: '2026-08-01' },
            jour_fin: { type: 'string', format: 'date', example: '2026-08-02' },
            heure_sortie: { type: 'string', nullable: true, example: '08:00' },
            heure_entree: { type: 'string', nullable: true, example: '18:00' },
            moyen_transport: { type: 'string', nullable: true, enum: ['Voiture personnelle', 'Voiture de service', 'Bus', 'Train', 'Avion', 'Taxi', 'Autre'], example: 'Voiture de service' },
            commentaire: { type: 'string', nullable: true, example: 'Réunion de suivi projet' },
            description: { type: 'string', nullable: true, example: 'Mission technique pour le déploiement réseau' },
          },
        },
        Mission: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            matricule: { type: 'string', example: 'EMP001' },
            nom_prenom: { type: 'string', example: 'Youssef Trabelsi' },
            site: { type: 'string', example: 'Siège Charguia' },
            objet: { type: 'string', example: 'Réunion technique avec le client' },
            destination: { type: 'string', example: 'Sfax' },
            jour_debut: { type: 'string', format: 'date', example: '2026-08-01' },
            jour_fin: { type: 'string', format: 'date', example: '2026-08-02' },
            heure_sortie: { type: 'string', example: '08:00' },
            heure_entree: { type: 'string', example: '18:00' },
            moyen_transport: { type: 'string', example: 'Voiture de service' },
            acceptation_superieur: { type: 'string', enum: ['En attente', 'Validé', 'Refusé'], example: 'En attente' },
            acceptation_ressource: { type: 'string', enum: ['En attente', 'Validé', 'Refusé'], example: 'En attente' },
            Date_emission_demande: { type: 'string', format: 'date-time' },
          },
        },
        MissionValidationRequest: {
          type: 'object',
          required: ['mission_id'],
          properties: {
            mission_id: { type: 'integer', description: 'ID de la demande de mission', example: 1 },
            commentaire: { type: 'string', nullable: true, example: 'Mission validée' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Erreur lors du traitement' },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { background-color: #1E2B37; }
      .swagger-ui .topbar .link { color: #B89B72; }
      .swagger-ui .info h2 { color: #1E2B37; }
    `,
    customSiteTitle: 'Kilani Group - API RH Documentation',
  }));

  // Expose raw JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Documentation Swagger disponible sur http://localhost:5050/api-docs');
}

module.exports = { setupSwagger };
