import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../theme/app_theme.dart';
import '../models/attestation_model.dart';
import '../services/api_service.dart';
import 'create_attestation_screen.dart';

class AttestationListScreen extends StatefulWidget {
  const AttestationListScreen({super.key});

  @override
  State<AttestationListScreen> createState() => _AttestationListScreenState();
}

class _AttestationListScreenState extends State<AttestationListScreen> {
  List<AttestationModel> _attestations = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getMesAttestations();
    if (mounted) {
      setState(() {
        _attestations = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _annuler(AttestationModel att) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Annuler la demande'),
        content: Text('Voulez-vous annuler la demande "${att.titreAttestation}" ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('NON')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('OUI, ANNULER'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final ok = await ApiService.annulerAttestation(att.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? '✅ Demande annulée' : '❌ Erreur lors de l\'annulation'),
        backgroundColor: ok ? Colors.green.shade700 : Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
    if (ok) _load();
  }

  Future<void> _downloadPdf(AttestationModel att) async {
    final token = ApiService.currentToken;
    if (token == null) return;

    final url = ApiService.getAttestationPdfUrl(att.id);

    // Show loading
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(children: [
          SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
          SizedBox(width: 12),
          Text('Génération du PDF en cours…'),
        ]),
        duration: Duration(seconds: 30),
        backgroundColor: Color(0xFF1E2B37),
      ),
    );

    try {
      final dio = Dio();
      final dir = await getApplicationDocumentsDirectory();
      final filename = 'attestation_${att.id}_${att.matricule}.pdf';
      final savePath = '${dir.path}/$filename';

      await dio.download(
        url,
        savePath,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      
      // Partager ou ouvrir le fichier avec le système natif
      await Share.shareXFiles(
        [XFile(savePath)],
        text: 'Attestation Kilani HR - ${att.titreAttestation}',
      );

      // Rafraîchir la liste pour mettre à jour l'état "Généré"
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Erreur lors du téléchargement : $e'),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Color _stateColor(String etat) {
    switch (etat) {
      case 'Validé':
        return Colors.green;
      case 'Refusé':
        return Colors.red;
      case 'Généré':
        return Colors.blue;
      default:
        return Colors.orange;
    }
  }

  IconData _stateIcon(String etat) {
    switch (etat) {
      case 'Validé':
        return Icons.check_circle_outline;
      case 'Refusé':
        return Icons.cancel_outlined;
      case 'Généré':
        return Icons.picture_as_pdf_outlined;
      default:
        return Icons.hourglass_top_rounded;
    }
  }

  IconData _typeIcon(String titre) {
    if (titre.contains('travail')) return Icons.work_outline;
    if (titre.contains('salaire')) return Icons.monetization_on_outlined;
    if (titre.contains('paie')) return Icons.receipt_long_outlined;
    if (titre.contains('présence')) return Icons.event_available_outlined;
    if (titre.contains('congé')) return Icons.beach_access_outlined;
    return Icons.description_outlined;
  }

  String _formatDate(String? dt) {
    if (dt == null) return '—';
    try {
      final d = DateTime.parse(dt);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return dt.length >= 10 ? dt.substring(0, 10) : dt;
    }
  }

  Widget _buildCard(AttestationModel att) {
    final stateColor = _stateColor(att.etatDemande);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.primaryNavy.withOpacity(0.04),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryNavy.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(_typeIcon(att.titreAttestation.toLowerCase()), color: AppTheme.primaryNavy, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        att.titreAttestation,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryNavy),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Demandé le ${_formatDate(att.datetime)}',
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: stateColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: stateColor.withOpacity(0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_stateIcon(att.etatDemande), color: stateColor, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        att.etatDemande,
                        style: TextStyle(color: stateColor, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Details
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (att.details.isNotEmpty) ...[
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: att.details.entries.map((e) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${e.key}: ${e.value}',
                          style: const TextStyle(fontSize: 12),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                ],

                // Bouton PDF pour les attestations validées ou générées
                if (att.etatDemande == 'Validé' || att.etatDemande == 'Généré') ...[ 
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _downloadPdf(att),
                      icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                      label: const Text(
                        'Télécharger le document PDF',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1565C0),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],

                // Cancel button only for pending
                if (att.etatDemande == 'En attente')
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: () => _annuler(att),
                      icon: const Icon(Icons.cancel_outlined, size: 16, color: Colors.red),
                      label: const Text('Annuler', style: TextStyle(color: Colors.red, fontSize: 12)),
                    ),
                  ),
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
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text('Mes attestations'),
        backgroundColor: AppTheme.primaryNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _load,
            tooltip: 'Actualiser',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'attest_fab',
        backgroundColor: AppTheme.accentGold,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Nouvelle demande', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => CreateAttestationScreen(onSuccess: _load)),
          );
        },
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _attestations.isEmpty
                  ? ListView(
                      children: [
                        const SizedBox(height: 80),
                        Center(
                          child: Column(
                            children: [
                              Icon(Icons.description_outlined, size: 64, color: Colors.grey.shade400),
                              const SizedBox(height: 16),
                              Text(
                                'Aucune demande d\'attestation',
                                style: TextStyle(fontSize: 16, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Appuyez sur + pour faire une demande',
                                style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        // Stats row
                        Row(
                          children: [
                            _StatChip(
                              count: _attestations.where((a) => a.etatDemande == 'En attente').length,
                              label: 'En attente',
                              color: Colors.orange,
                            ),
                            const SizedBox(width: 8),
                            _StatChip(
                              count: _attestations.where((a) => a.etatDemande == 'Validé').length,
                              label: 'Validées',
                              color: Colors.green,
                            ),
                            const SizedBox(width: 8),
                            _StatChip(
                              count: _attestations.where((a) => a.etatDemande == 'Généré').length,
                              label: 'Générées',
                              color: Colors.blue,
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ..._attestations.map(_buildCard),
                        const SizedBox(height: 80), // space for FAB
                      ],
                    ),
            ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final int count;
  final String label;
  final Color color;

  const _StatChip({required this.count, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.10),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Text('$count', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
            Text(label, style: TextStyle(fontSize: 11, color: color.withOpacity(0.8))),
          ],
        ),
      ),
    );
  }
}
