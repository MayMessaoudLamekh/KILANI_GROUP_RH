import 'package:flutter/material.dart';
import '../models/mission_model.dart';
import '../services/api_service.dart';
import 'create_mission_screen.dart';

class MissionListScreen extends StatefulWidget {
  const MissionListScreen({super.key});

  @override
  State<MissionListScreen> createState() => _MissionListScreenState();
}

class _MissionListScreenState extends State<MissionListScreen> {
  List<MissionModel> _missions = [];
  bool _isLoading = true;
  String _selectedFilter = 'Toutes';

  final List<String> _filters = ['Toutes', 'En attente', 'Validé', 'Refusé'];

  @override
  void initState() {
    super.initState();
    _loadMissions();
  }

  Future<void> _loadMissions() async {
    setState(() => _isLoading = true);
    final missions = await ApiService.getMesMissions();
    setState(() {
      _missions = missions;
      _isLoading = false;
    });
  }

  List<MissionModel> get _filteredMissions {
    if (_selectedFilter == 'Toutes') return _missions;
    return _missions.where((m) => m.acceptationSuperieur == _selectedFilter).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Validé':
        return const Color(0xFF2E7D32);
      case 'Refusé':
        return const Color(0xFFC62828);
      case 'Annulé':
        return Colors.purple;
      case 'En attente':
      default:
        return const Color(0xFFE65100);
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Validé':
        return Icons.check_circle_outline;
      case 'Refusé':
        return Icons.cancel_outlined;
      case 'Annulé':
        return Icons.block;
      case 'En attente':
      default:
        return Icons.access_time;
    }
  }

  void _showMissionDetail(MissionModel mission) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E2B37).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.card_travel, color: Color(0xFF1E2B37), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mission.objet,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E2B37),
                        ),
                      ),
                      Text(
                        'Destination: ${mission.destination}',
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(mission.acceptationSuperieur).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    mission.acceptationSuperieur,
                    style: TextStyle(
                      color: _getStatusColor(mission.acceptationSuperieur),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: 32),

            _buildDetailRow(Icons.calendar_today, 'Dates', 'Du ${mission.jourDebut} au ${mission.jourFin} (${mission.nombreJours} jours)'),
            if (mission.heureSortie != null && mission.heureEntree != null)
              _buildDetailRow(Icons.access_time, 'Horaires', 'Sortie: ${mission.heureSortie} - Retour: ${mission.heureEntree}'),
            if (mission.moyenTransport != null)
              _buildDetailRow(Icons.directions_car, 'Transport', mission.moyenTransport!),
            if (mission.description != null && mission.description!.isNotEmpty)
              _buildDetailRow(Icons.description, 'Description', mission.description!),
            if (mission.commentaire != null && mission.commentaire!.isNotEmpty)
              _buildDetailRow(Icons.comment, 'Commentaire', mission.commentaire!),
            if (mission.commentaireSuperieur != null)
              _buildDetailRow(Icons.rate_review, 'Avis supérieur', mission.commentaireSuperieur!),

            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2B37),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('FERMER'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: const Color(0xFFB89B72)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF1E2B37))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Demandes de Mission'),
        backgroundColor: const Color(0xFF1E2B37),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMissions,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'mission_fab',
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CreateMissionScreen()),
          );
          if (result == true) {
            _loadMissions();
          }
        },
        backgroundColor: const Color(0xFF1E2B37),
        foregroundColor: const Color(0xFFB89B72),
        icon: const Icon(Icons.add),
        label: const Text('Nouvelle Mission', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _filters.length,
              itemBuilder: (context, index) {
                final filter = _filters[index];
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(filter),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() => _selectedFilter = filter);
                    },
                    selectedColor: const Color(0xFF1E2B37),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF1E2B37),
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    checkmarkColor: Colors.white,
                    backgroundColor: Colors.grey[100],
                  ),
                );
              },
            ),
          ),

          // Mission List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF1E2B37)))
                : _filteredMissions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.card_travel, size: 64, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text(
                              'Aucune demande de mission trouvée',
                              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadMissions,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredMissions.length,
                          itemBuilder: (context, index) {
                            final mission = _filteredMissions[index];
                            final statusColor = _getStatusColor(mission.acceptationSuperieur);

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(color: Colors.grey[200]!),
                              ),
                              elevation: 2,
                              child: InkWell(
                                onTap: () => _showMissionDetail(mission),
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              mission.objet,
                                              style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF1E2B37),
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: statusColor.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(20),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(_getStatusIcon(mission.acceptationSuperieur), size: 14, color: statusColor),
                                                const SizedBox(width: 4),
                                                Text(
                                                  mission.acceptationSuperieur,
                                                  style: TextStyle(
                                                    color: statusColor,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Icon(Icons.location_on_outlined, size: 16, color: Colors.grey[600]),
                                          const SizedBox(width: 4),
                                          Text(
                                            mission.destination,
                                            style: TextStyle(fontSize: 13, color: Colors.grey[700], fontWeight: FontWeight.w500),
                                          ),
                                          const SizedBox(width: 16),
                                          Icon(Icons.calendar_today_outlined, size: 16, color: Colors.grey[600]),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${mission.jourDebut} → ${mission.jourFin}',
                                            style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                                          ),
                                        ],
                                      ),
                                      if (mission.moyenTransport != null) ...[
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            Icon(Icons.directions_car_outlined, size: 16, color: Colors.grey[600]),
                                            const SizedBox(width: 4),
                                            Text(
                                              mission.moyenTransport!,
                                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
