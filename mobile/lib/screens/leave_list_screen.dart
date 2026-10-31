import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/demande_conge_model.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'create_leave_screen.dart';

class LeaveListScreen extends StatefulWidget {
  final UserModel currentUser;

  const LeaveListScreen({super.key, required this.currentUser});

  @override
  State<LeaveListScreen> createState() => _LeaveListScreenState();
}

class _LeaveListScreenState extends State<LeaveListScreen> {
  List<DemandeCongeModel> _demandes = [];
  bool _isLoading = true;
  String _filter = 'Toutes'; // Toutes, En attente, Validé, Refusé

  @override
  void initState() {
    super.initState();
    _loadDemandes();
  }

  Future<void> _loadDemandes() async {
    final list = await ApiService.getMesDemandes();
    if (mounted) {
      setState(() {
        _demandes = list;
        _isLoading = false;
      });
    }
  }

  List<DemandeCongeModel> get _filteredDemandes {
    if (_filter == 'Toutes') return _demandes;
    return _demandes.where((d) => d.acceptationSuperieur == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'leave_fab',
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => CreateLeaveScreen(
                currentUser: widget.currentUser,
                onSuccess: () {},
              ),
            ),
          );
          _loadDemandes();
        },
        backgroundColor: AppTheme.accentGold,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Nouveau Congé', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadDemandes,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.history_rounded, color: AppTheme.accentGold, size: 28),
                SizedBox(width: 10),
                Text(
                  'Historique de mes Demandes',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['Toutes', 'En attente', 'Validé', 'Refusé'].map((label) {
                  final isSelected = _filter == label;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(label),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) setState(() => _filter = label);
                      },
                      selectedColor: AppTheme.primaryNavy,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.primaryNavy,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _filteredDemandes.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.inbox_rounded, color: Colors.grey, size: 50),
                              SizedBox(height: 12),
                              Text('Aucune demande trouvée', style: TextStyle(color: Colors.grey, fontSize: 16)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: _filteredDemandes.length,
                          itemBuilder: (context, index) {
                            final d = _filteredDemandes[index];

                            Color statusColor = AppTheme.statusPending;
                            if (d.acceptationSuperieur == 'Validé') statusColor = AppTheme.statusApproved;
                            if (d.acceptationSuperieur == 'Refusé') statusColor = AppTheme.statusRejected;

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ExpansionTile(
                                leading: CircleAvatar(
                                  backgroundColor: statusColor.withOpacity(0.15),
                                  child: Icon(
                                    d.acceptationSuperieur == 'Validé'
                                        ? Icons.check_circle_rounded
                                        : (d.acceptationSuperieur == 'Refusé' ? Icons.cancel_rounded : Icons.hourglass_top_rounded),
                                    color: statusColor,
                                  ),
                                ),
                                title: Text(
                                  d.motifLibelle,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                subtitle: Text(
                                  'Du ${d.jourDebut} au ${d.jourFin} (${d.nombreJours}j)',
                                  style: const TextStyle(fontSize: 13),
                                ),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusColor.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    d.acceptationSuperieur,
                                    style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                ),
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Divider(),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            const Text('Type de durée :', style: TextStyle(fontWeight: FontWeight.bold)),
                                            Text(d.typeConge),
                                          ],
                                        ),
                                        if (d.heureSortie != null) ...[
                                          const SizedBox(height: 6),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              const Text('Heures sortie/entrée :'),
                                              Text('${d.heureSortie} ➔ ${d.heureEntree}'),
                                            ],
                                          ),
                                        ],
                                        if (d.commentaire != null && d.commentaire!.isNotEmpty) ...[
                                          const SizedBox(height: 6),
                                          Text('Commentaire : ${d.commentaire}', style: const TextStyle(fontStyle: FontStyle.italic)),
                                        ],
                                        if (d.commentaireSuperieur != null && d.commentaireSuperieur!.isNotEmpty) ...[
                                          const SizedBox(height: 6),
                                          Container(
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(
                                              color: Colors.grey.shade100,
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              'Note du Responsable : ${d.commentaireSuperieur}',
                                              style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
