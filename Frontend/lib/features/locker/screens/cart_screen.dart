import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/services/payment_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../../auth/widgets/primary_button.dart';

class CartScreen extends StatefulWidget {
  final List<Map<String, dynamic>> cartItems;
  const CartScreen({super.key, required this.cartItems});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final AuthService _authService = Get.find<AuthService>();
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  final PaymentService _paymentService = Get.find<PaymentService>();
  List<Map<String, dynamic>> _cartItems = [];
  String? _locationId;
  bool _isLoading = false;
  Timer? _cartTimeoutTimer;

  double get totalPrice => _cartItems.fold(0.0, (sum, item) => sum + (item['price'] as num));

  @override
  void initState() {
    super.initState();
    print('CartScreen: Menginisialisasi state...');
    final args = Get.arguments as Map<String, dynamic>? ?? {};
    _cartItems = List<Map<String, dynamic>>.from(widget.cartItems);
    _locationId = args['locationId'] as String?;
    print('CartScreen: Inisialisasi _cartItems: ${_cartItems.length}, _locationId: $_locationId');
    _authService.init().then((_) {
      if (_authService.currentUser == null) {
        print('CartScreen: Pengguna tidak terautentikasi saat inisialisasi, navigasi ke SignIn');
        Get.offAllNamed(AppRoutes.signIn);
      } else {
        _verifyCartItems();
        _startCartTimeout();
      }
    });
  }

  void _startCartTimeout() {
    _cartTimeoutTimer = Timer(const Duration(minutes: 2), () async {
      print('CartScreen: Timeout 2 menit tercapai, mengosongkan keranjang...');
      try {
        await _firestoreService.firestore.runTransaction((transaction) async {
          for (var item in _cartItems) {
            final cartRef = _firestoreService.firestore.collection('cart').doc(item['cartId']);
            final lockerRef = _firestoreService.firestore.collection('lockers').doc(item['lockerId']);
            transaction.delete(cartRef);
            transaction.update(lockerRef, {
              'bookingStatus': 'available',
              'lastUpdated': FieldValue.serverTimestamp(),
              'lastUser': null,
              'currentOrderId': null,
            });
          }
        });
        if (mounted) {
          setState(() => _cartItems.clear());
          Get.snackbar('Peringatan', 'Keranjang dikosongkan karena tidak di-checkout dalam 2 menit', backgroundColor: warningOrange, colorText: backgroundWhite);
        }
      } catch (e) {
        print('CartScreen: Gagal mengosongkan keranjang setelah timeout: $e');
        if (mounted) {
          Get.snackbar('Error', 'Gagal mengosongkan keranjang: $e', backgroundColor: errorRed, colorText: backgroundWhite);
        }
      }
    });
  }

