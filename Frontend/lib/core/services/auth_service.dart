import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../core/constants/colors.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthService extends GetxService with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final Rx<User?> _user = Rx<User?>(null);

  User? get currentUser => _user.value;

  Future<AuthService> init() async {
    try {
      print('AuthService: Menginisialisasi autentikasi...');
      await Future.delayed(Duration.zero);
      _auth.authStateChanges().listen((user) {
        print('AuthService: Status autentikasi berubah, user: ${user?.uid ?? 'null'}, email: ${user?.email ?? 'null'}');
        _user.value = user;
        notifyListeners();
      });
      await _auth.authStateChanges().firstWhere((user) => true, orElse: () => null);
      print('AuthService: Inisialisasi selesai, currentUser: ${_user.value?.uid ?? 'null'}');
      return this;
    } catch (e) {
      print('AuthService: Gagal menginisialisasi autentikasi: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal menginisialisasi autentikasi: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> waitForAuthState() async {
    print('AuthService: Menunggu status autentikasi...');
    await _auth.authStateChanges().firstWhere((user) => true, orElse: () => null);
    print('AuthService: Status autentikasi diperoleh, currentUser: ${_user.value?.uid ?? 'null'}');
  }

  Future<void> signUp(String email, String password, String fullName) async {
    try {
      print('AuthService: Mendaftar pengguna dengan email: $email');
      final userCredential = await _auth.createUserWithEmailAndPassword(email: email, password: password);
      User? user = userCredential.user;

      if (user != null) {
        print('AuthService: Pengguna dibuat, UID: ${user.uid}, mengirim email verifikasi...');
        await user.sendEmailVerification();
        await user.updateDisplayName(fullName);
        await _firestore.collection('users').doc(user.uid).set({
          'uid': user.uid,
          'email': email,
          'name': fullName,
          'role': 'user',
          'emailVerified': false,
          'createdAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
        print('AuthService: Data pengguna disimpan di Firestore');
        notifyListeners();
      }
    } catch (e) {
      String errorMessage = 'Gagal mendaftar: $e';
      if (e is FirebaseAuthException) {
        switch (e.code) {
          case 'email-already-in-use':
            errorMessage = 'Email sudah digunakan.';
            break;
          case 'invalid-email':
            errorMessage = 'Email tidak valid.';
            break;
          case 'weak-password':
            errorMessage = 'Kata sandi terlalu lemah.';
            break;
        }
      }
      print('AuthService: Gagal mendaftar: $errorMessage');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', errorMessage, backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> signIn(String email, String password) async {
    try {
      print('AuthService: Mencoba login dengan email: $email');
      final userCredential = await _auth.signInWithEmailAndPassword(email: email, password: password);
      User? user = userCredential.user;

      if (user != null) {
        print('AuthService: Login berhasil, UID: ${user.uid}, memeriksa verifikasi email...');
        await user.reload();
        user = _auth.currentUser;
        if (user == null || !user.emailVerified) {
          await _auth.signOut();
          print('AuthService: Email belum diverifikasi untuk UID: ${user?.uid}');
          throw Exception('Email belum diverifikasi. Silakan cek email Anda.');
        }

        print('AuthService: Email terverifikasi, memeriksa data pengguna di Firestore...');
        final userDoc = await _firestore.collection('users').doc(user.uid).get();
        if (!userDoc.exists || (userDoc.data() != null && userDoc.data()!['emailVerified'] != user.emailVerified)) {
          await _firestore.collection('users').doc(user.uid).set({
            'uid': user.uid,
            'email': email,
            'name': user.displayName ?? 'No Name',
            'role': 'user',
            'emailVerified': user.emailVerified,
            'createdAt': userDoc.exists && userDoc.data() != null && userDoc.data()!['createdAt'] != null
                ? userDoc.data()!['createdAt']
                : FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
          print('AuthService: Data pengguna diperbarui di Firestore');
        }
        print('AuthService: Login selesai untuk UID: ${user.uid}');
        notifyListeners();
      }
    } catch (e) {
      String errorMessage = 'Gagal login: $e';
      if (e is FirebaseAuthException) {
        switch (e.code) {
          case 'user-not-found':
            errorMessage = 'Email tidak ditemukan.';
            break;
          case 'wrong-password':
            errorMessage = 'Kata sandi salah.';
            break;
        }
      }
      print('AuthService: Gagal login: $errorMessage');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', errorMessage, backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<bool> verifyEmailAndSaveUserData(String email, String password, String fullName) async {
    try {
      print('AuthService: Memeriksa verifikasi email untuk: $email');
      final userCredential = await _auth.signInWithEmailAndPassword(email: email, password: password);
      User? user = userCredential.user;

      if (user != null) {
        print('AuthService: Login untuk verifikasi, UID: ${user.uid}');
        await user.reload();
        user = _auth.currentUser;
        if (user != null && user.emailVerified) {
          print('AuthService: Email terverifikasi, menyimpan data pengguna...');
          await _firestore.collection('users').doc(user.uid).set({
            'uid': user.uid,
            'email': email,
            'name': fullName,
            'role': 'user',
            'emailVerified': true,
            'createdAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
          print('AuthService: Data pengguna tersimpan untuk UID: ${user.uid}');
          notifyListeners();
          return true;
        } else {
          print('AuthService: Email belum diverifikasi untuk UID: ${user?.uid}');
          await _auth.signOut();
          return false;
        }
      }
      throw Exception('Tidak ada pengguna yang login');
    } catch (e) {
      print('AuthService: Gagal memeriksa verifikasi: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal memeriksa verifikasi: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> resendVerificationEmail(String email, String password) async {
    try {
      print('AuthService: Mengirim ulang email verifikasi untuk: $email');
      final userCredential = await _auth.signInWithEmailAndPassword(email: email, password: password);
      User? user = userCredential.user;

      if (user != null && !user.emailVerified) {
        print('AuthService: Mengirim email verifikasi untuk UID: ${user.uid}');
        await user.sendEmailVerification();
        await _auth.signOut();
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('Sukses', 'Email verifikasi telah dikirim ulang ke $email.', backgroundColor: successGreen, colorText: backgroundWhite, snackPosition: SnackPosition.TOP);
        });
      } else if (user != null && user.emailVerified) {
        print('AuthService: Email sudah diverifikasi untuk UID: ${user.uid}');
        await _auth.signOut();
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('Info', 'Email sudah diverifikasi. Silakan login.', backgroundColor: primaryBlue, colorText: backgroundWhite);
        });
      }
    } catch (e) {
      print('AuthService: Gagal mengirim ulang email: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal mengirim ulang email: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      print('AuthService: Logout pengguna...');
      await _auth.signOut();
      print('AuthService: Logout berhasil');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Sukses', 'Berhasil logout', backgroundColor: successGreen, colorText: backgroundWhite);
      });
      notifyListeners();
    } catch (e) {
      print('AuthService: Gagal logout: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal logout: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> openLocker(String lockerId, {bool isOpen = true}) async {
    const maxRetries = 3;
    const timeout = Duration(seconds: 30);
    int retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        final user = _auth.currentUser;
        if (user == null) {
          print('AuthService: Pengguna belum login untuk openLocker, lockerId: $lockerId');
          throw Exception('Silakan login untuk mengontrol loker');
        }
        print('AuthService: Mengontrol loker $lockerId, action: ${isOpen ? 'unlock' : 'lock'}, UID: ${user.uid}, percobaan: ${retryCount + 1}');
        final lockerDoc = await _firestore.collection('lockers').doc(lockerId).get();
        if (!lockerDoc.exists) {
          print('AuthService: Loker $lockerId tidak ditemukan');
          throw Exception('Loker $lockerId tidak ditemukan');
        }
        final iotUrl = dotenv.env['IOT_BACKEND_URL'] ?? 'https://backend-smartlocker.vercel.app';
        print('AuthService: Mengirim permintaan ke IoT URL: $iotUrl/api/iot/lock');
        final response = await http.post(
          Uri.parse('$iotUrl/api/iot/lock'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'lockerId': lockerId,
            'action': isOpen ? 'unlock' : 'lock',
            'uid': user.uid,
          }),
        ).timeout(timeout);
        print('AuthService: Respon IoT: ${response.statusCode}, ${response.body}');
        if (response.statusCode != 200) {
          throw Exception('Gagal mengirim perintah ${isOpen ? 'buka' : 'kunci'} loker: ${response.body}');
        }
        await _firestore.collection('lockers').doc(lockerId).update({
          'lockStatus': isOpen ? 'unlocked' : 'locked',
          'doorStatus': isOpen ? 'open' : 'closed',
          'lastUpdated': FieldValue.serverTimestamp(),
          'lastUser': user.uid,
        });
        final logId = DateTime.now().millisecondsSinceEpoch.toString();
        await _firestore.collection('locker_logs').doc(logId).set({
          'logId': logId,
          'lockerId': lockerId,
          'action': isOpen ? 'unlock' : 'lock',
          'userId': user.uid,
          'timestamp': FieldValue.serverTimestamp(),
        });
        print('AuthService: Loker $lockerId berhasil ${isOpen ? 'dibuka' : 'dikunci'}');
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('Sukses', 'Loker $lockerId berhasil ${isOpen ? 'dibuka' : 'dikunci'}', backgroundColor: successGreen, colorText: backgroundWhite);
        });
        return;
      } catch (e) {
        retryCount++;
        if (retryCount >= maxRetries) {
          print('AuthService: Gagal ${isOpen ? 'membuka' : 'mengunci'} loker setelah $maxRetries percobaan: $e');
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Get.snackbar('Error', 'Gagal ${isOpen ? 'membuka' : 'mengunci'} loker: $e', backgroundColor: errorRed, colorText: backgroundWhite);
          });
          rethrow;
        }
        print('AuthService: Mencoba ulang (${retryCount}/$maxRetries) untuk loker $lockerId');
        await Future.delayed(const Duration(seconds: 2));
      }
    }
  }
}