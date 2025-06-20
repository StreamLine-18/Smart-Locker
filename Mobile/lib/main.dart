// main.dart
import 'package:flutter/material.dart';
import 'screens/register/sign_in.dart';
import 'screens/register/create_account.dart';
import 'screens/register/email_verification.dart';
import 'screens/register/history.dart';
import 'screens/register/help_and_support.dart';
import 'screens/register/profile.dart';
import 'screens/register/openning.dart';


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
      initialRoute: '/sign-in',
      routes: {
        '/sign-in': (context) => const SignInScreen(),
        '/create-account': (context) => const CreateAccountScreen(),
        '/email-verification': (context) => const EmailVerificationScreen(),
        '/history': (context) => const HistoryScreen(),
        '/help_and_support': (context) => const HelpAndSupportScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/openning': (context) => const OpenningScreen(),

      },
    );
  }
}
