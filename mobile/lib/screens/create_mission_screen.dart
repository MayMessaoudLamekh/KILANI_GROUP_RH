import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class CreateMissionScreen extends StatefulWidget {
  const CreateMissionScreen({super.key});

  @override
  State<CreateMissionScreen> createState() => _CreateMissionScreenState();
}

class _CreateMissionScreenState extends State<CreateMissionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _objetController = TextEditingController();
  final _destinationController = TextEditingController();
  final _commentaireController = TextEditingController();
  final _descriptionController = TextEditingController();

  DateTime? _dateDebut;
  DateTime? _dateFin;
  TimeOfDay? _heureSortie;
  TimeOfDay? _heureEntree;

  String? _moyenTransport;

  final List<String> _moyensTransport = [
    'Voiture de service',
    'Voiture personnelle',
    'Bus',
    'Train',
    'Avion',
    'Taxi',
    'Autre',
  ];

  bool _isLoading = false;

  @override
  void dispose() {
    _objetController.dispose();
    _destinationController.dispose();
    _commentaireController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isDebut) async {
    final initialDate = isDebut
        ? (_dateDebut ?? DateTime.now())
        : (_dateFin ?? _dateDebut ?? DateTime.now());

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF1E2B37),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1E2B37),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isDebut) {
          _dateDebut = picked;
          if (_dateFin != null && _dateFin!.isBefore(_dateDebut!)) {
            _dateFin = _dateDebut;
          }
        } else {
          _dateFin = picked;
        }
      });
    }
  }

  Future<void> _selectTime(BuildContext context, bool isSortie) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isSortie
          ? (_heureSortie ?? const TimeOfDay(hour: 8, minute: 0))
          : (_heureEntree ?? const TimeOfDay(hour: 18, minute: 0)),
    );

    if (picked != null) {
      setState(() {
        if (isSortie) {
          _heureSortie = picked;
        } else {
          _heureEntree = picked;
        }
      });
    }
  }

  String _formatTimeOfDay(TimeOfDay? time) {
    if (time == null) return '';
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  Future<void> _submitDemande() async {
    if (!_formKey.currentState!.validate()) return;
    if (_dateDebut == null || _dateFin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner les dates de début et de fin'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final result = await ApiService.createMission(
      objet: _objetController.text.trim(),
      destination: _destinationController.text.trim(),
      jourDebut: DateFormat('yyyy-MM-dd').format(_dateDebut!),
      jourFin: DateFormat('yyyy-MM-dd').format(_dateFin!),
      heureSortie: _formatTimeOfDay(_heureSortie),
      heureEntree: _formatTimeOfDay(_heureEntree),
      moyenTransport: _moyenTransport,
      commentaire: _commentaireController.text.trim().isEmpty ? null : _commentaireController.text.trim(),
      description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
    );

    setState(() => _isLoading = false);

    if (!mounted) return;

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Demande de mission créée avec succès'),
          backgroundColor: const Color(0xFF2E7D32),
        ),
      );
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Erreur lors de la demande'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouvelle Demande de Mission'),
        backgroundColor: const Color(0xFF1E2B37),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E2B37), Color(0xFF34495E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFB89B72).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.card_travel,
                        color: Color(0xFFB89B72),
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Formulaire de Mission',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Renseignez les détails de votre déplacement professionnel',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Objet de la mission
              TextFormField(
                controller: _objetController,
                decoration: InputDecoration(
                  labelText: 'Objet de la mission *',
                  hintText: 'Ex: Réunion client, Formation, Audit',
                  prefixIcon: const Icon(Icons.title, color: Color(0xFF1E2B37)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E2B37), width: 2),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Veuillez saisir l\'objet de la mission';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // Destination
              TextFormField(
                controller: _destinationController,
                decoration: InputDecoration(
                  labelText: 'Destination *',
                  hintText: 'Ex: Sfax, Sousse, Tunis, Paris',
                  prefixIcon: const Icon(Icons.location_on, color: Color(0xFF1E2B37)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E2B37), width: 2),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Veuillez saisir la destination';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // Dates Selection (Début & Fin)
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectDate(context, true),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Date début *',
                          prefixIcon: const Icon(Icons.calendar_today, color: Color(0xFF1E2B37)),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          _dateDebut != null ? dateFormat.format(_dateDebut!) : 'Choisir date',
                          style: TextStyle(
                            color: _dateDebut != null ? Colors.black87 : Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectDate(context, false),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Date fin *',
                          prefixIcon: const Icon(Icons.event, color: Color(0xFF1E2B37)),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          _dateFin != null ? dateFormat.format(_dateFin!) : 'Choisir date',
                          style: TextStyle(
                            color: _dateFin != null ? Colors.black87 : Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Heures (Sortie & Entrée)
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectTime(context, true),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Heure sortie',
                          prefixIcon: const Icon(Icons.access_time, color: Color(0xFF1E2B37)),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          _heureSortie != null ? _formatTimeOfDay(_heureSortie) : 'Ex: 08:00',
                          style: TextStyle(
                            color: _heureSortie != null ? Colors.black87 : Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectTime(context, false),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Heure retour',
                          prefixIcon: const Icon(Icons.more_time, color: Color(0xFF1E2B37)),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          _heureEntree != null ? _formatTimeOfDay(_heureEntree) : 'Ex: 18:00',
                          style: TextStyle(
                            color: _heureEntree != null ? Colors.black87 : Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Moyen de transport
              DropdownButtonFormField<String>(
                value: _moyenTransport,
                decoration: InputDecoration(
                  labelText: 'Moyen de transport',
                  prefixIcon: const Icon(Icons.directions_car, color: Color(0xFF1E2B37)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: _moyensTransport.map((transport) {
                  return DropdownMenuItem(
                    value: transport,
                    child: Text(transport),
                  );
                }).toList(),
                onChanged: (value) => setState(() => _moyenTransport = value),
              ),

              const SizedBox(height: 16),

              // Description détaillée
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Description détaillée',
                  hintText: 'Détails des tâches ou réunions prévues...',
                  prefixIcon: const Icon(Icons.description, color: Color(0xFF1E2B37)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E2B37), width: 2),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Commentaire
              TextFormField(
                controller: _commentaireController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: 'Commentaire / Remarques',
                  hintText: 'Informations complémentaires...',
                  prefixIcon: const Icon(Icons.comment, color: Color(0xFF1E2B37)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E2B37), width: 2),
                  ),
                ),
              ),

              const SizedBox(height: 28),

              // Bouton Soumettre
              SizedBox(
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _submitDemande,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E2B37),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 2,
                  ),
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.send_rounded),
                  label: Text(
                    _isLoading ? 'Envoi en cours...' : 'SOUMETTRE LA DEMANDE',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