  Future<void> _verifyCartItems() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final user = _authService.currentUser;
      if (user == null) {
        print('CartScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
        if (mounted) {
          Get.snackbar('Error', 'Silakan login untuk memverifikasi keranjang', backgroundColor: errorRed, colorText: backgroundWhite);
          Get.offAllNamed(AppRoutes.signIn);
        }
        return;
      }
      print('CartScreen: Memverifikasi keranjang untuk userId: ${user.uid}');
      final cartSnapshot = await _firestoreService.firestore
          .collection('cart')
          .where('uid', isEqualTo: user.uid)
          .where('expiresAt', isGreaterThanOrEqualTo: Timestamp.now())
          .get();
      final verifiedItems = cartSnapshot.docs.map((doc) {
        final data = doc.data();
        print('CartScreen: Item keranjang ditemukan: cartId=${data['cartId']}, lockerId=${data['lockerId']}, lockerNumber=${data['lockerNumber']}');
        return data;
      }).toList();
      if (mounted) {
        setState(() {
          _cartItems = verifiedItems;
          _isLoading = false;
        });
      }
      print('CartScreen: Ditemukan ${verifiedItems.length} item keranjang aktif');
      if (verifiedItems.length != widget.cartItems.length) {
        if (mounted) {
          Get.snackbar('Peringatan', 'Beberapa item keranjang telah kedaluwarsa', backgroundColor: warningOrange, colorText: backgroundWhite);
        }
      }
    } catch (e) {
      print('CartScreen: Gagal memverifikasi keranjang: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        Get.snackbar('Error', 'Gagal memverifikasi item keranjang: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  Future<void> _processPayment() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final user = _authService.currentUser;
      if (user == null) {
        print('CartScreen: Pengguna tidak terautentikasi');
        if (mounted) {
          Get.snackbar('Error', 'Silakan login untuk melanjutkan pembayaran', backgroundColor: errorRed, colorText: backgroundWhite);
          Get.offAllNamed(AppRoutes.signIn);
        }
        return;
      }
      print('CartScreen: Memulai proses pembayaran untuk ${_cartItems.length} item');
      if (_locationId == null || _locationId!.isEmpty) {
        throw Exception('Lokasi tidak dipilih');
      }
      final orderId = await _firestoreService.createPendingOrder(user.uid, _cartItems, _locationId!);
      print('CartScreen: Pesanan dibuat dengan orderId: $orderId');
      final result = await _paymentService.getSnapToken(orderId, totalPrice);
      result.fold(
        (failure) {
          if (mounted) {
            Get.snackbar('Error', 'Gagal mendapatkan token pembayaran: ${failure.message}', backgroundColor: errorRed, colorText: backgroundWhite);
          }
        },
        (token) {
          if (mounted) {
            print('CartScreen: Navigasi ke PaymentSelectionScreen dengan orderId: $orderId');
            Get.toNamed(AppRoutes.paymentSelection, arguments: {
              'orderId': orderId,
              'snapToken': token.token,
              'totalPrice': totalPrice,
              'cartItems': _cartItems,
              'locationId': _locationId,
            });
          }
        },
      );
    } catch (e) {
      print('CartScreen: Gagal memproses pembayaran: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal memproses pembayaran: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _removeFromCart(int index) async {
    if (!mounted) return;
    final removedItem = _cartItems[index];
    setState(() => _cartItems.removeAt(index));
    try {
      print('CartScreen: Menghapus item keranjang dengan cartId: ${removedItem['cartId']}');
      await _firestoreService.firestore.runTransaction((transaction) async {
        final cartRef = _firestoreService.firestore.collection('cart').doc(removedItem['cartId']);
        final lockerRef = _firestoreService.firestore.collection('lockers').doc(removedItem['lockerId']);
        transaction.delete(cartRef);
        transaction.update(lockerRef, {
          'bookingStatus': 'available',
          'lastUpdated': FieldValue.serverTimestamp(),
          'lastUser': null,
          'currentOrderId': null,
        });
      });
      print('CartScreen: Item keranjang dihapus, _cartItems: ${_cartItems.length}');
      if (mounted) {
        Get.snackbar('Sukses', 'Loker ${removedItem['lockerNumber']} dihapus dari keranjang', backgroundColor: successGreen, colorText: backgroundWhite);
      }
      await _verifyCartItems();
    } catch (e) {
      print('CartScreen: Gagal menghapus item keranjang: $e');
      if (mounted) {
        setState(() => _cartItems.insert(index, removedItem));
        Get.snackbar('Error', 'Gagal menghapus item: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  void _showEditDurationDialog(int index) {
    final item = _cartItems[index];
    int selectedHours = item['hours'];
    final pricePerHour = (item['price'] as num) / (item['hours'] as num);
    print('CartScreen: Menampilkan dialog durasi untuk loker ${item['lockerNumber']}');
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Text('Edit Durasi - ${item['lockerNumber']}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Ubah durasi penyewaan:'),
              const SizedBox(height: 16),
              Slider(
                value: selectedHours.toDouble(),
                min: 2,
                max: 24,
                divisions: 22,
                activeColor: primaryBlue,
                label: '$selectedHours jam',
                onChanged: (value) => setDialogState(() => selectedHours = value.round()),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Durasi: $selectedHours jam'),
                  Text('Rp ${(selectedHours * pricePerHour).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                print('CartScreen: Dialog dibatalkan untuk loker ${item['lockerNumber']}');
                Navigator.pop(context);
              },
              child: const Text('Batal'),
            ),
            ElevatedButton(
              onPressed: () async {
                print('CartScreen: Memilih durasi $selectedHours jam untuk loker ${item['lockerNumber']}');
                await _updateItemDuration(index, selectedHours);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(backgroundColor: primaryBlue, foregroundColor: backgroundWhite),
              child: const Text('Perbarui'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateItemDuration(int index, int newHours) async {
    if (!mounted) return;
    final item = _cartItems[index];
    final pricePerHour = (item['price'] as num) / (item['hours'] as num);
    final now = DateTime.now();
    try {
      print('CartScreen: Memperbarui durasi untuk cartId: ${item['cartId']}');
      await _firestoreService.firestore.runTransaction((transaction) async {
        final cartRef = _firestoreService.firestore.collection('cart').doc(item['cartId']);
        final lockerRef = _firestoreService.firestore.collection('lockers').doc(item['lockerId']);
        final lockerDoc = await transaction.get(lockerRef);
        if (!lockerDoc.exists || lockerDoc.data()!['bookingStatus'] != 'pending') {
          throw Exception('Loker sudah dipesan atau tidak tersedia');
        }
        transaction.update(cartRef, {
          'hours': newHours,
          'price': newHours * pricePerHour,
          'startTime': Timestamp.fromDate(now),
          'endTime': Timestamp.fromDate(now.add(Duration(hours: newHours))),
          'expiresAt': Timestamp.fromDate(now.add(const Duration(minutes: 15))),
        });
      });
      if (mounted) {
        setState(() {
          _cartItems[index]['hours'] = newHours;
          _cartItems[index]['price'] = newHours * pricePerHour;
          _cartItems[index]['startTime'] = Timestamp.fromDate(now);
          _cartItems[index]['endTime'] = Timestamp.fromDate(now.add(Duration(hours: newHours)));
        });
      }
      print('CartScreen: Durasi diperbarui untuk loker ${item['lockerNumber']} menjadi $newHours jam');
      if (mounted) {
        Get.snackbar('Sukses', 'Durasi loker ${item['lockerNumber']} menjadi $newHours jam', backgroundColor: successGreen, colorText: backgroundWhite);
      }
      await _verifyCartItems();
    } catch (e) {
      print('CartScreen: Gagal memperbarui durasi: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal memperbarui durasi: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  @override
  void dispose() {
    print('CartScreen: Membersihkan timer...');
    _cartTimeoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    print('CartScreen: Membangun UI, _cartItems: ${_cartItems.length}, _isLoading: $_isLoading');
    return Scaffold(
      appBar: AppBar(
        title: const Text('Keranjang'),
        backgroundColor: backgroundWhite,
        elevation: 0,
        actions: [
          if (_cartItems.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep),
              onPressed: () async {
                try {
                  print('CartScreen: Mengosongkan keranjang...');
                  await _firestoreService.firestore.runTransaction((transaction) async {
                    for (var item in _cartItems) {
                      final cartRef = _firestoreService.firestore.collection('cart').doc(item['cartId']);
                      final lockerRef = _firestoreService.firestore.collection('lockers').doc(item['lockerId']);
                      transaction.delete(cartRef);
                      transaction.update(lockerRef, {
                        'bookingStatus': 'available',
                        'lastUpdated': FieldValue.serverTimestamp(),
                        'lastUser': null,
                        'currentOrderId': null,
                      });
                    }
                  });
                  if (mounted) {
                    setState(() => _cartItems.clear());
                    Get.snackbar('Sukses', 'Semua item dihapus dari keranjang', backgroundColor: successGreen, colorText: backgroundWhite);
                  }
                } catch (e) {
                  print('CartScreen: Gagal mengosongkan keranjang: $e');
                  if (mounted) {
                    Get.snackbar('Error', 'Gagal mengosongkan keranjang: $e', backgroundColor: errorRed, colorText: backgroundWhite);
                  }
                }
              },
            ),
        ],
      ),
      body: Container(
        color: backgroundWhite,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: primaryBlue))
            : _cartItems.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.shopping_cart_outlined, size: 64, color: textLight),
                        const SizedBox(height: 16),
                        const Text('Keranjang Kosong', style: TextStyle(fontWeight: FontWeight.bold)),
                        const Text('Pilih loker untuk disewa', style: TextStyle(color: textLight)),
                        const SizedBox(height: 16),
                        PrimaryButton(
                          text: 'Pilih Loker',
                          icon: Icons.add_circle,
                          onPressed: () {
                            print('CartScreen: Tombol Pilih Loker diklik, navigasi ke MainScreen tab Booking');
                            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1, 'locationId': _locationId});
                          },
                        ),
                      ],
                    ),
                  )
                : Column(
                    children: [
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _cartItems.length,
                          itemBuilder: (context, index) {
                            final item = _cartItems[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(item['lockerNumber'] ?? 'Loker Tidak Valid', style: const TextStyle(fontWeight: FontWeight.bold)),
                                          Text('Durasi: ${item['hours']} jam'),
                                          Text('Rp ${item['price'].toStringAsFixed(0)}'),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.edit, color: primaryBlue),
                                      onPressed: () => _showEditDurationDialog(index),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: errorRed),
                                      onPressed: () => _removeFromCart(index),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        color: backgroundWhite,
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('Rp ${totalPrice.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: primaryBlue)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            PrimaryButton(
                              text: _isLoading ? 'Memproses...' : 'Lanjut ke Pembayaran',
                              icon: Icons.payment,
                              onPressed: _isLoading ? () {} : _processPayment,
                              isLoading: _isLoading,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }
}