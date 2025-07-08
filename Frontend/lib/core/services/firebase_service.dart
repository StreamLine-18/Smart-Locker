import 'package:firebase_core/firebase_core.dart';
import 'package:get/get.dart';
import '../../firebase_options.dart';
import 'package:flutter/foundation.dart';
import '../constants/colors.dart';

class FirebaseInitService extends GetxService {
  Future<FirebaseInitService> init() async {
    try {
      print('Menginisialisasi Firebase...');
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      print('Firebase berhasil diinisialisasi');
      return this;
    } catch (e) {
      print('Gagal menginisialisasi Firebase: $e');
      Get.snackbar('Error', 'Gagal menginisialisasi Firebase: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      rethrow;
    }
  }
}