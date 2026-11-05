import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../models/demande_conge_model.dart';
import '../models/mission_model.dart';
import '../services/api_service.dart';
import 'create_mission_screen.dart';
import 'mission_list_screen.dart';
import 'mission_validation_screen.dart';
import 'create_leave_screen.dart';

class DashboardScreen extends StatefulWidget {
  final UserModel currentUser;
  final Function(int) onNavigate;

  const DashboardScreen({
    super.key,
    required this.currentUser,
    required this.onNavigate,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late UserModel _user;
  List<DemandeCongeModel> _recentDemandes = [];
  List<MissionModel> _recentMissions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _user = widget.currentUser;
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final profile = await ApiService.getProfile();
    final demandes = await ApiService.getMesDemandes();
    final missions = await ApiService.getMesMissions();

    if (mounted) {
      setState(() {
        if (profile != null) _user = profile;
        _recentDemandes = demandes.take(3).toList();
        _recentMissions = missions.take(3).toList();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Greeting Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryNavy, AppTheme.secondaryNavy],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppTheme.accentGold,
                    child: Text(
                      _user.prenom.isNotEmpty ? _user.prenom[0].toUpperCase() : 'U',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bonjour, ${_user.fullName}',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '${_user.fonction ?? 'Employé'} • ${_user.site ?? 'Kilani Group'}',
                          style: const TextStyle(color: AppTheme.accentGold, fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Matricule : ${_user.matricule} • Rôle : ${_user.statut}',
                            style: const TextStyle(color: Colors.white, fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Modules Shortcuts (Congés & Missions)
            Row(
              children: [
                Expanded(
                  child: Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.beach_access_rounded, color: AppTheme.accentGold, size: 24),
                              SizedBox(width: 8),
                              Text('Solde Congé', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                _user.soldeConge.toStringAsFixed(1),
                                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                              ),
                              const SizedBox(width: 4),
                              const Text('j', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.accentGold)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            height: 36,
                            child: ElevatedButton(
                              onPressed: () async {
                                final res = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => CreateLeaveScreen(
                                      currentUser: widget.currentUser,
                                      onSuccess: () {},
                                    ),
                                  ),
                                );
                                // Si besoin de rafraichir
                                _loadDashboardData();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.accentGold,
                                padding: EdgeInsets.zero,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text('DEMANDER CONGÉ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Card(
                    elevation: 3,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.card_travel_rounded, color: AppTheme.primaryNavy, size: 24),
                              SizedBox(width: 8),
                              Text('Missions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                _recentMissions.length.toString(),
                                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                              ),
                              const SizedBox(width: 4),
                              const Text('récentes', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            height: 36,
                            child: ElevatedButton(
                              onPressed: () async {
                                final res = await Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (context) => const CreateMissionScreen()),
                                );
                                if (res == true) _loadDashboardData();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryNavy,
                                foregroundColor: Colors.white,
                                padding: EdgeInsets.zero,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text('NOUVELLE MISSION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Quick Actions Banner for Manager/RH
            if (_user.isManagerOrRh) ...[
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => widget.onNavigate(4),
                      child: Card(
                        color: AppTheme.lightGold,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        child: const Padding(
                          padding: EdgeInsets.all(14.0),
                          child: Row(
                            children: [
                              Icon(Icons.fact_check_rounded, color: AppTheme.darkGold, size: 28),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Validation Congés', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.darkGold)),
                                    Text('Valider les congés d\'équipe', style: TextStyle(fontSize: 11, color: AppTheme.darkGold)),
                                  ],
                                ),
                              ),
                              Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.darkGold),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: GestureDetector(
                      onTap: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const MissionValidationScreen()),
                        );
                        _loadDashboardData();
                      },
                      child: Card(
                        color: AppTheme.primaryNavy.withOpacity(0.1),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        child: const Padding(
                          padding: EdgeInsets.all(14.0),
                          child: Row(
                            children: [
                              Icon(Icons.assignment_turned_in, color: AppTheme.primaryNavy, size: 28),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Validation Missions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryNavy)),
                                    Text('Valider les ord. de mission', style: TextStyle(fontSize: 11, color: AppTheme.primaryNavy)),
                                  ],
                                ),
                              ),
                              Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.primaryNavy),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],

            // Section Missions Récentes
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.card_travel, color: AppTheme.primaryNavy, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Mes Missions Récentes',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const MissionListScreen()),
                    );
                    _loadDashboardData();
                  },
                  child: const Text('Voir tout', style: TextStyle(color: AppTheme.accentGold)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_recentMissions.isEmpty)
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: const Padding(
                  padding: EdgeInsets.all(20.0),
                  child: Center(
                    child: Text('Aucune demande de mission récente', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  ),
                ),
              )
            else
              Column(
                children: _recentMissions.map((mission) {
                  Color stColor = Colors.orange;
                  if (mission.acceptationSuperieur == 'Validé') stColor = Colors.green;
                  if (mission.acceptationSuperieur == 'Refusé') stColor = Colors.red;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    child: ListTile(
                      dense: true,
                      leading: CircleAvatar(
                        radius: 18,
                        backgroundColor: stColor.withOpacity(0.15),
                        child: Icon(Icons.card_travel, color: stColor, size: 18),
                      ),
                      title: Text(mission.objet, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: Text('${mission.destination} • ${mission.jourDebut} → ${mission.jourFin}', style: const TextStyle(fontSize: 12)),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: stColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          mission.acceptationSuperieur,
                          style: TextStyle(color: stColor, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

            const SizedBox(height: 20),

            // Recent Leave Requests Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.beach_access, color: AppTheme.primaryNavy, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Derniers Congés',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => widget.onNavigate(1),
                  child: const Text('Voir tout', style: TextStyle(color: AppTheme.accentGold)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_isLoading)
              const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator()))
            else if (_recentDemandes.isEmpty)
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: const Padding(
                  padding: EdgeInsets.all(20.0),
                  child: Center(
                    child: Text('Aucune demande de congé récente', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _recentDemandes.length,
                itemBuilder: (context, index) {
                  final item = _recentDemandes[index];
                  Color statusColor = AppTheme.statusPending;
                  if (item.acceptationSuperieur == 'Validé') statusColor = AppTheme.statusApproved;
                  if (item.acceptationSuperieur == 'Refusé') statusColor = AppTheme.statusRejected;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    child: ListTile(
                      dense: true,
                      leading: CircleAvatar(
                        radius: 18,
                        backgroundColor: statusColor.withOpacity(0.15),
                        child: Icon(
                          item.acceptationSuperieur == 'Validé'
                              ? Icons.check_circle_rounded
                              : (item.acceptationSuperieur == 'Refusé' ? Icons.cancel_rounded : Icons.hourglass_top_rounded),
                          color: statusColor,
                          size: 18,
                        ),
                      ),
                      title: Text(
                        item.motifLibelle,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      subtitle: Text(
                        'Du ${item.jourDebut} au ${item.jourFin} (${item.nombreJours} j)',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          item.acceptationSuperieur,
                          style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
