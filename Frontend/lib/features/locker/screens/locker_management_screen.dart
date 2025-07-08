import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_database/firebase_database.dart';
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

class LockerManagementScreen extends StatefulWidget {
  final String orderId;
  final Map<String, dynamic> locker;

  const LockerManagementScreen({super.key, required this.orderId, required this.locker});

  @override
  _LockerManagementScreenState createState() => _LockerManagementScreenState();
}

class _LockerManagementScreenState extends State<LockerManagementScreen> {
  final AuthService _authService = Get.find<AuthService>();
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  final PaymentService _paymentService = Get.find<PaymentService>();
  final FirebaseDatabase _database = FirebaseDatabase.instance;
  bool _isLoading = false;
  bool _isDataLoading = true;
  bool _showWebView = false;
  String? _snapToken;
  String _extensionOrderId = '';
  Duration _remainingTime = Duration.zero;
  Timer? _timer;
  StreamSubscription<DocumentSnapshot>? _lockerListener;
  StreamSubscription<DatabaseEvent>? _realtimeListener;
  Map<String, dynamic>? _orderData;
  Map<String, dynamic>? _lockerData;
  List<Map<String, dynamic>> _activityLog = [];
  late WebViewController _webViewController;

  @override
  void initState() {
    super.initState();
    print('LockerManagementScreen: Menginisialisasi untuk lockerId: ${widget.locker['lockerId']}, lockerNumber: ${widget.locker['lockerNumber']}');
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            print('LockerManagementScreen: WebView mulai memuat: $url');
          },
          onPageFinished: (String url) {
            print('LockerManagementScreen: WebView selesai memuat: $url');
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
            print('LockerManagementScreen: Error WebView: ${error.description}');
            _handleWebViewClose(error: error.description);
          },
        ),
      );
    _fetchData();
    _startTimer();
    _listenToLockerStatus();
    _listenToRealtimeStatus();
    _fetchActivityLog();
  }

  Future<void> _fetchData() async {
    setState(() => _isDataLoading = true);
    try {
      final orderDetails = await _firestoreService.getOrderDetails(widget.orderId);
      final lockerDetails = (orderDetails['orderDetails'] as List<dynamic>? ?? []).firstWhere(
        (item) => item['lockerId'] == widget.locker['lockerId'],
        orElse: () => <String, dynamic>{
          'lockerId': widget.locker['lockerId'],
          'lockerNumber': widget.locker['lockerNumber'] ?? 'Unknown',
          'hours': widget.locker['hours'] ?? 0,
          'endTime': widget.locker['endTime'],
        },
      );
      final lockerDoc = await _firestoreService.firestore.collection('lockers').doc(widget.locker['lockerId']).get();
      if (!lockerDoc.exists) {
        throw Exception('Data loker ${widget.locker['lockerId']} tidak ditemukan');
      }
      setState(() {
        _orderData = orderDetails['order'];
        _lockerData = {
          ...lockerDetails,
          'lockStatus': lockerDoc.data()?['lockStatus'] ?? 'locked',
          'doorStatus': lockerDoc.data()?['doorStatus'] ?? 'closed',
        };
        _isDataLoading = false;
      });
      print('LockerManagementScreen: Data loker dimuat: ${_lockerData!['lockerNumber']}');
      _updateRemainingTime();
    } catch (e) {
      print('LockerManagementScreen: Gagal memuat data loker: $e');
      setState(() => _isDataLoading = false);
      Get.snackbar('Error', 'Gagal memuat data loker: $e', backgroundColor: errorRed, colorText: backgroundWhite);
    }
  }

  Future<void> _fetchActivityLog() async {
    try {
      print('LockerManagementScreen: Mengambil riwayat aktivitas untuk lockerId: ${widget.locker['lockerId']}');
      final snapshot = await _firestoreService.firestore
          .collection('locker_activities')
          .where('lockerId', isEqualTo: widget.locker['lockerId'])
          .where('orderId', isEqualTo: widget.orderId)
          .orderBy('timestamp', descending: true)
          .limit(10)
          .get();
      setState(() {
        _activityLog = snapshot.docs.map((doc) => doc.data()).toList();
      });
      print('LockerManagementScreen: Ditemukan ${_activityLog.length} aktivitas untuk loker');
    } catch (e) {
      print('LockerManagementScreen: Gagal memuat riwayat aktivitas: $e');
      Get.snackbar('Error', 'Gagal memuat riwayat aktivitas: $e', backgroundColor: errorRed, colorText: backgroundWhite);
    }
  }

  void _listenToLockerStatus() {
    _lockerListener = _firestoreService.firestore
        .collection('lockers')
        .doc(widget.locker['lockerId'])
        .snapshots()
        .listen((snapshot) async {
      if (snapshot.exists) {
        final orderDetails = await _firestoreService.getOrderDetails(widget.orderId);
        final lockerDetails = (orderDetails['orderDetails'] as List<dynamic>? ?? []).firstWhere(
          (item) => item['lockerId'] == widget.locker['lockerId'],
          orElse: () => <String, dynamic>{
            'lockerId': widget.locker['lockerId'],
            'lockerNumber': widget.locker['lockerNumber'] ?? 'Unknown',
            'hours': widget.locker['hours'] ?? 0,
            'endTime': widget.locker['endTime'],
          },
        );
        setState(() {
          _lockerData = {
            ...lockerDetails,
            'lockStatus': snapshot.data()?['lockStatus'] ?? 'locked',
            'doorStatus': snapshot.data()?['doorStatus'] ?? 'closed',
          };
          _updateRemainingTime();
        });
        print('LockerManagementScreen: Status loker diperbarui: ${_lockerData!['lockerNumber']}');
      } else {
        print('LockerManagementScreen: Dokumen loker tidak ditemukan');
        setState(() => _isDataLoading = false);
        Get.snackbar('Error', 'Loker tidak ditemukan di Firestore', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }, onError: (e) {
      print('LockerManagementScreen: Gagal memantau status loker: $e');
      Get.snackbar('Error', 'Gagal memantau status loker: $e', backgroundColor: errorRed, colorText: backgroundWhite);
    });
  }

  void _listenToRealtimeStatus() {
    final lockerId = widget.locker['lockerId'];
    final lockerRef = _database.ref('lockers/$lockerId');
    _realtimeListener = lockerRef.onValue.listen((event) {
      final data = event.snapshot.value as Map<dynamic, dynamic>?;
      if (data != null) {
        print('LockerManagementScreen: Status loker diperbarui dari Realtime Database: $data');
        setState(() {
          _lockerData?['lockStatus'] = data['lockStatus'] ?? 'locked';
          _lockerData?['doorStatus'] = data['doorStatus'] ?? 'closed';
        });
        _logActivity('Status loker diperbarui: ${data['lockStatus']}', lockerId);
      } else {
        print('LockerManagementScreen: Data loker tidak ditemukan untuk lockerId: $lockerId');
        Get.snackbar('Error', 'Data loker tidak ditemukan di Realtime Database', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }, onError: (error) {
      print('LockerManagementScreen: Gagal mendengarkan status loker: $error');
      Get.snackbar('Error', 'Gagal mendengarkan status loker: $error', backgroundColor: errorRed, colorText: backgroundWhite);
    });
  }

  void _logActivity(String activity, String lockerId) async {
    try {
      await _firestoreService.firestore.collection('locker_activities').add({
        'lockerId': lockerId,
        'orderId': widget.orderId,
        'activity': activity,
        'timestamp': FieldValue.serverTimestamp(),
        'userId': _authService.currentUser?.uid,
      });
      await _fetchActivityLog();
    } catch (e) {
      print('LockerManagementScreen: Gagal mencatat aktivitas: $e');
    }
  }

  void _updateRemainingTime() {
    if (_lockerData == null) return;
    final endTime = _lockerData!['endTime'] as Timestamp?;
    print('LockerManagementScreen: Memeriksa endTime untuk lockerId: ${widget.locker['lockerId']}, endTime: $endTime');
    if (endTime != null && endTime.toDate().isAfter(DateTime.now())) {
      setState(() => _remainingTime = endTime.toDate().difference(DateTime.now()));
    } else {
      setState(() => _remainingTime = Duration.zero);
      if (_lockerData != null) {
        _firestoreService.firestore.runTransaction((transaction) async {
          final lockerRef = _firestoreService.firestore.collection('lockers').doc(_lockerData!['lockerId']);
          final orderRef = _firestoreService.firestore.collection('orders').doc(widget.orderId);
          final orderDetailRef = _firestoreService.firestore.collection('order_details').doc(_lockerData!['orderDetailId']);
          final lockerDoc = await transaction.get(lockerRef);
          if (!lockerDoc.exists) {
            print('LockerManagementScreen: Loker ${_lockerData!['lockerId']} tidak ditemukan');
            return;
          }
          transaction.update(lockerRef, {
            'bookingStatus': 'available',
            'currentOrderId': null,
            'lastUser': null,
            'lastUpdated': FieldValue.serverTimestamp(),
          });
          transaction.update(orderRef, {
            'orderStatus': 'completed',
            'updatedAt': FieldValue.serverTimestamp(),
          });
          transaction.update(orderDetailRef, {
            'status': 'completed',
            'updatedAt': FieldValue.serverTimestamp(),
          });
          print('LockerManagementScreen: Status loker ${_lockerData!['lockerId']} diperbarui ke available');
        }).catchError((e) {
          print('LockerManagementScreen: Gagal memperbarui status loker: $e');
        });
        Get.snackbar('Info', 'Loker ${_lockerData!['lockerNumber']} telah kedaluwarsa', backgroundColor: warningOrange, colorText: backgroundWhite);
        Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 0});
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) => _updateRemainingTime());
  }

  Future<void> _toggleLocker(bool isOpen) async {
    if (_lockerData == null) {
      Get.snackbar('Error', 'Data loker tidak tersedia', backgroundColor: errorRed, colorText: backgroundWhite);
      return;
    }
    setState(() => _isLoading = true);
    try {
      print('LockerManagementScreen: Mengontrol loker ${_lockerData!['lockerId']}, isOpen: $isOpen');
      await _authService.openLocker(_lockerData!['lockerId'], isOpen: isOpen);
      _logActivity('Loker ${isOpen ? 'dibuka' : 'dikunci'}', _lockerData!['lockerId']);
      Get.snackbar('Sukses', 'Loker ${_lockerData!['lockerNumber']} berhasil ${isOpen ? 'dibuka' : 'dikunci'}', backgroundColor: successGreen, colorText: backgroundWhite);
    } catch (e) {
      print('LockerManagementScreen: Gagal mengontrol loker: $e');
      Get.snackbar('Error', 'Gagal ${isOpen ? 'membuka' : 'mengunci'} loker: $e', backgroundColor: errorRed, colorText: backgroundWhite);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _extendDuration(int additionalHours) async {
    if (_lockerData == null) {
      Get.snackbar('Error', 'Data loker tidak tersedia', backgroundColor: errorRed, colorText: backgroundWhite);
      return;
    }
    setState(() => _isLoading = true);
    try {
      final user = _authService.currentUser;
      if (user == null) {
        print('LockerManagementScreen: Pengguna tidak terautentikasi');
        Get.snackbar('Error', 'Silakan login untuk memperpanjang durasi', backgroundColor: errorRed, colorText: backgroundWhite);
        Get.offAllNamed(AppRoutes.signIn);
        return;
      }

      print('LockerManagementScreen: Membuat transaksi untuk perpanjangan durasi lockerId: ${_lockerData!['lockerId']}');
      final pricePerHour = (_lockerData!['price'] as num) / (_lockerData!['hours'] as num);
      final additionalPrice = additionalHours * pricePerHour;
      _extensionOrderId = '${widget.orderId}-ext-${DateTime.now().millisecondsSinceEpoch}';

      final result = await _paymentService.getSnapToken(_extensionOrderId, additionalPrice);
      result.fold(
        (failure) {
          print('LockerManagementScreen: Gagal mendapatkan token: ${failure.message}');
          Get.snackbar('Error', 'Gagal memulai pembayaran: ${failure.message}', backgroundColor: errorRed, colorText: backgroundWhite);
          setState(() => _isLoading = false);
        },
        (tokenModel) {
          if (mounted) {
            setState(() {
              _snapToken = tokenModel.token;
              _showWebView = true;
              print('LockerManagementScreen: Memuat WebView dengan snapToken: $_snapToken');
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
      print('LockerManagementScreen: Gagal memulai pembayaran perpanjangan: $e');
      Get.snackbar('Error', 'Gagal memulai pembayaran perpanjangan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmExtension(int additionalHours) async {
    try {
      print('LockerManagementScreen: Mengkonfirmasi perpanjangan untuk lockerId: ${_lockerData!['lockerId']} sebanyak $additionalHours jam');
      final pricePerHour = (_lockerData!['price'] as num) / (_lockerData!['hours'] as num);
      final newHours = (_lockerData!['hours'] as num) + additionalHours;
      final newEndTime = (_lockerData!['endTime'] as Timestamp).toDate().add(Duration(hours: additionalHours));

      await _firestoreService.firestore.runTransaction((transaction) async {
        final orderDetailRef = _firestoreService.firestore.collection('order_details').doc(_lockerData!['orderDetailId']);
        final lockerRef = _firestoreService.firestore.collection('lockers').doc(_lockerData!['lockerId']);
        final lockerDoc = await transaction.get(lockerRef);
        if (!lockerDoc.exists || lockerDoc.data()!['bookingStatus'] != 'booked') {
          throw Exception('Loker sudah tidak tersedia atau tidak dalam status booked');
        }
        transaction.update(orderDetailRef, {
          'hours': newHours,
          'price': newHours * pricePerHour,
          'endTime': Timestamp.fromDate(newEndTime),
          'updatedAt': FieldValue.serverTimestamp(),
        });
        transaction.update(lockerRef, {
          'lastUpdated': FieldValue.serverTimestamp(),
        });
      });

      setState(() {
        _lockerData!['hours'] = newHours;
        _lockerData!['price'] = newHours * pricePerHour;
        _lockerData!['endTime'] = Timestamp.fromDate(newEndTime);
      });
      _logActivity('Durasi diperpanjang $additionalHours jam', _lockerData!['lockerId']);
      Get.snackbar('Sukses', 'Durasi loker ${_lockerData!['lockerNumber']} diperpanjang $additionalHours jam', backgroundColor: successGreen, colorText: backgroundWhite);
    } catch (e) {
      print('LockerManagementScreen: Gagal memperpanjang durasi: $e');
      Get.snackbar('Error', 'Gagal memperpanjang durasi: $e', backgroundColor: errorRed, colorText: backgroundWhite);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _startStatusPolling() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      print('LockerManagementScreen: Memulai polling status untuk extensionOrderId: $_extensionOrderId');
      final result = await _paymentService.pollTransactionStatus(_extensionOrderId, maxAttempts: 10, intervalSeconds: 2);
      result.fold(
        (failure) async {
          print('LockerManagementScreen: Gagal polling status: ${failure.message}');
          Get.snackbar('Error', 'Gagal memverifikasi pembayaran: ${failure.message}', backgroundColor: errorRed, colorText: backgroundWhite);
          setState(() => _isLoading = false);
          Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': _orderData?['locationId']});
        },
        (transaction) async {
          print('LockerManagementScreen: Status transaksi: ${transaction['transaction_status']}');
          if (transaction['transaction_status'] == 'settlement' || transaction['transaction_status'] == 'capture') {
            final additionalHours = (_lockerData!['additionalHours'] as num?)?.toInt() ?? 1;
            await _confirmExtension(additionalHours);
          } else if (['deny', 'cancel', 'expire'].contains(transaction['transaction_status'])) {
            Get.snackbar('Pembayaran Gagal', 'Status: ${transaction['transaction_status']}', backgroundColor: errorRed, colorText: backgroundWhite);
            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': _orderData?['locationId']});
          }
          setState(() => _isLoading = false);
        },
      );
    } catch (e) {
      print('LockerManagementScreen: Gagal memverifikasi pembayaran: $e');
      Get.snackbar('Error', 'Gagal memverifikasi pembayaran: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      setState(() => _isLoading = false);
      Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': _orderData?['locationId']});
    }
  }

  void _handleWebViewClose({String? error}) {
    print('LockerManagementScreen: Menangani penutupan WebView, error: ${error ?? 'tidak ada'}');
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
      Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': _orderData?['locationId']});
    }
  }

  void _showExtendDurationDialog() {
    int additionalHours = 1;
    final pricePerHour = (_lockerData!['price'] as num) / (_lockerData!['hours'] as num);
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Text('Perpanjang Durasi - ${_lockerData!['lockerNumber']}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Pilih tambahan durasi penyewaan:'),
              const SizedBox(height: 16),
              Slider(
                value: additionalHours.toDouble(),
                min: 1,
                max: 24,
                divisions: 23,
                activeColor: primaryBlue,
                label: '$additionalHours jam',
                onChanged: (value) => setDialogState(() => additionalHours = value.round()),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Tambahan: $additionalHours jam'),
                  Text('Rp ${(additionalHours * pricePerHour).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                print('LockerManagementScreen: Dialog perpanjangan durasi dibatalkan');
                Navigator.pop(context);
              },
              child: const Text('Batal'),
            ),
            ElevatedButton(
              onPressed: () async {
                print('LockerManagementScreen: Memilih tambahan $additionalHours jam');
                setState(() => _lockerData!['additionalHours'] = additionalHours);
                await _extendDuration(additionalHours);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(backgroundColor: primaryBlue, foregroundColor: backgroundWhite),
              child: const Text('Lanjutkan Pembayaran'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    print('LockerManagementScreen: Membersihkan listener dan timer...');
    _timer?.cancel();
    _lockerListener?.cancel();
    _realtimeListener?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isDataLoading || _lockerData == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: primaryBlue)),
      );
    }

    if (_showWebView && _snapToken != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Pembayaran Perpanjangan'),
          backgroundColor: backgroundWhite,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              print('LockerManagementScreen: Tombol kembali diklik di WebView');
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

    final lockerNumber = _lockerData!['lockerNumber'] ?? 'Unknown';
    final isOpen = _lockerData!['lockStatus'] == 'unlocked';

    return Scaffold(
      appBar: AppBar(
        title: Text('Kelola Loker $lockerNumber'),
        backgroundColor: backgroundWhite,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            print('LockerManagementScreen: Tombol kembali diklik, navigasi ke MainScreen tab Dashboard');
            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 0});
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
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: backgroundWhite,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(isOpen ? Icons.lock_open : Icons.lock, color: primaryBlue),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Loker $lockerNumber',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildDetailRow('Status Kunci', isOpen ? 'Terbuka' : 'Tertutup', isOpen ? successGreen : errorRed),
                          _buildDetailRow('Status Pintu', _lockerData!['doorStatus'] == 'open' ? 'Terbuka' : 'Tertutup',
                              _lockerData!['doorStatus'] == 'open' ? successGreen : errorRed),
                          _buildDetailRow('Durasi', '${_lockerData!['hours']} jam', textDark),
                          _buildDetailRow(
                            'Sisa Waktu',
                            '${_remainingTime.inHours}:${_remainingTime.inMinutes.remainder(60).toString().padLeft(2, '0')}:${_remainingTime.inSeconds.remainder(60).toString().padLeft(2, '0')}',
                            _remainingTime.inSeconds > 0 ? textDark : errorRed,
                          ),
                          const SizedBox(height: 12),
                          ExpansionTile(
                            title: const Text('Riwayat Aktivitas', style: TextStyle(fontWeight: FontWeight.bold)),
                            children: _activityLog.isEmpty
                                ? [const ListTile(title: Text('Belum ada aktivitas', style: TextStyle(color: textLight)))]
                                : _activityLog.map((activity) {
                                    final timestamp = (activity['timestamp'] as Timestamp?)?.toDate();
                                    return ListTile(
                                      title: Text(activity['activity'] ?? 'Aktivitas Tidak Diketahui'),
                                      subtitle: Text(timestamp != null
                                          ? '${timestamp.day}/${timestamp.month}/${timestamp.year} ${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}'
                                          : 'N/A'),
                                    );
                                  }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Tetap sticky di bawah
            Container(
              padding: const EdgeInsets.all(16),
              color: backgroundWhite,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Expanded(
                    child: PrimaryButton(
                      text: isOpen ? 'Kunci Loker' : 'Buka Loker',
                      icon: isOpen ? Icons.lock : Icons.lock_open,
                      onPressed: _isLoading ? () {} : () => _toggleLocker(!isOpen),
                      isLoading: _isLoading,
                      width: 150,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: PrimaryButton(
                      text: 'Perpanjang Durasi',
                      icon: Icons.timer,
                      onPressed: _isLoading || _remainingTime.inSeconds <= 0 ? () {} : _showExtendDurationDialog,
                      isSecondary: true,
                      width: 150,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              color: backgroundWhite,
              child: PrimaryButton(
                text: 'Kembali ke Dashboard',
                icon: Icons.home,
                onPressed: () {
                  print('LockerManagementScreen: Tombol kembali ke Dashboard diklik');
                  Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 0});
                },
                isSecondary: true,
              ),
            ),
          ],
        ),
      ),

    );
  }

  Widget _buildDetailRow(String label, String value, Color valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: textLight)),
          Expanded(
            child: Text(
              value,
              style: TextStyle(color: valueColor, fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}