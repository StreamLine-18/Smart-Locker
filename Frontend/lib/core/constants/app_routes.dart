import 'package:get/get.dart';
import 'package:smartlocker/core/constants/colors.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/email_verification_screen.dart';
import '../../features/locker/screens/dashboard_screen.dart';
import '../../features/locker/screens/booking_screen.dart';
import '../../features/locker/screens/cart_screen.dart';
import '../../features/locker/screens/payment_selection_screen.dart';
import '../../features/locker/screens/booking_confirmation_screen.dart';
import '../../features/locker/screens/history_screen.dart';
import '../../features/locker/screens/locker_management_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/main/screens/main_screen.dart';
import '../../core/services/auth_service.dart';
import '../../core/services/firestore_service.dart';
import '../../core/services/payment_service.dart';

class AppRoutes {
  static const String splash = '/splash';
  static const String signIn = '/signIn';
  static const String login = '/login'; // Alias untuk signIn
  static const String createAccount = '/createAccount';
  static const String emailVerification = '/emailVerification';
  static const String main = '/main';
  static const String dashboard = '/dashboard';
  static const String booking = '/booking';
  static const String cart = '/cart';
  static const String paymentSelection = '/paymentSelection';
  static const String bookingConfirmation = '/bookingConfirmation';
  static const String lockerManagement = '/lockerManagement';
  static const String history = '/history';
  static const String profile = '/profile';

  static final bindings = BindingsBuilder(() {
    Get.lazyPut<AuthService>(() => AuthService(), fenix: true);
    Get.lazyPut<FirestoreService>(() => FirestoreService(), fenix: true);
    Get.lazyPut<PaymentService>(() => PaymentService(), fenix: true);
  });

  static final routes = [
    GetPage(
      name: splash,
      page: () => const SplashScreen(),
      binding: bindings,
    ),
    GetPage(
      name: signIn,
      page: () => const LoginScreen(),
      binding: bindings,
    ),
    GetPage(
      name: login,
      page: () => const LoginScreen(),
      binding: bindings,
    ),
    GetPage(
      name: createAccount,
      page: () => const RegisterScreen(),
      binding: bindings,
    ),
    GetPage(
      name: emailVerification,
      page: () => const EmailVerificationScreen(),
      binding: bindings,
    ),
    GetPage(
      name: main,
      page: () => const MainScreen(),
      binding: bindings,
    ),
    GetPage(
      name: dashboard,
      page: () => const DashboardScreen(),
      binding: bindings,
    ),
    GetPage(
      name: booking,
      page: () => const BookingScreen(),
      binding: bindings,
    ),
    GetPage(
      name: cart,
      page: () {
        final args = Get.arguments as Map<String, dynamic>? ?? {};
        final cartItems = args['cartItems'] as List<Map<String, dynamic>>? ?? [];
        return CartScreen(cartItems: cartItems);
      },
      binding: bindings,
    ),
    GetPage(
      name: paymentSelection,
      page: () => const PaymentSelectionScreen(),
      binding: bindings,
    ),
    GetPage(
      name: bookingConfirmation,
      page: () => const BookingConfirmationScreen(),
      binding: bindings,
    ),
    GetPage(
      name: lockerManagement,
      page: () {
        final args = Get.arguments as Map<String, dynamic>? ?? {};
        final orderId = args['orderId']?.toString() ?? '';
        final locker = args['locker'] as Map<String, dynamic>? ?? {};
        if (orderId.isEmpty || locker.isEmpty) {
          Get.snackbar('Error', 'Parameter loker tidak valid', backgroundColor: errorRed, colorText: backgroundWhite);
          return const MainScreen();
        }
        return LockerManagementScreen(orderId: orderId, locker: locker);
      },
      binding: bindings,
    ),
    GetPage(
      name: history,
      page: () => const HistoryScreen(),
      binding: bindings,
    ),
    GetPage(
      name: profile,
      page: () => const ProfileScreen(),
      binding: bindings,
    ),
  ];
}