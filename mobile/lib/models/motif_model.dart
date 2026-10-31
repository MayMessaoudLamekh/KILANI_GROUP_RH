class MotifModel {
  final int id;
  final String libelle;
  final String? description;
  final int? nombreMaxJours;
  final bool impactSolde;
  final bool validationObligatoire;
  final bool actif;

  MotifModel({
    required this.id,
    required this.libelle,
    this.description,
    this.nombreMaxJours,
    required this.impactSolde,
    required this.validationObligatoire,
    required this.actif,
  });

  factory MotifModel.fromJson(Map<String, dynamic> json) {
    return MotifModel(
      id: json['id'],
      libelle: json['libelle'] ?? '',
      description: json['description'],
      nombreMaxJours: json['nombre_max_jours'],
      impactSolde: json['impact_solde'] == true || json['impact_solde'] == 1,
      validationObligatoire: json['validation_hierarchique_obligatoire'] == true || json['validation_hierarchique_obligatoire'] == 1,
      actif: json['actif'] == true || json['actif'] == 1,
    );
  }
}
