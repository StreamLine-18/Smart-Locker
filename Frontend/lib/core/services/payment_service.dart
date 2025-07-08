import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:get/get.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart' as dotenv;
import 'package:dartz/dartz.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../common/failure.dart';
import '../../common/token_model.dart';
import 'dart:async';

class PaymentService extends GetxService {
  final String _backendUrl = dotenv.dotenv.env['BACKEND_URL'] ?? '';
  final String _clientKey = dotenv.dotenv.env['MIDTRANS_CLIENT_KEY'] ?? '';

  @override
  void onInit() {
    super.onInit();
    if (_clientKey.isEmpty) {
      print('Error: MIDTRANS_CLIENT_KEY kosong di .env');
    }
    if (_backendUrl.isEmpty) {
      print('Error: BACKEND_URL kosong di .env');
    }
    print('PaymentService diinisialisasi dengan clientKey: $_clientKey, backendUrl: $_backendUrl');
  }

  Future<Either<Failure, TokenModel>> getSnapToken(String orderId, double amount) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('Error: Pengguna tidak terautentikasi');
        return left(ServerFailure(
          data: 'Pengguna tidak terautentikasi',
          code: 401,
          message: 'Gagal mendapatkan token Snap',
        ));
      }

      print('Mengambil token Snap untuk pesanan: $orderId, jumlah: $amount, email: ${user.email}, uid: ${user.uid}');
      final response = await http.post(
        Uri.parse('$_backendUrl/api/payment/token'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'orderId': orderId,
          'amount': amount,
          'email': user.email,
          'uid': user.uid,
        }),
      );

      print('Respon Backend: ${response.statusCode}, ${response.body}');
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return right(TokenModel(token: jsonResponse['token']));
      } else {
        return left(ServerFailure(
          data: response.body,
          code: response.statusCode,
          message: 'Gagal mendapatkan token Snap',
        ));
      }
    } catch (e) {
      print('Gagal mendapatkan token Snap: $e');
      return left(ServerFailure(
        data: e.toString(),
        code: 400,
        message: 'Unknown Error',
      ));
    }
  }

  Future<Either<Failure, Map<String, dynamic>>> getTransactionStatus(String orderId) async {
    try {
      print('Memeriksa status transaksi untuk pesanan: $orderId');
      final response = await http.get(
        Uri.parse('$_backendUrl/api/payment/status/$orderId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      );

      print('Respon Backend: ${response.statusCode}, ${response.body}');
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return right(jsonResponse);
      } else {
        return left(ServerFailure(
          data: response.body,
          code: response.statusCode,
          message: 'Gagal mendapatkan status transaksi',
        ));
      }
    } catch (e) {
      print('Gagal mendapatkan status transaksi: $e');
      return left(ServerFailure(
        data: e.toString(),
        code: 400,
        message: 'Unknown Error',
      ));
    }
  }

  Future<Either<Failure, Map<String, dynamic>>> pollTransactionStatus(String orderId, {int maxAttempts = 10, int intervalSeconds = 10}) async {
    try {
      for (int attempt = 1; attempt <= maxAttempts; attempt++) {
        print('Polling status transaksi ke-$attempt untuk pesanan: $orderId');
        final result = await getTransactionStatus(orderId);
        if (result.isRight()) {
          final transaction = result.getOrElse(() => {});
          final status = transaction['transaction_status'];
          if (status == 'settlement' || status == 'capture') {
            return right(transaction);
          } else if (status == 'deny' || status == 'cancel' || status == 'expire') {
            return left(ServerFailure(
              data: transaction.toString(),
              code: 400,
              message: 'Transaksi gagal: $status',
            ));
          }
        }
        await Future.delayed(Duration(seconds: intervalSeconds));
      }
      return left(ServerFailure(
        data: 'Timeout',
        code: 408,
        message: 'Gagal mendapatkan status transaksi setelah $maxAttempts percobaan',
      ));
    } catch (e) {
      print('Gagal polling status transaksi: $e');
      return left(ServerFailure(
        data: e.toString(),
        code: 400,
        message: 'Unknown Error',
      ));
    }
  }

  String get clientKey => _clientKey;
}