import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/user_model.dart';
import '../models/motif_model.dart';
import '../services/api_service.dart';

class CreateLeaveScreen extends StatefulWidget {
  final UserModel currentUser;
  final VoidCallback onSuccess;

  const CreateLeaveScreen({
    super.key,
    required this.currentUser,
    required this.onSuccess,
  });

  @override
  State<CreateLeaveScreen> createState() => _CreateLeaveScreenState();
}

class _CreateLeaveScreenState extends State<CreateLeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  
  List<MotifModel> _motifs = [];
  MotifModel? _selectedMotif;
  
  String _typeConge = 'Journée'; // Journée, Demi-journée, Quart de journée
  DateTime _jourDebut = DateTime.now().add(const Duration(days: 1));
  DateTime _jourFin = DateTime.now().add(const Duration(days: 1));
  
  TimeOfDay _heureSortie = const TimeOfDay(hour: 8, minute: 0);
  TimeOfDay _heureEntree = const TimeOfDay(hour: 12, minute: 0);
  
  final _commentaireController = TextEditingController();
  
  bool _isLoadingMotifs = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  bool _isVerifyingAi = false;
  String? _aiFeedback;

  @override
  void initState() {
    super.initState();
    _loadMotifs();
  }

  Future<void> _verifyWithAi() async {
    setState(() {
      _isVerifyingAi = true;
      _aiFeedback = null;
      _errorMessage = null;
    });

    try {
      final dateFormat = DateFormat('yyyy-MM-dd');
      final analysis = await ApiService.verifyLeaveWithAi(
        dateFormat.format(_jourDebut),
        dateFormat.format(_jourFin),
        _typeConge,
      );
      setState(() {
        _aiFeedback = analysis;
        _isVerifyingAi = false;
      });
    } catch (e) {
      setState(() {
        _aiFeedback = "Erreur lors de l'analyse IA : $e";
        _isVerifyingAi = false;
      });
    }
  }

  Future<void> _loadMotifs() async {
    final list = await ApiService.getMotifs();
    if (mounted) {
      setState(() {
        _motifs = list;
        if (_motifs.isNotEmpty) _selectedMotif = _motifs.first;
        _isLoadingMotifs = false;
      });
    }
  }

  double get _calculatedDays {
    if (_typeConge == 'Demi-journée') return 0.5;
    if (_typeConge == 'Quart de journée') return 0.25;
    final diff = _jourFin.difference(_jourDebut).inDays;
    return (diff >= 0 ? diff + 1 : 0).toDouble();
  }

  double get _calculatedHours {
    return _calculatedDays * 8.0;
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final initial = isStart ? _jourDebut : _jourFin;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryNavy,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: AppTheme.primaryNavy,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _jourDebut = picked;
          if (_jourFin.isBefore(_jourDebut)) {
            _jourFin = _jourDebut;
          }
        } else {
          _jourFin = picked;
        }
      });
    }
  }

  Future<void> _selectTime(BuildContext context, bool isExit) async {
    final initial = isExit ? _heureSortie : _heureEntree;
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
    );

    if (picked != null) {
      setState(() {
        if (isExit) {
          _heureSortie = picked;
        } else {
          _heureEntree = picked;
        }
      });
    }
  }

  Future<void> _submitDemande() async {
    if (_selectedMotif == null) return;

    // Check Solde if impacts balance
    if (_selectedMotif!.impactSolde && _calculatedDays > widget.currentUser.soldeConge) {
      setState(() {
        _errorMessage = 'Solde insuffisant ! Votre solde actuel est de ${widget.currentUser.soldeConge} jours.';
      });
      return;
    }

    // Check max days limit if motif specifies one
    if (_selectedMotif!.nombreMaxJours != null && _calculatedDays > _selectedMotif!.nombreMaxJours!) {
      setState(() {
        _errorMessage = 'Le nombre de jours dépasse le maximum autorisé (${_selectedMotif!.nombreMaxJours} jours) pour ${_selectedMotif!.libelle}.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final dateFormat = DateFormat('yyyy-MM-dd');
    final result = await ApiService.createDemande(
      motifId: _selectedMotif!.id,
      typeConge: _typeConge,
      jourDebut: dateFormat.format(_jourDebut),
      jourFin: dateFormat.format(_jourFin),
      heureSortie: _typeConge != 'Journée' ? '${_heureSortie.hour.toString().padLeft(2, '0')}:${_heureSortie.minute.toString().padLeft(2, '0')}' : null,
      heureEntree: _typeConge != 'Journée' ? '${_heureEntree.hour.toString().padLeft(2, '0')}:${_heureEntree.minute.toString().padLeft(2, '0')}' : null,
      commentaire: _commentaireController.text.trim(),
    );

    setState(() {
      _isSubmitting = false;
    });

    if (result['success'] == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Demande de congé enregistrée avec succès !'),
          backgroundColor: AppTheme.statusApproved,
        ),
      );
      widget.onSuccess();
    } else {
      setState(() {
        _errorMessage = result['message'];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingMotifs) {
      return const Scaffold(
        backgroundColor: Color(0xFFF5F6FA),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final dateFormat = DateFormat('dd/MM/yyyy');

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text('Nouvelle Demande de Congé'),
        backgroundColor: AppTheme.primaryNavy,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Header
            Row(
              children: const [
                Icon(Icons.edit_calendar_rounded, color: AppTheme.accentGold, size: 28),
                SizedBox(width: 10),
                Text(
                  'Saisie d\'une Demande de Congé',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(color: Colors.red.shade800, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Card Form
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Motif Dropdown
                    const Text('Motif du Congé', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<MotifModel>(
                      value: _selectedMotif,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.category_outlined, color: AppTheme.accentGold),
                      ),
                      items: _motifs.map((motif) {
                        return DropdownMenuItem(
                          value: motif,
                          child: Text('${motif.libelle} ${motif.nombreMaxJours != null ? "(${motif.nombreMaxJours}j max)" : ""}'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedMotif = val;
                          _errorMessage = null;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Type de congé segment bar
                    const Text('Type de Durée', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'Journée', label: Text('Journée'), icon: Icon(Icons.wb_sunny_outlined)),
                        ButtonSegment(value: 'Demi-journée', label: Text('1/2 Jour'), icon: Icon(Icons.schedule_outlined)),
                        ButtonSegment(value: 'Quart de journée', label: Text('1/4 Jour'), icon: Icon(Icons.timer_outlined)),
                      ],
                      selected: {_typeConge},
                      onSelectionChanged: (set) {
                        setState(() {
                          _typeConge = set.first;
                          _errorMessage = null;
                        });
                      },
                      style: ButtonStyle(
                        backgroundColor: WidgetStateProperty.resolveWith((states) {
                          if (states.contains(WidgetState.selected)) return AppTheme.primaryNavy;
                          return Colors.white;
                        }),
                        foregroundColor: WidgetStateProperty.resolveWith((states) {
                          if (states.contains(WidgetState.selected)) return Colors.white;
                          return AppTheme.primaryNavy;
                        }),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Dates Selection
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Date Début', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              const SizedBox(height: 6),
                              OutlinedButton.icon(
                                onPressed: () => _selectDate(context, true),
                                icon: const Icon(Icons.calendar_today_rounded, size: 18, color: AppTheme.accentGold),
                                label: Text(dateFormat.format(_jourDebut)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        if (_typeConge == 'Journée')
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Date Fin', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 6),
                                OutlinedButton.icon(
                                  onPressed: () => _selectDate(context, false),
                                  icon: const Icon(Icons.event_rounded, size: 18, color: AppTheme.accentGold),
                                  label: Text(dateFormat.format(_jourFin)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Heures Selection for Half/Quarter day
                    if (_typeConge != 'Journée') ...[
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Heure Sortie', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 6),
                                OutlinedButton.icon(
                                  onPressed: () => _selectTime(context, true),
                                  icon: const Icon(Icons.access_time_rounded, size: 18, color: AppTheme.accentGold),
                                  label: Text(_heureSortie.format(context)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Heure Retour', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 6),
                                OutlinedButton.icon(
                                  onPressed: () => _selectTime(context, false),
                                  icon: const Icon(Icons.access_time_filled_rounded, size: 18, color: AppTheme.accentGold),
                                  label: Text(_heureEntree.format(context)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Commentaire
                    const Text('Commentaire / Motif détaillé', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _commentaireController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'Précisez la raison de votre demande (optionnel)...',
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Automatic Calculation Summary Box
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.lightGold,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.accentGold.withOpacity(0.5)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Durée calculée :', style: TextStyle(fontWeight: FontWeight.bold)),
                              Text(
                                '$_calculatedDays jour(s) (${_calculatedHours.toStringAsFixed(0)}h)',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryNavy, fontSize: 16),
                              ),
                            ],
                          ),
                          const Divider(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Impact sur le solde :'),
                              Text(
                                _selectedMotif?.impactSolde == true ? 'DÉDUIT DU SOLDE' : 'NON DÉDUIT (Autorisation)',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: _selectedMotif?.impactSolde == true ? Colors.red.shade700 : Colors.green.shade700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Solde actuel disponible :'),
                              Text(
                                '${widget.currentUser.soldeConge.toStringAsFixed(2)} jours',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          if (_selectedMotif?.impactSolde == true) ...[
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Solde restant calculé :', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryNavy)),
                                Text(
                                  '${(widget.currentUser.soldeConge - _calculatedDays).toStringAsFixed(2)} jours',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold, 
                                    color: (widget.currentUser.soldeConge - _calculatedDays) < 0 ? Colors.red : AppTheme.statusApproved
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // AI Verification Section
                    if (_aiFeedback != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.auto_awesome, color: Colors.blue),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _aiFeedback!,
                                style: TextStyle(color: Colors.blue.shade900, fontSize: 13, height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      ),

                    OutlinedButton.icon(
                      onPressed: _isVerifyingAi ? null : _verifyWithAi,
                      icon: _isVerifyingAi 
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.auto_awesome, color: Colors.blue),
                      label: Text(_isVerifyingAi ? 'Analyse en cours...' : 'Vérifier la demande avec l\'IA ✨', style: const TextStyle(color: Colors.blue)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.blue),
                        minimumSize: const Size.fromHeight(45),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Submit Button
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitDemande,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentGold,
                        minimumSize: const Size.fromHeight(50),
                      ),
                      child: _isSubmitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('ENREGISTRER ET ENVOYER LA DEMANDE'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}
