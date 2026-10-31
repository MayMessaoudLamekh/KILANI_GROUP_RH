import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/motif_model.dart';
import '../models/demande_conge_model.dart';
import '../models/mission_model.dart';
import '../models/attestation_model.dart';
import '../models/ai_chat.dart';

class ApiService {
  // Base URL dynamique (Mac Desktop/iOS: localhost:5050, Android Emulator: 10.0.2.2:5050)
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:5050/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5050/api';
    }
    return 'http://localhost:5050/api';
  }

  static String? _token;

  static Future<void> initToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('jwt_token');
  }

  static Map<String, String> get _headers {
    final map = {'Content-Type': 'application/json'};
    if (_token != null) {
      map['Authorization'] = 'Bearer $_token';
    }
    return map;
  }

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': identifier, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      _token = data['token'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', _token!);
      return {'success': true, 'user': UserModel.fromJson(data['user'])};
    } else {
      return {'success': false, 'message': data['message'] ?? 'Erreur d\'authentification'};
    }
  }

  static Future<void> logout() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }

  static Future<UserModel?> getProfile() async {
    final url = Uri.parse('$baseUrl/users/me');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    }
    return null;
  }

  // ==================== CONGES ====================

  static Future<List<MotifModel>> getMotifs() async {
    final url = Uri.parse('$baseUrl/conges/motifs');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((item) => MotifModel.fromJson(item)).toList();
    }
    return [];
  }

  static Future<Map<String, dynamic>> createDemande({
    required int motifId,
    required String typeConge,
    required String jourDebut,
    required String jourFin,
    String? heureSortie,
    String? heureEntree,
    String? commentaire,
  }) async {
    final url = Uri.parse('$baseUrl/conges/demandes');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'motif_id': motifId,
        'type_conge': typeConge,
        'jour_debut': jourDebut,
        'jour_fin': jourFin,
        'heure_sortie': heureSortie,
        'heure_entree': heureEntree,
        'commentaire': commentaire,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 201) {
      return {'success': true, 'message': data['message']};
    } else {
      return {'success': false, 'message': data['message'] ?? 'Erreur lors de la création'};
    }
  }

  static Future<List<DemandeCongeModel>> getMesDemandes() async {
    final url = Uri.parse('$baseUrl/conges/mes-demandes');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((item) => DemandeCongeModel.fromJson(item)).toList();
    }
    return [];
  }

  static Future<List<DemandeCongeModel>> getDemandesAValider() async {
    final url = Uri.parse('$baseUrl/conges/a-valider');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((item) => DemandeCongeModel.fromJson(item)).toList();
    }
    return [];
  }

  static Future<bool> validerDemande(int congeId, {String? commentaire}) async {
    final url = Uri.parse('$baseUrl/conges/valider');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'conge_id': congeId, 'commentaire': commentaire}),
    );
    return response.statusCode == 200;
  }

  static Future<bool> refuserDemande(int congeId, {String? commentaire}) async {
    final url = Uri.parse('$baseUrl/conges/refuser');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'conge_id': congeId, 'commentaire': commentaire}),
    );
    return response.statusCode == 200;
  }

  // ==================== MISSIONS ====================

  static Future<Map<String, dynamic>> createMission({
    required String objet,
    required String destination,
    required String jourDebut,
    required String jourFin,
    String? heureSortie,
    String? heureEntree,
    String? moyenTransport,
    String? commentaire,
    String? description,
  }) async {
    final url = Uri.parse('$baseUrl/missions/demandes');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'objet': objet,
        'destination': destination,
        'jour_debut': jourDebut,
        'jour_fin': jourFin,
        'heure_sortie': heureSortie,
        'heure_entree': heureEntree,
        'moyen_transport': moyenTransport,
        'commentaire': commentaire,
        'description': description,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 201) {
      return {'success': true, 'message': data['message']};
    } else {
      return {'success': false, 'message': data['message'] ?? 'Erreur lors de la création de la mission'};
    }
  }

  static Future<List<MissionModel>> getMesMissions() async {
    final url = Uri.parse('$baseUrl/missions/mes-demandes');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((item) => MissionModel.fromJson(item)).toList();
    }
    return [];
  }

  static Future<List<MissionModel>> getMissionsAValider() async {
    final url = Uri.parse('$baseUrl/missions/a-valider');
    final response = await http.get(url, headers: _headers);

    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((item) => MissionModel.fromJson(item)).toList();
    }
    return [];
  }

  static Future<bool> validerMission(int missionId, {String? commentaire}) async {
    final url = Uri.parse('$baseUrl/missions/valider');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'mission_id': missionId, 'commentaire': commentaire}),
    );
    return response.statusCode == 200;
  }

  static Future<bool> refuserMission(int missionId, {String? commentaire}) async {
    final url = Uri.parse('$baseUrl/missions/refuser');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'mission_id': missionId, 'commentaire': commentaire}),
    );
    return response.statusCode == 200;
  }

  static Future<bool> annulerMission(int missionId, {String? commentaire}) async {
    final url = Uri.parse('$baseUrl/missions/annuler');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'mission_id': missionId, 'commentaire': commentaire}),
    );
    return response.statusCode == 200;
  }

  // ==========================================
  // ATTESTATIONS
  // ==========================================

  static Future<List<TypeAttestation>> getTypesAttestation() async {
    final url = Uri.parse('$baseUrl/attestations/types');
    final response = await http.get(url, headers: _headers);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => TypeAttestation.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  static Future<List<AttestationModel>> getMesAttestations() async {
    final url = Uri.parse('$baseUrl/attestations/mes-demandes');
    final response = await http.get(url, headers: _headers);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => AttestationModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  static Future<bool> createAttestation({
    required String titreAttestation,
    Map<String, dynamic>? details,
  }) async {
    final url = Uri.parse('$baseUrl/attestations');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'titre_attestation': titreAttestation, 'details': details ?? {}}),
    );
    return response.statusCode == 201;
  }

  static Future<List<AttestationModel>> getAttestationsAValider() async {
    final url = Uri.parse('$baseUrl/attestations/a-valider');
    final response = await http.get(url, headers: _headers);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => AttestationModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  static Future<bool> validerAttestation(int id) async {
    final url = Uri.parse('$baseUrl/attestations/$id/valider');
    final response = await http.post(url, headers: _headers);
    return response.statusCode == 200;
  }

  static Future<bool> refuserAttestation(int id) async {
    final url = Uri.parse('$baseUrl/attestations/$id/refuser');
    final response = await http.post(url, headers: _headers);
    return response.statusCode == 200;
  }

  static Future<bool> genererAttestation(int id) async {
    final url = Uri.parse('$baseUrl/attestations/$id/generer');
    final response = await http.post(url, headers: _headers);
    return response.statusCode == 200;
  }

  static Future<bool> annulerAttestation(int id) async {
    final url = Uri.parse('$baseUrl/attestations/$id');
    final response = await http.delete(url, headers: _headers);
    return response.statusCode == 200;
  }

  /// Retourne l'URL complète pour télécharger le PDF de l'attestation
  static String getAttestationPdfUrl(int id) {
    return '$baseUrl/attestations/$id/pdf';
  }

  /// Retourne le token courant pour les headers d'authentification
  static String? get currentToken => _token;

  // ==========================================
  // INTELLIGENCE ARTIFICIELLE (GEMINI)
  // ==========================================

  static Future<List<AiChat>> getAiChats() async {
    final url = Uri.parse('$baseUrl/ai/chats');
    final response = await http.get(url, headers: _headers);
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((json) => AiChat.fromJson(json)).toList();
    }
    throw Exception('Erreur lors de la récupération des conversations');
  }

  static Future<Map<String, dynamic>> getAiChatDetails(int chatId) async {
    final url = Uri.parse('$baseUrl/ai/chats/$chatId');
    final response = await http.get(url, headers: _headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final chat = AiChat.fromJson(data['chat']);
      final messages = (data['messages'] as List).map((m) => AiMessage.fromJson(m)).toList();
      return {'chat': chat, 'messages': messages};
    }
    throw Exception('Erreur lors de la récupération des messages');
  }

  static Future<void> archiveAiChat(int chatId) async {
    final url = Uri.parse('$baseUrl/ai/chats/$chatId/archive');
    final response = await http.put(url, headers: _headers);
    if (response.statusCode != 200) {
      throw Exception("Erreur lors de l'archivage");
    }
  }

  static Future<void> deleteAiChat(int chatId) async {
    final url = Uri.parse('$baseUrl/ai/chats/$chatId');
    final response = await http.delete(url, headers: _headers);
    if (response.statusCode != 200) {
      throw Exception('Erreur lors de la suppression');
    }
  }

  static Future<Map<String, dynamic>> askAiAssistant(String message, {int? chatId}) async {
    final url = Uri.parse('$baseUrl/ai/chat');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'message': message,
        if (chatId != null) 'chatId': chatId,
      }),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'reply': data['reply'] ?? "Je n'ai pas pu générer de réponse.",
        'chatId': data['chatId'],
      };
    } else if (response.statusCode == 503) {
      throw Exception("L'Assistant RH n'est pas configuré (Clé API manquante sur le serveur).");
    } else {
      throw Exception("Erreur de communication avec l'IA.");
    }
  }

  static Future<String> verifyLeaveWithAi(String startDate, String endDate, String type) async {
    final url = Uri.parse('$baseUrl/ai/verify-leave');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'date_debut': startDate,
        'date_fin': endDate,
        'type_conge': type,
      }),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['analysis'] ?? "";
    } else if (response.statusCode == 503) {
      return "L'IA n'est pas configurée pour l'instant.";
    } else {
      throw Exception('Erreur IA : ${response.body}');
    }
  }
}
