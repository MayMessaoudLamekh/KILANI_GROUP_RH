import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/attestation_model.dart';
import '../services/api_service.dart';

class CreateAttestationScreen extends StatefulWidget {
  final VoidCallback? onSuccess;

  const CreateAttestationScreen({super.key, this.onSuccess});

  @override
  State<CreateAttestationScreen> createState() => _CreateAttestationScreenState();
}

class _CreateAttestationScreenState extends State<CreateAttestationScreen> {
  final _formKey = GlobalKey<FormState>();

  bool _isLoading = true;
  bool _isSubmitting = false;
  List<TypeAttestation> _types = [];
  TypeAttestation? _selectedType;

  // Dynamic complementary fields controllers
  final Map<String, TextEditingController> _fieldControllers = {};
  final Map<String, String?> _dropdownValues = {};

  @override
  void initState() {
    super.initState();
    _loadTypes();
  }

  Future<void> _loadTypes() async {
    try {
      final types = await ApiService.getTypesAttestation();
      if (mounted) {
        setState(() {
          _types = types;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur de connexion au serveur : $e')),
        );
      }
    }
  }

  void _onTypeChanged(TypeAttestation? type) {
    // Clear old controllers
    for (final c in _fieldControllers.values) {
      c.dispose();
    }
    _fieldControllers.clear();
    _dropdownValues.clear();

    if (type != null) {
      for (final champ in type.champsComplementaires) {
        final nom = champ['nom'] as String;
        final typeChamp = champ['type'] as String? ?? 'text';
        if (typeChamp == 'select') {
          _dropdownValues[nom] = null;
        } else {
          _fieldControllers[nom] = TextEditingController();
        }
      }
    }
    setState(() {
      _selectedType = type;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez choisir un type d\'attestation')),
      );
      return;
    }

    // Build details map
    final Map<String, dynamic> details = {};
    for (final champ in _selectedType!.champsComplementaires) {
      final nom = champ['nom'] as String;
      final typeChamp = champ['type'] as String? ?? 'text';
      if (typeChamp == 'select') {
        details[nom] = _dropdownValues[nom];
      } else {
        details[nom] = _fieldControllers[nom]?.text ?? '';
      }
    }

    setState(() => _isSubmitting = true);
    final ok = await ApiService.createAttestation(
      titreAttestation: _selectedType!.libelle,
      details: details,
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('✅ Demande d\'attestation envoyée avec succès!'),
          backgroundColor: Colors.green.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
      if (widget.onSuccess != null) widget.onSuccess!();
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('❌ Erreur lors de l\'envoi. Veuillez réessayer.'),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  void dispose() {
    for (final c in _fieldControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Widget _buildTypeCard(TypeAttestation type) {
    final isSelected = _selectedType?.id == type.id;
    return GestureDetector(
      onTap: () => _onTypeChanged(type),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryNavy : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppTheme.accentGold : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: AppTheme.accentGold.withOpacity(0.3), blurRadius: 8, spreadRadius: 1)]
              : [BoxShadow(color: Colors.black12, blurRadius: 4)],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.accentGold.withOpacity(0.2) : AppTheme.primaryNavy.withOpacity(0.07),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                _iconForType(type.code),
                color: isSelected ? AppTheme.accentGold : AppTheme.primaryNavy,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    type.libelle,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: isSelected ? Colors.white : AppTheme.primaryNavy,
                    ),
                  ),
                  if (type.description != null && type.description!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Text(
                        type.description!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isSelected ? Colors.white70 : Colors.grey.shade600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 16),
              ),
          ],
        ),
      ),
    );
  }

  IconData _iconForType(String code) {
    switch (code) {
      case 'TRAVAIL':
        return Icons.work_outline;
      case 'SALAIRE':
        return Icons.monetization_on_outlined;
      case 'FICHE_PAIE':
        return Icons.receipt_long_outlined;
      case 'PRESENCE':
        return Icons.event_available_outlined;
      case 'CONGE':
        return Icons.beach_access_outlined;
      default:
        return Icons.description_outlined;
    }
  }

  Widget _buildComplementaryFields() {
    if (_selectedType == null || _selectedType!.champsComplementaires.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Row(
          children: [
            Container(
              width: 4,
              height: 20,
              decoration: BoxDecoration(
                color: AppTheme.accentGold,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Informations complémentaires',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ..._selectedType!.champsComplementaires.map((champ) {
          final nom = champ['nom'] as String;
          final label = champ['label'] as String? ?? nom;
          final typeChamp = champ['type'] as String? ?? 'text';
          final requis = champ['requis'] as bool? ?? false;

          if (typeChamp == 'select') {
            final options = (champ['options'] as List?)?.cast<String>() ?? [];
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: DropdownButtonFormField<String>(
                value: _dropdownValues[nom],
                decoration: InputDecoration(
                  labelText: label + (requis ? ' *' : ''),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                ),
                items: options
                    .map((opt) => DropdownMenuItem(value: opt, child: Text(opt)))
                    .toList(),
                onChanged: (val) => setState(() => _dropdownValues[nom] = val),
                validator: requis ? (v) => v == null ? 'Champ obligatoire' : null : null,
              ),
            );
          }

          if (typeChamp == 'date') {
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: TextFormField(
                controller: _fieldControllers[nom],
                readOnly: true,
                decoration: InputDecoration(
                  labelText: label + (requis ? ' *' : ''),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  suffixIcon: const Icon(Icons.calendar_today_outlined),
                ),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime(2030),
                  );
                  if (date != null) {
                    _fieldControllers[nom]?.text =
                        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                  }
                },
                validator: requis ? (v) => (v == null || v.isEmpty) ? 'Champ obligatoire' : null : null,
              ),
            );
          }

          // default: text or number
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: TextFormField(
              controller: _fieldControllers[nom],
              keyboardType: typeChamp == 'number' ? TextInputType.number : TextInputType.text,
              decoration: InputDecoration(
                labelText: label + (requis ? ' *' : ''),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                filled: true,
                fillColor: Colors.grey.shade50,
              ),
              validator: requis ? (v) => (v == null || v.isEmpty) ? 'Champ obligatoire' : null : null,
            ),
          );
        }).toList(),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text('Nouvelle demande d\'attestation'),
        backgroundColor: AppTheme.primaryNavy,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header banner
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primaryNavy, AppTheme.secondaryNavy],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.accentGold.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.description, color: AppTheme.accentGold, size: 28),
                          ),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Demande d\'attestation',
                                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Sélectionnez le type et remplissez les informations',
                                  style: TextStyle(color: Colors.white70, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Type selection title
                    Row(
                      children: [
                        Container(
                          width: 4,
                          height: 20,
                          decoration: BoxDecoration(
                            color: AppTheme.accentGold,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Type d\'attestation',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Type cards
                    if (_types.isEmpty)
                      const Center(child: Text('Aucun type d\'attestation disponible'))
                    else
                      ..._types.map(_buildTypeCard),

                    // Dynamic complementary fields
                    _buildComplementaryFields(),

                    const SizedBox(height: 24),

                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accentGold,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 4,
                        ),
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Icon(Icons.send_rounded),
                        label: Text(
                          _isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
    );
  }
}
