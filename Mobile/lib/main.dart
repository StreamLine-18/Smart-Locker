// main.dart
import 'package:flutter/material.dart';
import 'screens/register/edit_profile.dart';
import 'screens/register/sign_in.dart';
import 'screens/register/create_account.dart';
import 'screens/register/email_verification.dart';
import 'screens/register/history.dart';
import 'screens/register/help_and_support.dart';
import 'screens/register/profile.dart';
import 'screens/register/openning.dart';
import 'screens/register/home_screen.dart';
import 'screens/register/payment_screen.dart';
import 'screens/register/success_screen.dart';
import 'screens/register/language.dart';
import 'screens/register/select_locker.dart';



void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Locker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Inter',
        useMaterial3: true,
      ),
      initialRoute: '/openning',
      routes: {
        '/sign-in': (context) => const SignInScreen(),
        '/create-account': (context) => const CreateAccountScreen(),
        '/email-verification': (context) => const EmailVerificationScreen(),
        '/history': (context) => const HistoryScreen(),
        '/help_and_support': (context) => const HelpAndSupportScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/openning': (context) => const OpenningScreen(),
        '/home_screen': (context) => const HomeScreen(),
        '/payment_screen': (context) => const PaymentScreen(),
        '/success_screen': (context) => const SuccessScreen(),
        '/language': (context) => const LanguageScreen(),
        '/edit_profile': (context) => const EditProfilePage(),
        '/select_locker': (context) => const BookingLockerScreen(),

      },
    );
  }
}
