import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/services/payment_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../../auth/widgets/primary_button.dart';

class PaymentSelectionScreen extends StatefulWidget {
  const PaymentSelectionScreen({super.key});

  @override
  _PaymentSelectionScreenState createState() => _PaymentSelectionScreenState();
}

class _PaymentSelectionScreenState extends State<PaymentSelectionScreen> {
  final AuthService _authService = Get.find<AuthService>();
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  final PaymentService _paymentService = Get.find<PaymentService>();
  bool _isLoading = false;
  bool _showWebView = false;
  String? _snapToken;
  String? _selectedPaymentMethod;
  final List<String> _paymentMethods = ['credit_card', 'bank_transfer', 'gopay', 'shopeepay'];
  late WebViewController _webViewController;
  String _orderId = '';
  StreamSubscription? _orderListener;

  @override
  void initState() {
    super.initState();
    print('PaymentSelectionScreen: Menginisialisasi state...');
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            print('PaymentSelectionScreen: WebView mulai memuat: $url');
          },
          onPageFinished: (String url) {
            print('PaymentSelectionScreen: WebView selesai memuat: $url');
            if (url.contains('finish') || url.contains('success')) {
              if (mounted) {
                setState(() {
                  _showWebView = false;
                  _isLoading = true;
                });
              }
              _startStatusPolling();
            } else if (url.contains('error') || url.contains('unfinish')) {
              _handleWebViewClose();
            }
          },
          onWebResourceError: (error) {
            print('PaymentSelectionScreen: Error WebView: ${error.description}');
            _handleWebViewClose(error: error.description);
          },
        ),
      );
    final args = Get.arguments as Map? ?? {};
    _orderId = args['orderId']?.toString() ?? '';
    if (_orderId.isNotEmpty) {
      _listenToOrderStatus(_orderId);
    }
  }

  void _handleWebViewClose({String? error}) {
    print('PaymentSelectionScreen: Menangani penutupan WebView, error: ${error ?? 'tidak ada'}');
    if (mounted) {
      setState(() {
        _showWebView = false;
        _isLoading = false;
      });
      Get.snackbar(
        error != null ? 'Error' : 'Pembayaran Dibatalkan',
        error != null ? 'Gagal memuat pembayaran: $error' : 'Silakan coba lagi',
        backgroundColor: error != null ? errorRed : warningOrange,
        colorText: backgroundWhite,
        duration: const Duration(seconds: 3),
      );
      _orderListener?.cancel();
      _cancelPendingOrder();
      print('PaymentSelectionScreen: Navigasi kembali ke MainScreen tab Booking');
      if (_authService.currentUser == null) {
        print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
        Get.offAllNamed(AppRoutes.signIn);
      } else {
        try {
          Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
        } catch (e) {
          print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
          Get.offAllNamed(AppRoutes.main);
        }
      }
    }
  }

  void _listenToOrderStatus(String orderId) {
    print('PaymentSelectionScreen: Mendengarkan status pesanan untuk orderId: $orderId');
    _orderListener?.cancel();
    _orderListener = _firestoreService.firestore
        .collection('orders')
        .doc(orderId)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.exists) {
        final data = snapshot.data()!;
        print('PaymentSelectionScreen: Status pesanan diperbarui: ${data['orderStatus']}, ${data['paymentStatus']}');
        if (data['orderStatus'] == 'confirmed' && data['paymentStatus'] == 'success') {
          _orderListener?.cancel();
          _clearCart();
          if (mounted) {
            print('PaymentSelectionScreen: Navigasi ke BookingConfirmationScreen');
            Get.offAllNamed(AppRoutes.bookingConfirmation, arguments: {
              'orderId': orderId,
              'transaction': data,
              'totalPrice': Get.arguments['totalPrice'],
              'locationId': Get.arguments['locationId'],
              'cartItems': Get.arguments['cartItems'],
            });
          }
        } else if (data['orderStatus'] == 'cancelled' || data['paymentStatus'] == 'failed' || data['paymentStatus'] == 'expired') {
          _orderListener?.cancel();
          if (mounted) {
            setState(() => _showWebView = false);
          }
          _cancelPendingOrder();
          if (mounted) {
            print('PaymentSelectionScreen: Navigasi kembali ke MainScreen tab Booking karena pembayaran gagal');
            Get.snackbar('Pembayaran Dibatalkan', 'Silakan coba lagi', backgroundColor: warningOrange, colorText: backgroundWhite);
            if (_authService.currentUser == null) {
              print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
              Get.offAllNamed(AppRoutes.signIn);
            } else {
              try {
                Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
              } catch (e) {
                print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
                Get.offAllNamed(AppRoutes.main);
              }
            }
          }
        }
      }
    }, onError: (e) {
      print('PaymentSelectionScreen: Gagal mendengarkan status pesanan: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal memantau status pesanan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
        if (_authService.currentUser == null) {
          print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
          Get.offAllNamed(AppRoutes.signIn);
        } else {
          try {
            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
          } catch (e) {
            print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
            Get.offAllNamed(AppRoutes.main);
          }
        }
      }
    });
  }

  Future<void> _clearCart() async {
    try {
      final args = Get.arguments as Map? ?? {};
      final List<Map<String, dynamic>> cartItems = (args['cartItems'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      print('PaymentSelectionScreen: Mengosongkan keranjang untuk ${cartItems.length} item');
      await _firestoreService.firestore.runTransaction((transaction) async {
        for (var item in cartItems) {
          final cartRef = _firestoreService.firestore.collection('cart').doc(item['cartId']);
          final lockerRef = _firestoreService.firestore.collection('lockers').doc(item['lockerId']);
          transaction.delete(cartRef);
          transaction.update(lockerRef, {
            'bookingStatus': 'booked',
            'lastUpdated': FieldValue.serverTimestamp(),
            'lastUser': _authService.currentUser?.uid,
            'currentOrderId': _orderId,
          });
        }
      });
      print('PaymentSelectionScreen: Keranjang dikosongkan');
      if (mounted) {
        Get.snackbar('Sukses', 'Keranjang telah dikosongkan setelah pembayaran', backgroundColor: successGreen, colorText: backgroundWhite);
      }
    } catch (e) {
      print('PaymentSelectionScreen: Gagal mengosongkan keranjang: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal mengosongkan keranjang: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  Future<void> _startStatusPolling() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      print('PaymentSelectionScreen: Memulai polling status untuk orderId: $_orderId');
      final result = await _paymentService.pollTransactionStatus(_orderId, maxAttempts: 10, intervalSeconds: 2);
      result.fold(
        (failure) async {
          print('PaymentSelectionScreen: Gagal polling status: ${failure.message}');
          if (failure.message.contains('not_found')) {
            print('PaymentSelectionScreen: Mencoba membuat ulang token Snap untuk orderId: $_orderId');
            final args = Get.arguments as Map? ?? {};
            final double totalPrice = (args['totalPrice'] as num?)?.toDouble() ?? 0.0;
            final retryResult = await _paymentService.getSnapToken(_orderId, totalPrice);
            retryResult.fold(
              (retryFailure) {
                print('PaymentSelectionScreen: Gagal retry token: ${retryFailure.message}');
                if (mounted) {
                  Get.snackbar('Error', 'Gagal memverifikasi pembayaran: ${retryFailure.message}', backgroundColor: errorRed, colorText: backgroundWhite);
                  if (_authService.currentUser == null) {
                    print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
                    Get.offAllNamed(AppRoutes.signIn);
                  } else {
                    try {
                      Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
                    } catch (e) {
                      print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
                      Get.offAllNamed(AppRoutes.main);
                    }
                  }
                }
              },
              (tokenModel) {
                if (mounted) {
                  setState(() {
                    _snapToken = tokenModel.token;
                    _showWebView = true;
                    print('PaymentSelectionScreen: Retry berhasil, memuat WebView dengan snapToken: $_snapToken');
                    _webViewController.loadHtmlString(
                      '''
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <script type="text/javascript" src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="${_paymentService.clientKey}"></script>
                      </head>
                      <body>
                        <script type="text/javascript">
                          window.snap.pay('$_snapToken', {
                            onSuccess: function(result) { window.location = '/finish'; },
                            onPending: function(result) { window.location = '/finish'; },
                            onError: function(result) { window.location = '/error'; },
                            onClose: function() { window.location = '/unfinish'; }
                          });
                        </script>
                      </body>
                      </html>
                      ''',
                      baseUrl: 'https://app.sandbox.midtrans.com',
                    );
                  });
                }
              },
            );
          } else {
            if (mounted) {
              Get.snackbar('Error', 'Gagal memverifikasi pembayaran: ${failure.message}', backgroundColor: errorRed, colorText: backgroundWhite);
              if (_authService.currentUser == null) {
                print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
                Get.offAllNamed(AppRoutes.signIn);
              } else {
                try {
                  Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
                } catch (e) {
                  print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
                  Get.offAllNamed(AppRoutes.main);
                }
              }
            }
          }
        },
        (transaction) async {
          print('PaymentSelectionScreen: Status transaksi: ${transaction['transaction_status']}');
          if (transaction['transaction_status'] == 'settlement' || transaction['transaction_status'] == 'capture') {
            await _firestoreService.confirmOrder(
              _orderId,
              transaction['transaction_id'] ?? '',
              '${dotenv.env['MIDTRANS_SUCCESS_URL'] ?? 'https://backend-smartlocker.vercel.app/invoice'}?orderId=$_orderId',
            );
          } else if (['deny', 'cancel', 'expire'].contains(transaction['transaction_status'])) {
            await _cancelPendingOrder();
            if (mounted) {
              Get.snackbar('Pembayaran Gagal', 'Status: ${transaction['transaction_status']}', backgroundColor: errorRed, colorText: backgroundWhite);
              if (_authService.currentUser == null) {
                print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
                Get.offAllNamed(AppRoutes.signIn);
              } else {
                try {
                  Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
                } catch (e) {
                  print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
                  Get.offAllNamed(AppRoutes.main);
                }
              }
            }
          }
        },
      );
    } catch (e) {
      print('PaymentSelectionScreen: Gagal memverifikasi pembayaran: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal memverifikasi pembayaran: $e', backgroundColor: errorRed, colorText: backgroundWhite);
        if (_authService.currentUser == null) {
          print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
          Get.offAllNamed(AppRoutes.signIn);
        } else {
          try {
            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
          } catch (e) {
            print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
            Get.offAllNamed(AppRoutes.main);
          }
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _cancelPendingOrder() async {
    try {
      print('PaymentSelectionScreen: Membatalkan pesanan dengan orderId: $_orderId');
      await _firestoreService.cancelPendingOrder(_orderId);
      final args = Get.arguments as Map? ?? {};
      final List<Map<String, dynamic>> cartItems = (args['cartItems'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      await _firestoreService.firestore.runTransaction((transaction) async {
        for (var item in cartItems) {
          final lockerRef = _firestoreService.firestore.collection('lockers').doc(item['lockerId']);
          transaction.update(lockerRef, {
            'bookingStatus': 'available',
            'lastUpdated': FieldValue.serverTimestamp(),
            'lastUser': null,
            'currentOrderId': null,
          });
        }
      });
      print('PaymentSelectionScreen: Pesanan dibatalkan, keranjang dipertahankan');
    } catch (e) {
      print('PaymentSelectionScreen: Gagal membatalkan pesanan: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal membatalkan pesanan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  Future<void> _processPayment() async {
    if (_selectedPaymentMethod == null) {
      if (mounted) {
        Get.snackbar('Error', 'Pilih metode pembayaran terlebih dahulu', backgroundColor: errorRed, colorText: backgroundWhite);
      }
      return;
    }
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final user = _authService.currentUser;
      if (user == null) {
        print('PaymentSelectionScreen: Pengguna tidak terautentikasi');
        if (mounted) {
          Get.snackbar('Error', 'Silakan login untuk melanjutkan pembayaran', backgroundColor: errorRed, colorText: backgroundWhite);
          Get.offAllNamed(AppRoutes.signIn);
        }
        return;
      }
      final args = Get.arguments as Map? ?? {};
      final List<Map<String, dynamic>> cartItems = (args['cartItems'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final double totalPrice = (args['totalPrice'] as num?)?.toDouble() ?? 0.0;
      final String locationId = args['locationId']?.toString() ?? '';
      print('PaymentSelectionScreen: Memproses pembayaran untuk ${cartItems.length} item, totalPrice: $totalPrice, locationId: $locationId');
      if (locationId.isEmpty) throw Exception('Lokasi tidak dipilih');
      if (cartItems.isEmpty) throw Exception('Keranjang kosong');

      for (var item in cartItems) {
        final cartDoc = await _firestoreService.firestore.collection('cart').doc(item['cartId']).get();
        if (!cartDoc.exists) throw Exception('Item keranjang ${item['lockerNumber']} tidak valid');
      }

      if (_orderId.isEmpty) {
        _orderId = await _firestoreService.createPendingOrder(user.uid, cartItems, locationId);
        args['orderId'] = _orderId;
      }
      _listenToOrderStatus(_orderId);
      final result = await _paymentService.getSnapToken(_orderId, totalPrice);
      result.fold(
        (failure) {
          print('PaymentSelectionScreen: Gagal mendapatkan token: ${failure.message}');
          if (mounted) {
            Get.snackbar('Error', 'Gagal mendapatkan token: ${failure.message}', backgroundColor: errorRed, colorText: backgroundWhite);
            if (_authService.currentUser == null) {
              print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
              Get.offAllNamed(AppRoutes.signIn);
            } else {
              try {
                Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
              } catch (e) {
                print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
                Get.offAllNamed(AppRoutes.main);
              }
            }
          }
        },
        (tokenModel) {
          if (mounted) {
            setState(() {
              _snapToken = tokenModel.token;
              _showWebView = true;
              print('PaymentSelectionScreen: Memuat WebView dengan snapToken: $_snapToken');
              _webViewController.loadHtmlString(
                '''
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script type="text/javascript" src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="${_paymentService.clientKey}"></script>
                </head>
                <body>
                  <script type="text/javascript">
                    window.snap.pay('$_snapToken', {
                      onSuccess: function(result) { window.location = '/finish'; },
                      onPending: function(result) { window.location = '/finish'; },
                      onError: function(result) { window.location = '/error'; },
                      onClose: function() { window.location = '/unfinish'; }
                    });
                  </script>
                </body>
                </html>
                ''',
                baseUrl: 'https://app.sandbox.midtrans.com',
              );
            });
          }
        },
      );
    } catch (e) {
      print('PaymentSelectionScreen: Gagal memproses pembayaran: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal memproses pembayaran: $e', backgroundColor: errorRed, colorText: backgroundWhite);
        if (_authService.currentUser == null) {
          print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
          Get.offAllNamed(AppRoutes.signIn);
        } else {
          try {
            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
          } catch (e) {
            print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
            Get.offAllNamed(AppRoutes.main);
          }
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    print('PaymentSelectionScreen: Membersihkan listener...');
    _orderListener?.cancel();
    super.dispose();
  }

  Widget _buildOrderSummary(List<Map<String, dynamic>> cartItems, double totalPrice) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundWhite,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Ringkasan Pesanan', style: TextStyle(fontWeight: FontWeight.bold)),
          Text('${cartItems.length} loker dipilih', style: const TextStyle(color: textLight)),
          const Divider(),
          ...cartItems.map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(child: Text(item['lockerNumber'] ?? 'Loker Tidak Valid')),
                    Text('Rp ${item['price'].toStringAsFixed(0)}'),
                  ],
                ),
              )),
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('Rp ${totalPrice.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: primaryBlue)),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final args = Get.arguments as Map? ?? {};
    final List<Map<String, dynamic>> cartItems = (args['cartItems'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final double totalPrice = (args['totalPrice'] as num?)?.toDouble() ?? 0.0;

    print('PaymentSelectionScreen: Membangun UI, _showWebView: $_showWebView, _cartItems: ${cartItems.length}, _isLoading: $_isLoading');
    if (_showWebView && _snapToken != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Pembayaran'),
          backgroundColor: backgroundWhite,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              print('PaymentSelectionScreen: Tombol kembali diklik');
              _handleWebViewClose();
            },
          ),
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _webViewController),
            if (_isLoading)
              Container(
                color: Colors.black.withOpacity(0.5),
                child: const Center(child: CircularProgressIndicator(color: primaryBlue)),
              ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pilih Metode Pembayaran'),
        backgroundColor: backgroundWhite,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            print('PaymentSelectionScreen: Tombol kembali diklik, navigasi ke MainScreen tab Booking');
            if (_authService.currentUser == null) {
              print('PaymentSelectionScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
              Get.offAllNamed(AppRoutes.signIn);
            } else {
              try {
                Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': Get.arguments['locationId']});
              } catch (e) {
                print('PaymentSelectionScreen: Gagal navigasi ke MainScreen: $e');
                Get.offAllNamed(AppRoutes.main);
              }
            }
          },
        ),
      ),
      body: Container(
        color: backgroundWhite,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildOrderSummary(cartItems, totalPrice),
                    const Text('Metode Pembayaran', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedPaymentMethod,
                      hint: const Text('Pilih Metode Pembayaran'),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: surfaceGray,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                      ),
                      onChanged: (value) => setState(() => _selectedPaymentMethod = value),
                      items: _paymentMethods
                          .map((method) => DropdownMenuItem(
                                value: method,
                                child: Text(
                                  method == 'credit_card'
                                      ? 'Kartu Kredit'
                                      : method == 'bank_transfer'
                                          ? 'Transfer Bank'
                                          : method == 'gopay'
                                              ? 'Gopay'
                                              : 'ShopeePay',
                                ),
                              ))
                          .toList(),
                      dropdownColor: backgroundWhite,
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              color: backgroundWhite,
              child: PrimaryButton(
                text: _isLoading ? 'Memproses...' : 'Bayar Sekarang',
                icon: Icons.payment,
                onPressed: _isLoading ? () {} : _processPayment,
                isLoading: _isLoading,
              ),
            ),
          ],
        ),
      ),
    );
  }
}