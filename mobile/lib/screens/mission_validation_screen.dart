import 'package:flutter/material.dart';
import '../models/mission_model.dart';
import '../services/api_service.dart';

class MissionValidationScreen extends StatefulWidget {
  const MissionValidationScreen({super.key});

  @override
  State<MissionValidationScreen> createState() => _MissionValidationScreenState();
}

class _MissionValidationScreenState extends State<MissionValidationScreen> {
  List<MissionModel> _missions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMissions();
  }

  Future<void> _loadMissions() async {
    setState(() => _isLoading = true);
    final missions = await ApiService.getMissionsAValider();
    setState(() {
      _missions = missions;
      _isLoading = false;
    });
  }

  Future<void> _handleValidation(MissionModel mission, bool isValider) async {
    final commentController = TextEditingController();

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isValider ? 'Valider la mission' : 'Refuser la mission'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Employé: ${mission.nomPrenom ?? mission.matricule}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text('Objet: ${mission.objet}'),
            Text('Destination: ${mission.destination}'),
            const SizedBox(height: 16),
            TextField(
              controller: commentController,
              decoration: const InputDecoration(
                labelText: 'Commentaire (optionnel)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ANNULER'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: isValider ? const Color(0xFF2E7D32) : Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(isValider ? 'VALIDER' : 'REFUSER'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = isValider
          ? await ApiService.validerMission(mission.id, commentaire: commentController.text.trim())
          : await ApiService.refuserMission(mission.id, commentaire: commentController.text.trim());

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isValider ? 'Mission validée avec succès' : 'Mission refusée'),
            backgroundColor: isValider ? const Color(0xFF2E7D32) : Colors.orange,
          ),
        );
        _loadMissions();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Erreur lors du traitement'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Validation des Missions'),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1E2B37)))
          : _missions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.assignment_turned_in, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'Aucune mission à valider',
                        style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadMissions,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _missions.length,
                    itemBuilder: (context, index) {
                      final mission = _missions[index];
                      final isEnAttente = mission.acceptationSuperieur == 'En attente';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: Colors.grey[200]!),
                        ),
                        elevation: 3,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top info: Employé + Site
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          mission.nomPrenom ?? mission.matricule,
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF1E2B37),
                                          ),
                                        ),
                                        Text(
                                          'Site: ${mission.site ?? "Non spécifié"} • Mat: ${mission.matricule}',
                                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isEnAttente ? Colors.orange.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      mission.acceptationSuperieur,
                                      style: TextStyle(
                                        color: isEnAttente ? Colors.orange[800] : Colors.green[800],
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const Divider(height: 24),

                              // Mission Details
                              Row(
                                children: [
                                  const Icon(Icons.card_travel, size: 18, color: Color(0xFFB89B72)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      mission.objet,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 18, color: Color(0xFFB89B72)),
                                  const SizedBox(width: 8),
                                  Text(
                                    mission.destination,
                                    style: TextStyle(fontSize: 14, color: Colors.grey[800]),
                                  ),
                                  const SizedBox(width: 16),
                                  const Icon(Icons.calendar_today, size: 18, color: Color(0xFFB89B72)),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${mission.jourDebut} → ${mission.jourFin}',
                                    style: TextStyle(fontSize: 14, color: Colors.grey[800]),
                                  ),
                                ],
                              ),

                              if (mission.moyenTransport != null) ...[
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(Icons.directions_car, size: 18, color: Color(0xFFB89B72)),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Transport: ${mission.moyenTransport}',
                                      style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                                    ),
                                  ],
                                ),
                              ],

                              if (mission.description != null && mission.description!.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    mission.description!,
                                    style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                                  ),
                                ),
                              ],

                              if (isEnAttente) ...[
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: () => _handleValidation(mission, false),
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: Colors.red,
                                          side: const BorderSide(color: Colors.red),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                        icon: const Icon(Icons.close, size: 18),
                                        label: const Text('REFUSER'),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        onPressed: () => _handleValidation(mission, true),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF2E7D32),
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                        icon: const Icon(Icons.check, size: 18),
                                        label: const Text('VALIDER'),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
