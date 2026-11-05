import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/demande_conge_model.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class ValidationScreen extends StatefulWidget {
  final UserModel currentUser;

  const ValidationScreen({super.key, required this.currentUser});

  @override
  State<ValidationScreen> createState() => _ValidationScreenState();
}

class _ValidationScreenState extends State<ValidationScreen> {
  List<DemandeCongeModel> _demandes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPendingRequests();
  }

  Future<void> _loadPendingRequests() async {
    final list = await ApiService.getDemandesAValider();
    if (mounted) {
      setState(() {
        _demandes = list;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleDecision(DemandeCongeModel d, bool isApproved) async {
    final commentController = TextEditingController();

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(isApproved ? 'Valider la demande' : 'Refuser la demande'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Employé : ${d.nomPrenom ?? d.matricule}\nMotif : ${d.motifLibelle} (${d.nombreJours} jours)',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: commentController,
                decoration: const InputDecoration(
                  labelText: 'Commentaire / Motif de la décision (optionnel)',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('ANNULER'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: isApproved ? AppTheme.statusApproved : AppTheme.statusRejected,
              ),
              child: Text(isApproved ? 'CONFIRMER VALIDATION' : 'CONFIRMER REFUS'),
            ),
          ],
        );
      },
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      final comment = commentController.text.trim();

      bool success = false;
      if (isApproved) {
        success = await ApiService.validerDemande(d.id, commentaire: comment);
      } else {
        success = await ApiService.refuserDemande(d.id, commentaire: comment);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success ? 'Demande traitée avec succès' : 'Erreur lors du traitement'),
            backgroundColor: success ? AppTheme.statusApproved : Colors.red,
          ),
        );
      }
      _loadPendingRequests();
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadPendingRequests,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.rule_rounded, color: AppTheme.accentGold, size: 28),
                SizedBox(width: 10),
                Text(
                  'Validation des Demandes (Équipe)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                ),
              ],
            ),
            const SizedBox(height: 16),

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _demandes.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.check_circle_outline_rounded, color: Colors.green, size: 50),
                              SizedBox(height: 12),
                              Text('Toutes les demandes de votre équipe sont traitées !', style: TextStyle(color: Colors.grey, fontSize: 16)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: _demandes.length,
                          itemBuilder: (context, index) {
                            final d = _demandes[index];
                            // Les RH font la validation finale, après celle du supérieur (N+1)
                            final isRh = widget.currentUser.statut == 'Ressources Humaines' || widget.currentUser.statut == 'Administrateur';
                            final isPending = isRh
                                ? d.acceptationSuperieur == 'Validé' && d.acceptationRessource == 'En attente'
                                : d.acceptationSuperieur == 'En attente';
                            final statutAffiche = isRh && d.acceptationSuperieur == 'Validé' ? d.acceptationRessource : d.acceptationSuperieur;

                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          d.nomPrenom ?? d.matricule,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryNavy),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: AppTheme.lightGold,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            d.motifLibelle,
                                            style: const TextStyle(color: AppTheme.darkGold, fontWeight: FontWeight.bold, fontSize: 12),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text('Période : Du ${d.jourDebut} au ${d.jourFin} (${d.nombreJours} jours / ${d.typeConge})'),
                                    if (d.soldeCongeMoment != null)
                                      Text('Solde actuel de l\'employé : ${d.soldeCongeMoment} jours', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                                    if (d.commentaire != null && d.commentaire!.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade100,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text('Remarque employé : ${d.commentaire}', style: const TextStyle(fontStyle: FontStyle.italic)),
                                      ),
                                    ],
                                    const SizedBox(height: 16),

                                    if (isPending)
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              onPressed: () => _handleDecision(d, false),
                                              icon: const Icon(Icons.close_rounded, color: Colors.red),
                                              label: const Text('REFUSER', style: TextStyle(color: Colors.red)),
                                              style: OutlinedButton.styleFrom(
                                                side: const BorderSide(color: Colors.red),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () => _handleDecision(d, true),
                                              icon: const Icon(Icons.check_rounded),
                                              label: const Text('VALIDER'),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: AppTheme.statusApproved,
                                              ),
                                            ),
                                          ),
                                        ],
                                      )
                                    else
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: statutAffiche == 'Validé' ? Colors.green.shade50 : Colors.red.shade50,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          'Statut : $statutAffiche',
                                          style: TextStyle(
                                            color: statutAffiche == 'Validé' ? Colors.green.shade800 : Colors.red.shade800,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
