import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

ThemeData appTheme() {
  return ThemeData(
    useMaterial3: true,
    fontFamily: GoogleFonts.inter().fontFamily,
    primaryColor: primaryBlue,
    scaffoldBackgroundColor: backgroundWhite,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryBlue,
      primary: primaryBlue,
      secondary: accentBlue,
      surface: backgroundWhite,
      surfaceVariant: surfaceGray,
      onSurface: textDark,
      onSurfaceVariant: textLight,
      brightness: Brightness.light,
    ),
    textTheme: TextTheme(
      displayLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w800,
        fontSize: 57,
        color: textDark,
        letterSpacing: -0.25,
      ),
      displayMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        fontSize: 45,
        color: textDark,
        letterSpacing: 0,
      ),
      displaySmall: GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 36,
        color: textDark,
        letterSpacing: 0,
      ),
      headlineLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        fontSize: 32,
        color: textDark,
        letterSpacing: 0,
      ),
      headlineMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 28,
        color: textDark,
        letterSpacing: 0,
      ),
      headlineSmall: GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 24,
        color: textDark,
        letterSpacing: 0,
      ),
      titleLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 22,
        color: textDark,
        letterSpacing: 0,
      ),
      titleMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        fontSize: 16,
        color: textDark,
        letterSpacing: 0.15,
      ),
      titleSmall: GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        fontSize: 14,
        color: textDark,
        letterSpacing: 0.1,
      ),
      bodyLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 16,
        color: textDark,
        letterSpacing: 0.5,
      ),
      bodyMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 14,
        color: textDark,
        letterSpacing: 0.25,
      ),
      bodySmall: GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 12,
        color: textLight,
        letterSpacing: 0.4,
      ),
      labelLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        fontSize: 14,
        color: primaryBlue,
        letterSpacing: 0.1,
      ),
      labelMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        fontSize: 12,
        color: primaryBlue,
        letterSpacing: 0.5,
      ),
      labelSmall: GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        fontSize: 11,
        color: primaryBlue,
        letterSpacing: 0.5,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryBlue,
        foregroundColor: backgroundWhite,
        elevation: 3,
        shadowColor: primaryBlue.withOpacity(0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          letterSpacing: 0.1,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryBlue,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w500,
          fontSize: 14,
          letterSpacing: 0.1,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryBlue,
        side: BorderSide(color: primaryBlue, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w500,
          fontSize: 16,
          letterSpacing: 0.1,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surfaceGray,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: dividerColor, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: primaryBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: errorRed, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: errorRed, width: 2),
      ),
      hintStyle: GoogleFonts.inter(
        color: textLight,
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      labelStyle: GoogleFonts.inter(
        color: textLight,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      helperStyle: GoogleFonts.inter(
        color: textLight,
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
      errorStyle: GoogleFonts.inter(
        color: errorRed,
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
    ),
    cardTheme: CardThemeData(
      color: backgroundWhite,
      elevation: 4,
      shadowColor: Colors.black.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      margin: const EdgeInsets.all(8),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: backgroundWhite,
      foregroundColor: textDark,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.inter(
        color: textDark,
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
      iconTheme: IconThemeData(color: textDark),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: backgroundWhite,
      selectedItemColor: primaryBlue,
      unselectedItemColor: textLight,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
      unselectedLabelStyle: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: backgroundWhite,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      elevation: 8,
      titleTextStyle: GoogleFonts.inter(
        color: textDark,
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
      contentTextStyle: GoogleFonts.inter(
        color: textDark,
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: surfaceGray,
      contentTextStyle: GoogleFonts.inter(
        color: textDark,
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      behavior: SnackBarBehavior.floating,
    ),
    dividerTheme: DividerThemeData(
      color: dividerColor,
      thickness: 1,
      space: 1,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: ZoomPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),
  );
}