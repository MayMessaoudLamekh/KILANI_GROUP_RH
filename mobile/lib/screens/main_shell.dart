import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'dashboard_screen.dart';
import 'leave_list_screen.dart';
import 'create_leave_screen.dart';
import 'validation_screen.dart';
import 'create_mission_screen.dart';
import 'mission_list_screen.dart';
import 'mission_validation_screen.dart';
import 'attestation_list_screen.dart';
import 'create_attestation_screen.dart';
import 'attestation_validation_screen.dart';
import 'login_screen.dart';
import 'ai_chat_screen.dart';

class MainShell extends StatefulWidget {
  final UserModel currentUser;

  const MainShell({super.key, required this.currentUser});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  void _onNavigate(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter de Kilani RH ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ANNULER'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('DÉCONNEXION'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ApiService.logout();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isManagerOrRh = widget.currentUser.isManagerOrRh;

    final screens = [
      DashboardScreen(currentUser: widget.currentUser, onNavigate: _onNavigate),
      LeaveListScreen(currentUser: widget.currentUser),
      const MissionListScreen(),
      const AttestationListScreen(),
      if (isManagerOrRh) const ValidationScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.bubble_chart_rounded, color: AppTheme.accentGold, size: 24),
            SizedBox(width: 8),
            Text('KILANI RH'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: AppTheme.accentGold),
            tooltip: 'Assistant RH (IA)',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AiChatScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppTheme.accentGold),
            tooltip: 'Déconnexion',
            onPressed: _handleLogout,
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primaryNavy, AppTheme.secondaryNavy],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              currentAccountPicture: CircleAvatar(
                backgroundColor: AppTheme.accentGold,
                child: Text(
                  widget.currentUser.prenom.isNotEmpty ? widget.currentUser.prenom[0].toUpperCase() : 'U',
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
              accountName: Text(
                widget.currentUser.fullName,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              accountEmail: Text(
                'Matricule: ${widget.currentUser.matricule} • ${widget.currentUser.statut}',
                style: const TextStyle(color: AppTheme.accentGold, fontSize: 12),
              ),
            ),

            // Navigation - Section Dashboard
            ListTile(
              leading: const Icon(Icons.dashboard_rounded, color: AppTheme.primaryNavy),
              title: const Text('Tableau de bord', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                _onNavigate(0);
              },
            ),

            const Divider(),

            // Section Congés
            const Padding(
              padding: EdgeInsets.only(left: 16, top: 8, bottom: 4),
              child: Text('MODULE CONGÉS', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
            ListTile(
              leading: const Icon(Icons.beach_access, color: AppTheme.accentGold),
              title: const Text('Mes demandes de congé'),
              onTap: () {
                Navigator.pop(context);
                _onNavigate(1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.add_circle, color: AppTheme.accentGold),
              title: const Text('Nouvelle demande de congé'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => CreateLeaveScreen(
                    currentUser: widget.currentUser,
                    onSuccess: () {},
                  )),
                );
              },
            ),

            const Divider(),

            // Section Missions
            const Padding(
              padding: EdgeInsets.only(left: 16, top: 8, bottom: 4),
              child: Text('MODULE MISSIONS', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
            ListTile(
              leading: const Icon(Icons.card_travel, color: AppTheme.primaryNavy),
              title: const Text('Mes demandes de mission'),
              onTap: () {
                Navigator.pop(context);
                _onNavigate(2);
              },
            ),
            ListTile(
              leading: const Icon(Icons.add_location_alt, color: AppTheme.primaryNavy),
              title: const Text('Nouvelle demande de mission'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CreateMissionScreen()),
                );
              },
            ),

            if (isManagerOrRh) ...[
              const Divider(),
              const Padding(
                padding: EdgeInsets.only(left: 16, top: 8, bottom: 4),
                child: Text('VALIDATIONS ÉQUIPE', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              ListTile(
                leading: const Icon(Icons.fact_check, color: AppTheme.darkGold),
                title: const Text('Valider les congés'),
                onTap: () {
                  Navigator.pop(context);
                  _onNavigate(4);
                },
              ),
              ListTile(
                leading: const Icon(Icons.assignment_turned_in, color: AppTheme.darkGold),
                title: const Text('Valider les missions'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const MissionValidationScreen()),
                  );
                },
              ),
            ],

            const Divider(),

            // Section Attestations
            const Padding(
              padding: EdgeInsets.only(left: 16, top: 8, bottom: 4),
              child: Text('MODULE ATTESTATIONS', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
            ListTile(
              leading: const Icon(Icons.description_outlined, color: Color(0xFF1565C0)),
              title: const Text('Mes attestations'),
              onTap: () {
                Navigator.pop(context);
                _onNavigate(3);
              },
            ),
            ListTile(
              leading: const Icon(Icons.add_to_drive_outlined, color: Color(0xFF1565C0)),
              title: const Text('Nouvelle demande d\'attestation'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CreateAttestationScreen()),
                );
              },
            ),
            if (isManagerOrRh)
              ListTile(
                leading: const Icon(Icons.verified_outlined, color: AppTheme.darkGold),
                title: const Text('Valider les attestations'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const AttestationValidationScreen()),
                  );
                },
              ),

            const Divider(),

            // Déconnexion
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Déconnexion', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                _handleLogout();
              },
            ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex > (isManagerOrRh ? 4 : 3) ? 0 : _currentIndex,
        onTap: _onNavigate,
        selectedItemColor: AppTheme.accentGold,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppTheme.primaryNavy,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Accueil',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.beach_access_rounded),
            label: 'Congés',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.card_travel_rounded),
            label: 'Missions',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.description_rounded),
            label: 'Attests',
          ),
          if (isManagerOrRh)
            const BottomNavigationBarItem(
              icon: Icon(Icons.fact_check_rounded),
              label: 'Validation',
            ),
        ],
      ),
    );
  }
}
