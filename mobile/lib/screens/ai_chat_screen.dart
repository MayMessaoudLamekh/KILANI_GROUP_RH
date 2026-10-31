import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/ai_chat.dart';
import '../theme/app_theme.dart';

// Local chat message representation (with text + isUser flag)
class _ChatMsg {
  final String text;
  final bool isUser;
  _ChatMsg(this.text, this.isUser);
}

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // État
  List<_ChatMsg> _messages = [];
  bool _isLoading = false;
  bool _isLoadingChats = false;
  List<AiChat> _allChats = [];
  int? _activeChatId;
  String _activeChatTitle = 'Nouvelle discussion';

  @override
  void initState() {
    super.initState();
    _startNewConversation(showWelcome: true);
    _loadChats();
  }

  void _startNewConversation({bool showWelcome = false}) {
    setState(() {
      _activeChatId = null;
      _activeChatTitle = 'Nouvelle discussion';
      _messages = [];
      if (showWelcome) {
        _messages.add(_ChatMsg(
          "Bonjour ! Je suis votre Assistant RH virtuel Kilani Group. Comment puis-je vous aider aujourd'hui ?\n\n(Ex: Quel est mon solde de congé ?, Qui est mon manager ?)",
          false,
        ));
      }
    });
    // Fermer le drawer s'il est ouvert
    _scaffoldKey.currentState?.closeDrawer();
  }

  Future<void> _loadChats() async {
    if (!mounted) return;
    setState(() => _isLoadingChats = true);
    try {
      final chats = await ApiService.getAiChats();
      if (!mounted) return;
      setState(() {
        _allChats = chats;
        _isLoadingChats = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingChats = false);
    }
  }

  Future<void> _loadChat(AiChat chat) async {
    _scaffoldKey.currentState?.closeDrawer();
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _messages = [];
      _activeChatId = chat.id;
      _activeChatTitle = chat.titre;
    });

    try {
      final details = await ApiService.getAiChatDetails(chat.id);
      final msgs = details['messages'] as List<AiMessage>;
      if (!mounted) return;
      setState(() {
        _messages = msgs.map((m) => _ChatMsg(m.content, m.role == 'user')).toList();
        _isLoading = false;
      });
      _scrollToBottom();
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  Future<void> _archiveChat(AiChat chat) async {
    try {
      await ApiService.archiveAiChat(chat.id);
      _showSnack('Conversation archivée', icon: Icons.archive_outlined);
      if (_activeChatId == chat.id) {
        _startNewConversation(showWelcome: true);
      }
      _loadChats();
    } catch (_) {
      _showSnack('Erreur lors de l\'archivage', isError: true);
    }
  }

  Future<void> _deleteChat(AiChat chat) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Supprimer la conversation ?'),
        content: Text('La conversation "${chat.titre}" sera définitivement supprimée.'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiService.deleteAiChat(chat.id);
      _showSnack('Conversation supprimée', icon: Icons.delete_outline);
      if (_activeChatId == chat.id) {
        _startNewConversation(showWelcome: true);
      }
      _loadChats();
    } catch (_) {
      _showSnack('Erreur lors de la suppression', isError: true);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading) return;

    if (!mounted) return;
    setState(() {
      _messages.add(_ChatMsg(text, true));
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final result = await ApiService.askAiAssistant(text, chatId: _activeChatId);
      final reply = result['reply'] as String;
      final newChatId = result['chatId'] as int?;
      if (!mounted) return;
      setState(() {
        if (_activeChatId == null && newChatId != null) {
          _activeChatId = newChatId;
          _activeChatTitle = text.length > 30 ? '${text.substring(0, 30)}...' : text;
        }
        _messages.add(_ChatMsg(reply, false));
        _isLoading = false;
      });
      // Refresh sidebar list if this was a new chat
      if (newChatId != null) _loadChats();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add(_ChatMsg("Erreur: ${e.toString().replaceAll('Exception: ', '')}", false));
        _isLoading = false;
      });
    }
    _scrollToBottom();
  }

  void _showSnack(String msg, {IconData? icon, bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          if (icon != null) Icon(icon, color: Colors.white, size: 18),
          if (icon != null) const SizedBox(width: 8),
          Text(msg),
        ],
      ),
      backgroundColor: isError ? Colors.red.shade700 : AppTheme.primaryNavy,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  // ───────────────────────── DRAWER ─────────────────────────
  Widget _buildDrawer() {
    final activeChats = _allChats.where((c) => !c.isArchived).toList();
    final archivedChats = _allChats.where((c) => c.isArchived).toList();

    return Drawer(
      backgroundColor: AppTheme.secondaryNavy,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 54, 16, 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primaryNavy, AppTheme.secondaryNavy],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                  ),
                  child: const Icon(Icons.auto_awesome, color: AppTheme.accentGold, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Assistant RH', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Historique des discussions', style: TextStyle(color: Colors.white60, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // New chat button
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  _startNewConversation(showWelcome: true);
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.5)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.add, color: AppTheme.accentGold, size: 20),
                      SizedBox(width: 8),
                      Text('Nouvelle discussion', style: TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Conversations list
          Expanded(
            child: _isLoadingChats
                ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold))
                : ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    children: [
                      if (activeChats.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          child: Text('Conversations', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1)),
                        ),
                        ...activeChats.map((chat) => _buildChatTile(chat, archived: false)),
                      ],
                      if (archivedChats.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          child: Text('Archivées', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1)),
                        ),
                        ...archivedChats.map((chat) => _buildChatTile(chat, archived: true)),
                      ],
                      if (_allChats.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.chat_bubble_outline, color: Colors.white24, size: 40),
                                const SizedBox(height: 8),
                                const Text('Aucune conversation', style: TextStyle(color: Colors.white38, fontSize: 13)),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatTile(AiChat chat, {required bool archived}) {
    final isActive = chat.id == _activeChatId;
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isActive ? AppTheme.accentGold.withValues(alpha: 0.15) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: isActive ? Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)) : null,
      ),
      child: ListTile(
        dense: true,
        onTap: () => _loadChat(chat),
        leading: Icon(
          archived ? Icons.archive_outlined : Icons.chat_bubble_outline,
          color: isActive ? AppTheme.accentGold : Colors.white38,
          size: 18,
        ),
        title: Text(
          chat.titre,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: isActive ? AppTheme.accentGold : Colors.white70,
            fontSize: 13,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        subtitle: Text(
          _formatDate(chat.dateMiseAJour),
          style: const TextStyle(color: Colors.white30, fontSize: 10),
        ),
        trailing: PopupMenuButton<String>(
          icon: Icon(Icons.more_vert, color: Colors.white30, size: 18),
          color: AppTheme.primaryNavy,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          onSelected: (value) {
            if (value == 'archive') _archiveChat(chat);
            if (value == 'delete') _deleteChat(chat);
            if (value == 'open') _loadChat(chat);
          },
          itemBuilder: (_) => [
            const PopupMenuItem(
              value: 'open',
              child: Row(children: [
                Icon(Icons.open_in_full, color: Colors.white70, size: 16),
                SizedBox(width: 8),
                Text('Ouvrir', style: TextStyle(color: Colors.white70)),
              ]),
            ),
            if (!archived)
              const PopupMenuItem(
                value: 'archive',
                child: Row(children: [
                  Icon(Icons.archive_outlined, color: Colors.white70, size: 16),
                  SizedBox(width: 8),
                  Text('Archiver', style: TextStyle(color: Colors.white70)),
                ]),
              ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(children: [
                Icon(Icons.delete_outline, color: Colors.red, size: 16),
                SizedBox(width: 8),
                Text('Supprimer', style: TextStyle(color: Colors.red)),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours} h';
    if (diff.inDays == 1) return 'Hier';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  // ───────────────────────── MESSAGE BUBBLE ─────────────────────────
  Widget _buildMessage(_ChatMsg msg) {
    return Align(
      alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5, horizontal: 12),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
        decoration: BoxDecoration(
          color: msg.isUser ? AppTheme.accentGold : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(msg.isUser ? 16 : 0),
            bottomRight: Radius.circular(msg.isUser ? 0 : 16),
          ),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 5, offset: const Offset(0, 2)),
          ],
        ),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        child: Text(
          msg.text,
          style: TextStyle(
            color: msg.isUser ? Colors.white : AppTheme.primaryNavy,
            fontSize: 14,
            height: 1.45,
          ),
        ),
      ),
    );
  }

  // ───────────────────────── BUILD ─────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF4F4F8),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.auto_awesome, color: AppTheme.accentGold, size: 18),
                SizedBox(width: 6),
                Text('Assistant RH', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              ],
            ),
            Text(
              _activeChatTitle,
              style: const TextStyle(fontSize: 11, color: Colors.white60, fontWeight: FontWeight.normal),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        backgroundColor: AppTheme.primaryNavy,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          tooltip: 'Historique des discussions',
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            onPressed: () => _startNewConversation(showWelcome: true),
            tooltip: 'Nouvelle discussion',
          ),
        ],
      ),
      drawer: _buildDrawer(),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(vertical: 16),
              itemCount: _messages.length,
              itemBuilder: (context, i) => _buildMessage(_messages[i]),
            ),
          ),
          if (_isLoading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              alignment: Alignment.centerLeft,
              child: const Row(
                children: [
                  SizedBox(
                    width: 16, height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.accentGold),
                  ),
                  SizedBox(width: 8),
                  Text("L'assistant réfléchit...", style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -2))],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      maxLines: null,
                      keyboardType: TextInputType.multiline,
                      decoration: InputDecoration(
                        hintText: 'Posez votre question...',
                        hintStyle: TextStyle(color: Colors.grey.shade400),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppTheme.primaryNavy,
                    radius: 22,
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 18),
                      onPressed: _isLoading ? null : _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
