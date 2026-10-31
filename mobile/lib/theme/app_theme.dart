import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Couleurs Officielles Kilani Group
  static const Color primaryNavy = Color(0xFF1E2B37); // Bleu Nuit Deep Slate
  static const Color secondaryNavy = Color(0xFF131B2A); // Bleu Sombre
  static const Color accentGold = Color(0xFFB89B72); // Or Bronze Kilani
  static const Color darkGold = Color(0xFF8C7756); // Or Foncé
  static const Color lightGold = Color(0xFFF4EBE1); // Or Clair / Soft
  
  static const Color background = Color(0xFFF8F9FA); // Fond Clair Moderne
  static const Color surface = Color(0xFFFFFFFF); // Blanc Pur pour les cartes
  static const Color textPrimary = Color(0xFF1E2B37);
  static const Color textSecondary = Color(0xFF6C757D);

  // Statuts de Congés
  static const Color statusPending = Color(0xFFE67E22); // Orange / En attente
  static const Color statusApproved = Color(0xFF27AE60); // Vert / Validé
  static const Color statusRejected = Color(0xFFC0392B); // Rouge / Refusé

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      primaryColor: primaryNavy,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryNavy,
        primary: primaryNavy,
        secondary: accentGold,
        surface: surface,
      ),
      textTheme: GoogleFonts.outfitTextTheme().copyWith(
        displayLarge: const TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
        titleLarge: const TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
        bodyLarge: const TextStyle(color: textPrimary),
        bodyMedium: const TextStyle(color: textSecondary),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primaryNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.outfit(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.06),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryNavy,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentGold, width: 2),
        ),
      ),
    );
  }
}
