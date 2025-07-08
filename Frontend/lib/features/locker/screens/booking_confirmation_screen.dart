import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../../auth/widgets/primary_button.dart';
import 'locker_management_screen.dart';

class BookingConfirmationScreen extends StatefulWidget {
  const BookingConfirmationScreen({super.key});

  @override
  _BookingConfirmationScreenState createState() => _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState extends State<BookingConfirmationScreen> {
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  bool _isLoading = true;
  Map<String, dynamic>? _orderDetails;
  String? _invoiceUrl;

  @override
  void initState() {
    super.initState();
    print('BookingConfirmationScreen: Menginisialisasi state...');
    _fetchOrderDetails();
  }

  Future<void> _fetchOrderDetails() async {
    setState(() => _isLoading = true);
    try {
      final args = Get.arguments as Map<String, dynamic>? ?? {};
      final String orderId = args['orderId']?.toString() ?? '';
      if (orderId.isEmpty) throw Exception('ID pesanan tidak valid');
      final details = await _firestoreService.getOrderDetails(orderId);
      final invoiceDoc = await _firestoreService.firestore.collection('invoices').where('orderId', isEqualTo: orderId).get();
      final invoiceUrl = invoiceDoc.docs.isNotEmpty ? invoiceDoc.docs.first.data()['invoiceUrl'] : null;
      setState(() {
        _orderDetails = details;
        _invoiceUrl = invoiceUrl;
        _isLoading = false;
      });
      print('BookingConfirmationScreen: Detail pesanan dimuat untuk orderId: $orderId');
      Get.find<AuthService>().notifyListeners();
    } catch (e) {
      print('BookingConfirmationScreen: Gagal memuat detail pesanan: $e');
      setState(() => _isLoading = false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal memuat detail pesanan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = Get.arguments as Map<String, dynamic>? ?? {};
    final String orderId = args['orderId']?.toString() ?? 'Tidak Diketahui';
    final Map<String, dynamic> transaction = args['transaction'] ?? {};
    final String paymentStatus = transaction['transaction_status']?.toString().toLowerCase() == 'settlement' ? 'Berhasil' : 'Gagal';
    final String paymentMethod = transaction['payment_type']?.toString() ?? 'Tidak Diketahui';

    if (_isLoading || _orderDetails == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: primaryBlue)));
    }

    final order = _orderDetails!['order'] as Map<String, dynamic>? ?? {};
    final cartItems = _orderDetails!['orderDetails'] as List<dynamic>? ?? [];
    final double totalPrice = order['totalAmount']?.toDouble() ?? 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Konfirmasi Pemesanan'),
        backgroundColor: backgroundWhite,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Get.offAllNamed(AppRoutes.main),
        ),
      ),
      body: Container(
        color: backgroundWhite,
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: backgroundWhite,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
              ),
              child: const Column(
                children: [
                  Icon(Icons.check_circle, color: successGreen, size: 48),
                  SizedBox(height: 16),
                  Text('Pemesanan Berhasil!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: successGreen)),
                  Text('Loker Anda berhasil dipesan', style: TextStyle(color: textLight)),
                ],
              ),
            ),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
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
                      const Icon(Icons.receipt_long, color: primaryBlue),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Order ID: $orderId',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: orderId));
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            Get.snackbar('Disalin!', 'Order ID disalin ke clipboard', backgroundColor: successGreen, colorText: backgroundWhite);
                          });
                        },
                        icon: const Icon(Icons.content_copy, size: 20),
                      ),
                    ],
                  ),
                  const Divider(),
                  _buildDetailRow('Status', paymentStatus, successGreen),
                  _buildDetailRow('Metode', paymentMethod, primaryBlue),
                  _buildDetailRow('Total', 'Rp ${totalPrice.toStringAsFixed(0)}', primaryBlue),
                  _buildDetailRow('Waktu', _formatDate(order['createdAt']), textDark),
                  _buildDetailRow('Invoice', _invoiceUrl ?? 'Tidak tersedia', primaryBlue, isLink: true, onTap: () {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      Get.snackbar('Info', 'Invoice tidak tersedia', backgroundColor: primaryBlue, colorText: backgroundWhite);
                    });
                  }),
                ],
              ),
            ),
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: backgroundWhite,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.lock_open, color: primaryBlue),
                          const SizedBox(width: 12),
                          Text('Detail Loker (${cartItems.length})', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: cartItems.length,
                        itemBuilder: (context, index) {
                          final item = cartItems[index];
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
                                        Text(
                                          item['lockerNumber'] ?? 'Loker Tidak Valid',
                                          style: const TextStyle(fontWeight: FontWeight.bold),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text('Durasi: ${item['hours']} jam'),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.arrow_forward_ios, color: primaryBlue),
                                    onPressed: () => Get.toNamed(
                                      AppRoutes.lockerManagement,
                                      arguments: {
                                        'orderId': orderId,
                                        'locker': {
                                          'lockerId': item['lockerId'],
                                          'lockerNumber': item['lockerNumber'],
                                          'hours': item['hours'],
                                          'endTime': item['endTime'],
                                        },
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              color: backgroundWhite,
              child: PrimaryButton(
                text: 'Kembali ke Dashboard',
                icon: Icons.home,
                onPressed: () => Get.offAllNamed(AppRoutes.main),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, Color valueColor, {bool isLink = false, VoidCallback? onTap}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: textLight)),
          Expanded(
            child: isLink
                ? GestureDetector(
                    onTap: onTap ?? () {},
                    child: Text(
                      value,
                      style: TextStyle(color: valueColor, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.end,
                    ),
                  )
                : Text(
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

  String _formatDate(dynamic timestamp) {
    try {
      if (timestamp == null) return 'N/A';
      final date = timestamp is Timestamp ? timestamp.toDate() : DateTime.parse(timestamp.toString());
      return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'N/A';
    }
  }
}