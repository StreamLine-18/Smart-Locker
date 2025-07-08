import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart' as dotenv;
import 'package:get/get.dart';
import 'package:smartlocker/core/services/cart_controller.dart';
import 'core/services/firebase_service.dart';
import 'core/constants/app_routes.dart';
import 'core/constants/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.dotenv.load(fileName: ".env");
  } catch (e) {
    print('Gagal memuat .env: $e');
  }
  try {
    await Get.putAsync(() => FirebaseInitService().init());
  } catch (e) {
    print('Gagal menginisialisasi Firebase: $e');
  }
  try {
    await Get.put(CartController());
  } catch (e){
    print('gagal untuk menggunakan controller');
  }
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'Smart Locker',
      debugShowCheckedModeBanner: false,
      theme: appTheme(),
      initialRoute: AppRoutes.splash,
      getPages: AppRoutes.routes,
    );
  }
}