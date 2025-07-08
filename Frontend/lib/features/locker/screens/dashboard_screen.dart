import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../../auth/widgets/primary_button.dart';
import './locker_management_screen.dart';


class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with TickerProviderStateMixin {
  final AuthService _authService = Get.find<AuthService>();
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  List<Map<String, dynamic>> _activeOrders = [];
  bool _isLoading = true;
  Map<String, Duration> _remainingTimes = {};
  Timer? _timer;
  StreamSubscription<QuerySnapshot>? _orderListener;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 0.95,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    _pulseController.repeat(reverse: true);
    
    print('DashboardScreen: Menginisialisasi state...');
    _initialize();
  }

  Future<void> _initialize() async {
    await _authService.init();
    await _authService.waitForAuthState();
    print('DashboardScreen: AuthService diinisialisasi, currentUser: ${_authService.currentUser?.uid ?? 'null'}');
    await _firestoreService.cleanExpiredOrders();
    _listenToOrders();
    _startTimer();
    _authService.addListener(_listenToOrders);
  }

  void _listenToOrders() {
    final userId = _authService.currentUser?.uid;
    if (userId == null) {
      setState(() => _isLoading = false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Pengguna belum login', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      return;
    }
    setState(() => _isLoading = true);
    _orderListener?.cancel();
    _orderListener = _firestoreService.firestore
        .collection('orders')
        .where('uid', isEqualTo: userId)
        .where('orderStatus', isEqualTo: 'confirmed')
        .snapshots()
        .listen((snapshot) async {
      final orders = <Map<String, dynamic>>[];
      for (var doc in snapshot.docs) {
        final orderDetails = await _firestoreService.getOrderDetails(doc.id);
        final cartItems = orderDetails['orderDetails'] as List<dynamic>? ?? [];
        final validItems = <Map<String, dynamic>>[];
        for (var item in cartItems) {
          final endTime = item['endTime'] as Timestamp?;
          print('DashboardScreen: Memeriksa endTime untuk orderId: ${doc.id}, lockerId: ${item['lockerId']}, endTime: $endTime');
          if (endTime != null && endTime.toDate().isAfter(DateTime.now())) {
            validItems.add(item);
          } else {
            await _firestoreService.firestore.runTransaction((transaction) async {
              final lockerRef = _firestoreService.firestore.collection('lockers').doc(item['lockerId']);
              final orderRef = _firestoreService.firestore.collection('orders').doc(doc.id);
              final orderDetailRef = _firestoreService.firestore.collection('order_details').doc(item['orderDetailId']);
              final lockerDoc = await transaction.get(lockerRef);
              if (!lockerDoc.exists) {
                print('DashboardScreen: Loker ${item['lockerId']} tidak ditemukan');
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
              print('DashboardScreen: Status loker ${item['lockerId']} diperbarui ke available');
            }).catchError((e) {
              print('DashboardScreen: Gagal memperbarui status loker: $e');
            });
          }
        }
        if (validItems.isNotEmpty) {
          orders.add({
            'orderId': doc.id,
            'orderStatus': doc.data()['orderStatus'],
            'paymentStatus': doc.data()['paymentStatus'],
            'cartItems': validItems,
          });
        }
      }
      setState(() {
        _activeOrders = orders;
        _updateRemainingTimes();
        _isLoading = false;
      });
      print('DashboardScreen: Memuat ${_activeOrders.length} pesanan aktif');
    }, onError: (e) {
      setState(() => _isLoading = false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal memantau pesanan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
    });
  }

  void _updateRemainingTimes() {
    _remainingTimes.clear();
    for (var order in _activeOrders) {
      for (var item in order['cartItems'] as List<dynamic>) {
        final endTime = item['endTime'] as Timestamp?;
        print('DashboardScreen: Memeriksa endTime untuk lockerId: ${item['lockerId']}, endTime: $endTime');
        if (endTime != null && endTime.toDate().isAfter(DateTime.now())) {
          _remainingTimes[item['lockerId']] = endTime.toDate().difference(DateTime.now());
        } else {
          _remainingTimes[item['lockerId']] = Duration.zero;
          _firestoreService.firestore.runTransaction((transaction) async {
            final lockerRef = _firestoreService.firestore.collection('lockers').doc(item['lockerId']);
            final orderRef = _firestoreService.firestore.collection('orders').doc(order['orderId']);
            final orderDetailRef = _firestoreService.firestore.collection('order_details').doc(item['orderDetailId']);
            final lockerDoc = await transaction.get(lockerRef);
            if (!lockerDoc.exists) {
              print('DashboardScreen: Loker ${item['lockerId']} tidak ditemukan');
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
            print('DashboardScreen: Status loker ${item['lockerId']} diperbarui ke available');
          }).catchError((e) {
            print('DashboardScreen: Gagal memperbarui status loker: $e');
          });
        }
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _updateRemainingTimes();
      });
    });
  }

  @override
  void dispose() {
    print('DashboardScreen: Membersihkan listener dan timer...');
    _timer?.cancel();
    _orderListener?.cancel();
    _pulseController.dispose();
    _authService.removeListener(_listenToOrders);
    super.dispose();
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    if (hour < 21) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  Widget _buildWelcomeCard() {
    final user = _authService.currentUser;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryBlue, secondaryBlue],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryBlue.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background decoration
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: backgroundWhite.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: 20,
            bottom: -10,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: backgroundWhite.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: backgroundWhite.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        Icons.waving_hand,
                        color: backgroundWhite,
                        size: 28,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: backgroundWhite.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.access_time,
                            color: backgroundWhite,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            DateTime.now().hour.toString().padLeft(2, '0') + ':' + DateTime.now().minute.toString().padLeft(2, '0'),
                            style: const TextStyle(
                              color: backgroundWhite,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  _getGreeting(),
                  style: TextStyle(
                    color: backgroundWhite.withOpacity(0.8),
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.displayName ?? 'Pengguna',
                  style: const TextStyle(
                    color: backgroundWhite,
                    fontWeight: FontWeight.w700,
                    fontSize: 28,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: accentBlue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.verified_user,
                        color: accentBlue,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Verified User',
                        style: TextStyle(
                          color: accentBlue,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: backgroundWhite,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.analytics_outlined,
                color: primaryBlue,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Statistik Hari Ini',
                style: TextStyle(
                  color: textDark,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.lock_outline,
                  title: 'Loker Aktif',
                  value: '${_activeOrders.fold(0, (sum, order) => sum + (order['cartItems'] as List).length)}',
                  color: primaryBlue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.access_time,
                  title: 'Total Waktu',
                  value: '${_remainingTimes.values.fold(0, (sum, duration) => sum + duration.inHours)}h',
                  color: accentBlue,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              color: textLight,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: backgroundWhite,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.flash_on,
                color: warningOrange,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Aksi Cepat',
                style: TextStyle(
                  color: textDark,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  icon: Icons.add_box_outlined,
                  title: 'Pesan Loker',
                  subtitle: 'Buat pesanan baru',
                  color: primaryBlue,
                  onPressed: () {
                            print('CartScreen: Tombol Pilih Loker diklik, navigasi ke MainScreen tab Booking');
                            Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1});
                         },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.history_outlined,
                  title: 'Riwayat',
                  subtitle: 'Lihat pesanan lama',
                  color: secondaryBlue,
                  onPressed:() {Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 2});
              },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: backgroundWhite, size: 20),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                color: color,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                color: textLight,
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLockerCard(Map<String, dynamic> item, String orderId) {
    final remainingTime = _remainingTimes[item['lockerId']] ?? Duration.zero;
    final isUrgent = remainingTime.inMinutes < 30;
    
    return FutureBuilder<DocumentSnapshot>(
      future: _firestoreService.firestore.collection('lockers').doc(item['lockerId']).get(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.hasError) return const SizedBox();
        final lockerData = snapshot.data!.data() as Map<String, dynamic>? ?? {};
        final isOpen = lockerData['lockStatus'] == 'unlocked';
        
        return AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: isUrgent ? _pulseAnimation.value : 1.0,
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: backgroundWhite,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: isUrgent ? errorRed.withOpacity(0.2) : Colors.black.withOpacity(0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  border: isUrgent ? Border.all(color: errorRed.withOpacity(0.3), width: 2) : null,
                ),
                child: InkWell(
                  onTap: () => Get.toNamed(AppRoutes.lockerManagement, arguments: {
                    'orderId': orderId,
                    'locker': {
                      'lockerId': item['lockerId'],
                      'lockerNumber': item['lockerNumber'] ?? 'Loker Tidak Valid',
                      'hours': item['hours'],
                      'endTime': item['endTime'],
                    },
                  }),
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isOpen ? successGreen.withOpacity(0.1) : warningOrange.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Icon(
                                isOpen ? Icons.lock_open : Icons.lock,
                                color: isOpen ? successGreen : warningOrange,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['lockerNumber'] ?? 'Loker Tidak Valid',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: isOpen ? successGreen : warningOrange,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        isOpen ? 'Terbuka' : 'Tertutup',
                                        style: TextStyle(
                                          color: isOpen ? successGreen : warningOrange,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (isUrgent)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: errorRed.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'URGENT',
                                  style: TextStyle(
                                    color: errorRed,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isUrgent ? errorRed.withOpacity(0.1) : lightBlue.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isUrgent ? errorRed.withOpacity(0.2) : primaryBlue.withOpacity(0.2),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.timer_outlined,
                                color: isUrgent ? errorRed : primaryBlue,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Sisa Waktu:',
                                style: TextStyle(
                                  color: textLight,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${remainingTime.inHours}:${remainingTime.inMinutes.remainder(60).toString().padLeft(2, '0')}:${remainingTime.inSeconds.remainder(60).toString().padLeft(2, '0')}',
                                style: TextStyle(
                                  color: isUrgent ? errorRed : primaryBlue,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: primaryBlue.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.touch_app_outlined,
                                      color: primaryBlue,
                                      size: 16,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Ketuk untuk Kelola',
                                      style: TextStyle(
                                        color: primaryBlue,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: backgroundWhite,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: lightBlue.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.lock_open_outlined,
              size: 64,
              color: primaryBlue,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Belum Ada Loker Aktif',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Mulai pesan loker pertama Anda\ndan nikmati kemudahan penyimpanan yang aman',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: textLight,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {Get.offAllNamed(AppRoutes.main, arguments: {'tabIndex': 1});
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: backgroundWhite,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_circle_outline, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Pesan Loker Sekarang',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: surfaceGray,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: primaryBlue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.dashboard_outlined,
                color: primaryBlue,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Smart Locker',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
            ),
          ],
        ),
        backgroundColor: surfaceGray,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryBlue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.refresh_outlined,
                  color: primaryBlue,
                  size: 20,
                ),
              ),
              onPressed: () => _listenToOrders(),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Container(
              color: surfaceGray,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: backgroundWhite,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: CircularProgressIndicator(
                        color: primaryBlue,
                        strokeWidth: 3,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Memuat data loker...',
                      style: TextStyle(
                        color: textLight,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: () async => _listenToOrders(),
              color: primaryBlue,
              backgroundColor: backgroundWhite,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildWelcomeCard(),
                    const SizedBox(height: 20),
                    _buildQuickStats(),
                    const SizedBox(height: 20),
                    _buildQuickActions(),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: primaryBlue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.security_outlined,
                            color: primaryBlue,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Loker Aktif Saya',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: textDark,
                          ),
                        ),
                        const Spacer(),
                        if (_activeOrders.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: primaryBlue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              '${_activeOrders.fold(0, (sum, order) => sum + (order['cartItems'] as List).length)} Aktif',
                              style: TextStyle(
                                color: primaryBlue,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _activeOrders.isEmpty
                        ? _buildEmptyState()
                        : Column(
                            children: _activeOrders.expand((order) {
                              final cartItems = order['cartItems'] as List<dynamic>;
                              return cartItems.map((item) => _buildLockerCard(item, order['orderId']));
                            }).toList(),
                          ),
                    const SizedBox(height: 100), // Extra space for better scrolling
                  ],
                ),
              ),
            ),
    );
  }
}