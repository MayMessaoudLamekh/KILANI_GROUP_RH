class DemandeCongeModel {
  final int id;
  final String matricule;
  final String? nomPrenom;
  final String? site;
  final String? dateEmission;
  final String typeConge;
  final String jourDebut;
  final String jourFin;
  final String? heureSortie;
  final String? heureEntree;
  final double nombreJours;
  final double nombreHeures;
  final String? commentaire;
  final String acceptationSuperieur;
  final String acceptationRessource;
  final String? dateValidationSuperieur;
  final String? commentaireSuperieur;
  final String motifLibelle;
  final bool? impactSolde;
  final String? employeEmail;
  final double? soldeCongeMoment;

  DemandeCongeModel({
    required this.id,
    required this.matricule,
    this.nomPrenom,
    this.site,
    this.dateEmission,
    required this.typeConge,
    required this.jourDebut,
    required this.jourFin,
    this.heureSortie,
    this.heureEntree,
    required this.nombreJours,
    required this.nombreHeures,
    this.commentaire,
    required this.acceptationSuperieur,
    required this.acceptationRessource,
    this.dateValidationSuperieur,
    this.commentaireSuperieur,
    required this.motifLibelle,
    this.impactSolde,
    this.employeEmail,
    this.soldeCongeMoment,
  });

  factory DemandeCongeModel.fromJson(Map<String, dynamic> json) {
    return DemandeCongeModel(
      id: json['id'],
      matricule: json['matricule'] ?? '',
      nomPrenom: json['nom_prenom'],
      site: json['site'],
      dateEmission: json['Date_emission_demande']?.toString(),
      typeConge: json['type_conge'] ?? 'Journée',
      jourDebut: json['jour_debut']?.toString().split('T')[0] ?? '',
      jourFin: json['jour_fin']?.toString().split('T')[0] ?? '',
      heureSortie: json['heure_sortie'],
      heureEntree: json['heure_entree'],
      nombreJours: (json['nombre_jours'] != null) ? double.parse(json['nombre_jours'].toString()) : 0.0,
      nombreHeures: (json['nombre_heures'] != null) ? double.parse(json['nombre_heures'].toString()) : 0.0,
      commentaire: json['commentaire'],
      acceptationSuperieur: json['acceptation_superieur'] ?? 'En attente',
      acceptationRessource: json['acceptation_ressource'] ?? 'En attente',
      dateValidationSuperieur: json['Date_validation_superieur']?.toString(),
      commentaireSuperieur: json['commentaire_superieur'],
      motifLibelle: json['motif_libelle'] ?? 'Congé',
      impactSolde: json['impact_solde'] == true || json['impact_solde'] == 1,
      employeEmail: json['employe_email'],
      soldeCongeMoment: (json['Solde_Conge_Moment'] != null) ? double.parse(json['Solde_Conge_Moment'].toString()) : null,
    );
  }
}
