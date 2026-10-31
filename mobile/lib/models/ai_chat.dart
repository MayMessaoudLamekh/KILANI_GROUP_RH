class AiChat {
  final int id;
  final String titre;
  final bool isArchived;
  final DateTime dateCreation;
  final DateTime dateMiseAJour;

  AiChat({
    required this.id,
    required this.titre,
    required this.isArchived,
    required this.dateCreation,
    required this.dateMiseAJour,
  });

  factory AiChat.fromJson(Map<String, dynamic> json) {
    return AiChat(
      id: json['id'],
      titre: json['titre'],
      isArchived: json['is_archived'] == 1 || json['is_archived'] == true,
      dateCreation: DateTime.parse(json['date_creation']),
      dateMiseAJour: DateTime.parse(json['date_mise_a_jour']),
    );
  }
}

class AiMessage {
  final int id;
  final int chatId;
  final String role;
  final String content;
  final DateTime dateEnvoi;

  AiMessage({
    required this.id,
    required this.chatId,
    required this.role,
    required this.content,
    required this.dateEnvoi,
  });

  factory AiMessage.fromJson(Map<String, dynamic> json) {
    return AiMessage(
      id: json['id'],
      chatId: json['chat_id'],
      role: json['role'],
      content: json['content'],
      dateEnvoi: DateTime.parse(json['date_envoi']),
    );
  }
}
