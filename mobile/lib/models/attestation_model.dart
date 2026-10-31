import 'dart:convert';

/// Model for an attestation type (lookup table)
class TypeAttestation {
  final int id;
  final String code;
  final String libelle;
  final String? description;
  final List<Map<String, dynamic>> champsComplementaires;
  final bool validationRhRequise;
  final bool actif;

  TypeAttestation({
    required this.id,
    required this.code,
    required this.libelle,
    this.description,
    required this.champsComplementaires,
    required this.validationRhRequise,
    required this.actif,
  });

  factory TypeAttestation.fromJson(Map<String, dynamic> json) {
    List<Map<String, dynamic>> champs = [];
    try {
      final raw = json['champs_complementaires'];
      if (raw != null && raw.toString().isNotEmpty) {
        final decoded = raw is String ? jsonDecode(raw) : raw;
        if (decoded is List) {
          champs = List<Map<String, dynamic>>.from(decoded.map((e) => Map<String, dynamic>.from(e as Map)));
        }
      }
    } catch (_) {}

    bool parseBool(dynamic value) {
      if (value is bool) return value;
      if (value is int) return value == 1;
      if (value is String) return value == '1' || value.toLowerCase() == 'true';
      return false;
    }

    return TypeAttestation(
      id: json['id'] as int,
      code: json['code'] as String,
      libelle: json['libelle'] as String,
      description: json['description'] as String?,
      champsComplementaires: champs,
      validationRhRequise: parseBool(json['validation_rh_requise']),
      actif: parseBool(json['actif'] ?? true),
    );
  }
}

/// Model for an attestation request
class AttestationModel {
  final int id;
  final String intitule;
  final String titreAttestation;
  final String matricule;
  final String? datetime;
  final String? approbateurDemande;
  final String? approbateurDemandeNom;
  final String etatDemande;
  final String? nomPrenom;
  final String? service;
  final String? approbateurRH;
  final String? approbateurRhNom;
  final String? site;
  final Map<String, dynamic> details;
  final String? pdfUrl;

  AttestationModel({
    required this.id,
    required this.intitule,
    required this.titreAttestation,
    required this.matricule,
    this.datetime,
    this.approbateurDemande,
    this.approbateurDemandeNom,
    required this.etatDemande,
    this.nomPrenom,
    this.service,
    this.approbateurRH,
    this.approbateurRhNom,
    this.site,
    required this.details,
    this.pdfUrl,
  });

  factory AttestationModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> det = {};
    try {
      final raw = json['Details'];
      if (raw != null && raw.toString().isNotEmpty) {
        final decoded = raw is String ? jsonDecode(raw) : raw;
        if (decoded is Map) {
          det = Map<String, dynamic>.from(decoded);
        }
      }
    } catch (_) {}

    return AttestationModel(
      id: json['id'] as int,
      intitule: json['Intitule'] as String? ?? '',
      titreAttestation: json['titre_attestation'] as String? ?? '',
      matricule: json['matricule'] as String? ?? '',
      datetime: json['Datetime']?.toString(),
      approbateurDemande: json['Approbateur_demande'] as String?,
      approbateurDemandeNom: json['approbateur_demande_nom'] as String?,
      etatDemande: json['etat_demande'] as String? ?? 'En attente',
      nomPrenom: json['nom_prenom'] as String?,
      service: json['service'] as String?,
      approbateurRH: json['Approbateur_RH'] as String?,
      approbateurRhNom: json['approbateur_rh_nom'] as String?,
      site: json['site'] as String?,
      details: det,
      pdfUrl: json['pdf_url'] as String?,
    );
  }
}
