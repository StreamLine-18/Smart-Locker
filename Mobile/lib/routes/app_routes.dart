import 'package:flutter/material.dart';
import '../screens/register/edit_profile.dart';
import '../screens/register/home_screen.dart';
import '../screens/register/payment_screen.dart';
import '../screens/register/success_screen.dart';
import '../screens/register/sign_in.dart';
import '../screens/register/create_account.dart';
import '../screens/register/email_verification.dart';
import '../screens/register/history.dart';
import '../screens/register/help_and_support.dart';
import '../screens/register/profile.dart';
import '../screens/register/openning.dart';
import '../screens/register/language.dart';
import '../screens/register/select_locker.dart';


class AppRoutes {
  static const String home = '/home';
  static const String payment = '/payment';
  static const String success = '/success';
  static const String signIn = '/sign-in';
  static const String createAccount = '/create-account';
  static const String emailVerification = '/email-verification';
  static const String history = '/history';
  static const String helpAndSupport = '/help_and_support';
  static const String profile = '/profile';
  static const String openning = '/openning';
  static const String language = '/language';
  static const String editProfile = '/edit_profile';
  static const String selectLocker = '/select_locker';




  static final Map<String, WidgetBuilder> routes = {
    home: (context) => const HomeScreen(),
    payment: (context) => const PaymentScreen(),
    success: (context) => const SuccessScreen(),
    signIn: (context) => const SignInScreen(),
    createAccount: (context) => const CreateAccountScreen(),
    emailVerification: (context) => const EmailVerificationScreen(),
    history: (context) => const HistoryScreen(),
    helpAndSupport: (context) => const HelpAndSupportScreen(),
    profile: (context) => const ProfileScreen(),
    openning: (context) => const OpenningScreen(),
    language: (context) => const LanguageScreen(),
    editProfile: (context) => const EditProfilePage(),
    selectLocker: (context) => const SelectLockerScreen(),

  };
}
