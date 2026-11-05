import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/attestation_model.dart';
import '../services/api_service.dart';

class AttestationValidationScreen extends StatefulWidget {
  const AttestationValidationScreen({super.key});

  @override
  State<AttestationValidationScreen> createState() => _AttestationValidationScreenState();
}

class _AttestationValidationScreenState extends State<AttestationValidationScreen> {
  List<AttestationModel> _pending = [];
  bool _isLoading = true;
  final Set<int> _processing = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getAttestationsAValider();
    if (mounted) {
      setState(() {
        _pending = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _valider(AttestationModel att) async {
    setState(() => _processing.add(att.id));
    final ok = await ApiService.validerAttestation(att.id);
    if (!mounted) return;
    setState(() => _processing.remove(att.id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? '✅ Attestation validée' : '❌ Erreur de validation'),
        backgroundColor: ok ? Colors.green.shade700 : Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
    if (ok) _load();
  }

  Future<void> _refuser(AttestationModel att) async {
    setState(() => _processing.add(att.id));
    final ok = await ApiService.refuserAttestation(att.id);
    if (!mounted) return;
    setState(() => _processing.remove(att.id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? '✅ Attestation refusée' : '❌ Erreur'),
        backgroundColor: ok ? Colors.orange.shade700 : Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
    if (ok) _load();
  }

  Future<void> _generer(AttestationModel att) async {
    setState(() => _processing.add(att.id));
    final ok = await ApiService.genererAttestation(att.id);
    if (!mounted) return;
    setState(() => _processing.remove(att.id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? '📄 Attestation marquée comme générée' : '❌ Erreur'),
        backgroundColor: ok ? Colors.blue.shade700 : Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
    if (ok) _load();
  }

  IconData _typeIcon(String titre) {
    final t = titre.toLowerCase();
    if (t.contains('travail')) return Icons.work_outline;
    if (t.contains('salaire')) return Icons.monetization_on_outlined;
    if (t.contains('paie')) return Icons.receipt_long_outlined;
    if (t.contains('présence')) return Icons.event_available_outlined;
    if (t.contains('congé')) return Icons.beach_access_outlined;
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
    final isProcessing = _processing.contains(att.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 3))],
        border: Border.all(color: Colors.orange.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.06),
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
                  child: Icon(_typeIcon(att.titreAttestation), color: AppTheme.primaryNavy, size: 20),
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
                        att.nomPrenom ?? att.matricule,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.accentGold),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.orange.withOpacity(0.4)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.hourglass_top_rounded, color: Colors.orange, size: 12),
                      SizedBox(width: 4),
                      Text('En attente', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Body info
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoRow(icon: Icons.badge_outlined, label: 'Matricule', value: att.matricule),
                _InfoRow(icon: Icons.business_outlined, label: 'Service', value: att.service ?? '—'),
                _InfoRow(icon: Icons.location_on_outlined, label: 'Site', value: att.site ?? '—'),
                _InfoRow(icon: Icons.calendar_today_outlined, label: 'Demandé le', value: _formatDate(att.datetime)),

                if (att.details.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: att.details.entries.map((e) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryNavy.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${e.key}: ${e.value}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),

          // Action buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: isProcessing
                ? const Center(child: CircularProgressIndicator())
                : Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _refuser(att),
                          icon: const Icon(Icons.close, size: 16),
                          label: const Text('Refuser'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _valider(att),
                          icon: const Icon(Icons.check, size: 16),
                          label: const Text('Valider'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _generer(att),
                          icon: const Icon(Icons.picture_as_pdf, size: 16),
                          label: const Text('Générer'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text('Validation attestations'),
        backgroundColor: AppTheme.primaryNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _pending.isEmpty
                  ? ListView(
                      children: [
                        const SizedBox(height: 80),
                        Center(
                          child: Column(
                            children: [
                              Icon(Icons.check_circle_outline, size: 64, color: Colors.green.shade400),
                              const SizedBox(height: 16),
                              const Text(
                                'Aucune attestation en attente',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Toutes les demandes ont été traitées',
                                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Container(
                          padding: const EdgeInsets.all(14),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.primaryNavy, AppTheme.secondaryNavy],
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.pending_actions_rounded, color: AppTheme.accentGold, size: 28),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${_pending.length} demande${_pending.length > 1 ? 's' : ''} en attente',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                    ),
                                    const Text(
                                      'Validez, refusez ou générez les attestations',
                                      style: TextStyle(color: Colors.white70, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        ..._pending.map(_buildCard),
                      ],
                    ),
            ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.grey.shade500),
          const SizedBox(width: 6),
          Text('$label: ', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
