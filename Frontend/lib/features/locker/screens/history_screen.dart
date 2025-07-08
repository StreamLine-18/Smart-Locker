import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../../auth/widgets/primary_button.dart';
import '../../main/screens/main_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  _HistoryScreenState createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final AuthService _authService = Get.find<AuthService>();
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  List<Map<String, dynamic>> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _authService.init().then((_) {
      _fetchOrders();
    });
  }

  Future<void> _fetchOrders() async {
    setState(() => _isLoading = true);
    try {
      final userId = _authService.currentUser?.uid;
      if (userId == null) {
        print('HistoryScreen: Pengguna belum login, navigasi ke SignIn');
        Get.offAllNamed(AppRoutes.signIn);
        return;
      }
      print('HistoryScreen: Mengambil pesanan untuk userId: $userId');
      final orders = await _firestoreService.getUserOrders(userId);
      if (mounted) {
        setState(() {
          _orders = orders.where((order) => order['orderStatus'] == 'confirmed' || order['orderStatus'] == 'completed').toList();
          _isLoading = false;
        });
      }
      print('HistoryScreen: Ditemukan ${_orders.length} pesanan');
    } catch (e) {
      print('HistoryScreen: Gagal memuat riwayat: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        Get.snackbar('Error', 'Gagal memuat riwayat: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return successGreen;
      default:
        return textLight;
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return Icons.check_circle;
      default:
        return Icons.help_outline;
    }
  }

  String _getStatusText(String? status) {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'Selesai';
      default:
        return 'Tidak Diketahui';
    }
  }

  @override
  Widget build(BuildContext context) {
    print('HistoryScreen: Membangun UI, _orders: ${_orders.length}, _isLoading: $_isLoading');
    return Scaffold(
      appBar: AppBar(
        title: const Text('Riwayat Pesanan'),
        backgroundColor: backgroundWhite,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: primaryBlue),
            onPressed: _fetchOrders,
          ),
        ],
      ),
      body: Container(
        color: backgroundWhite,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: primaryBlue))
            : _orders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.history, size: 64, color: textLight),
                        const SizedBox(height: 16),
                        const Text('Belum Ada Riwayat', style: TextStyle(fontWeight: FontWeight.bold)),
                        const Text('Sewa loker untuk melihat riwayat', style: TextStyle(color: textLight)),
                        const SizedBox(height: 16),
                        PrimaryButton(
                          text: 'Sewa Loker',
                          icon: Icons.add,
                          onPressed: () {
                            print('HistoryScreen: Tombol Sewa Loker diklik, navigasi ke MainScreen tab Booking');
                            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 2});
                          },
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (context, index) {
                      final order = _orders[index];
                      final cartItems = order['cartItems'] as List<dynamic>? ?? [];
                      final totalPrice = cartItems.fold(0.0, (sum, item) => sum + (item['price'] as num? ?? 0));
                      final statusColor = _getStatusColor(order['orderStatus']);
                      final statusIcon = _getStatusIcon(order['orderStatus']);
                      final statusText = _getStatusText(order['orderStatus']);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ExpansionTile(
                          tilePadding: const EdgeInsets.all(16),
                          leading: Icon(statusIcon, color: statusColor),
                          title: Text('Order #${order['orderId']?.substring(0, 8) ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_formatDate(order['createdAt']), style: const TextStyle(color: textLight)),
                              Text('Rp ${totalPrice.toStringAsFixed(0)}', style: const TextStyle(color: primaryBlue, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Status: $statusText', style: TextStyle(color: statusColor)),
                                  const SizedBox(height: 8),
                                  const Text('Detail Loker:', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ...cartItems.map((item) => Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 4),
                                        child: Row(
                                          children: [
                                            Expanded(child: Text(item['lockerNumber'] ?? 'Loker Tidak Valid')),
                                            Text('${item['hours']} jam'),
                                          ],
                                        ),
                                      )),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Total:', style: TextStyle(fontWeight: FontWeight.bold)),
                                      Text('Rp ${totalPrice.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: primaryBlue)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
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