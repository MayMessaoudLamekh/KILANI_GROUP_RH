class UserModel {
  final String matricule;
  final String nom;
  final String prenom;
  final String? fonction;
  final String? site;
  final String? service;
  final String email;
  final double soldeConge;
  final double droitMensuel;
  final String etat;
  final String statut;
  final String societe;
  final String? superieurHierarchique;
  final String? superieurNom;
  final String? superieurPrenom;

  UserModel({
    required this.matricule,
    required this.nom,
    required this.prenom,
    this.fonction,
    this.site,
    this.service,
    required this.email,
    required this.soldeConge,
    required this.droitMensuel,
    required this.etat,
    required this.statut,
    required this.societe,
    this.superieurHierarchique,
    this.superieurNom,
    this.superieurPrenom,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      matricule: json['matricule'] ?? '',
      nom: json['nom'] ?? '',
      prenom: json['prenom'] ?? '',
      fonction: json['fonction'],
      site: json['site'],
      service: json['service'],
      email: json['Email'] ?? json['email'] ?? '',
      soldeConge: (json['Solde_Conge'] != null) ? double.parse(json['Solde_Conge'].toString()) : 0.0,
      droitMensuel: (json['Droit_Mensuel'] != null) ? double.parse(json['Droit_Mensuel'].toString()) : 1.75,
      etat: json['Etat'] ?? 'Actif',
      statut: json['Statut'] ?? 'Employé',
      societe: json['Societe'] ?? 'Kilani Group',
      superieurHierarchique: json['superieur_hierarchique'],
      superieurNom: json['superieur_nom'],
      superieurPrenom: json['superieur_prenom'],
    );
  }

  String get fullName => '$prenom $nom';
  bool get isManagerOrRh => statut == 'Responsable Hiérarchique' || statut == 'Ressources Humaines' || statut == 'Administrateur';
}
