// main.dart
import 'package:flutter/material.dart';
import 'screens/register/sign_in.dart';
import 'screens/register/create_account.dart';
import 'screens/register/email_verification.dart';

void main() {
  runApp(const MyApp());
}

//  Test 123
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
      },
    );
  }
}
