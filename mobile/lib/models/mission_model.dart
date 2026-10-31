class MissionModel {
  final int id;
  final String matricule;
  final String? nomPrenom;
  final String? site;
  final String? dateEmission;
  final String objet;
  final String destination;
  final String jourDebut;
  final String jourFin;
  final String? heureSortie;
  final String? heureEntree;
  final String? moyenTransport;
  final String? commentaire;
  final String? description;
  final String acceptationSuperieur;
  final String acceptationRessource;
  final String? dateValidationSuperieur;
  final String? commentaireSuperieur;
  final bool annulationSuperieur;
  final String? dateAnnulationSuperieur;
  final String? employeEmail;

  MissionModel({
    required this.id,
    required this.matricule,
    this.nomPrenom,
    this.site,
    this.dateEmission,
    required this.objet,
    required this.destination,
    required this.jourDebut,
    required this.jourFin,
    this.heureSortie,
    this.heureEntree,
    this.moyenTransport,
    this.commentaire,
    this.description,
    required this.acceptationSuperieur,
    required this.acceptationRessource,
    this.dateValidationSuperieur,
    this.commentaireSuperieur,
    this.annulationSuperieur = false,
    this.dateAnnulationSuperieur,
    this.employeEmail,
  });

  factory MissionModel.fromJson(Map<String, dynamic> json) {
    return MissionModel(
      id: json['id'],
      matricule: json['matricule'] ?? '',
      nomPrenom: json['nom_prenom'],
      site: json['site'],
      dateEmission: json['Date_emission_demande']?.toString(),
      objet: json['objet'] ?? '',
      destination: json['destination'] ?? '',
      jourDebut: json['jour_debut']?.toString().split('T')[0] ?? '',
      jourFin: json['jour_fin']?.toString().split('T')[0] ?? '',
      heureSortie: json['heure_sortie'],
      heureEntree: json['heure_entree'],
      moyenTransport: json['moyen_transport'],
      commentaire: json['commentaire'],
      description: json['Description'],
      acceptationSuperieur: json['acceptation_superieur'] ?? 'En attente',
      acceptationRessource: json['acceptation_ressource'] ?? 'En attente',
      dateValidationSuperieur: json['Date_validation_superieur']?.toString(),
      commentaireSuperieur: json['commentaire_superieur'],
      annulationSuperieur: json['annulation_superieur'] == true || json['annulation_superieur'] == 1,
      dateAnnulationSuperieur: json['Date_annulation_superieur']?.toString(),
      employeEmail: json['employe_email'],
    );
  }

  /// Calcule le nombre de jours de la mission
  int get nombreJours {
    try {
      final start = DateTime.parse(jourDebut);
      final end = DateTime.parse(jourFin);
      return end.difference(start).inDays + 1;
    } catch (_) {
      return 0;
    }
  }
}
