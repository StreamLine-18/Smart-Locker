import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../../auth/widgets/primary_button.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  _BookingScreenState createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> with TickerProviderStateMixin {
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  final AuthService _authService = Get.find<AuthService>();
  String? _selectedLocationId;
  List<Map<String, dynamic>> _locations = [];
  List<Map<String, dynamic>> _lockers = [];
  List<Map<String, dynamic>> _cartItems = [];
  bool _isLoading = false;
  bool _isLoadingLocations = true;
  StreamSubscription<QuerySnapshot>? _lockerListener;
  
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Map untuk foto kampus
  final Map<String, Map<String, String>> _campusInfo = {
    'loc1': {
      'name': 'Kampus 4 UAD',
      'image': 'assets/images/kampus4_uad.jpg',
      'description': 'Kampus 4 - Universitas Ahmad Dahlan',
      'address': 'Jl. Ringroad Selatan, Tamanan, Bantul',
    },
    'loc2': {
      'name': 'Kampus 1 UAD',
      'image': 'assets/images/kampus1_uad.jpg',
      'description': 'Kampus 1 - Universitas Ahmad Dahlan',
      'address': 'Jl. Kapas No.9, Semaki, Yogyakarta',
    },
  };

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack));

    print('BookingScreen: Menginisialisasi state...');
    final args = Get.arguments as Map<String, dynamic>? ?? {};
    _selectedLocationId = args['locationId'] as String?;
    print('BookingScreen: Argumen locationId: $_selectedLocationId');
    _authService.init().then((_) {
      print('BookingScreen: AuthService diinisialisasi, currentUser: ${_authService.currentUser?.uid ?? 'null'}');
      if (_authService.currentUser == null) {
        print('BookingScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
        Get.offAllNamed(AppRoutes.signIn);
      } else {
        _verifyCartItems();
        _fetchLocations();
        _startLockerListener();
        _animationController.forward();
      }
    });
  }

  void _startLockerListener() {
    if (_selectedLocationId == null) return;
    _lockerListener?.cancel();
    _lockerListener = _firestoreService.firestore
        .collection('lockers')
        .where('locationId', isEqualTo: _selectedLocationId)
        .where('bookingStatus', isEqualTo: 'available')
        .snapshots()
        .listen((snapshot) {
      final lockers = snapshot.docs.map((doc) => doc.data()).toList();
      if (mounted) {
        setState(() {
          _lockers = lockers.where((locker) {
            final isValid = locker['lockerId'] != null && locker['lockerNumber'] != null;
            if (!isValid) {
              print('BookingScreen: Loker tidak valid diabaikan: $locker');
            }
            return isValid;
          }).toList();
        });
      }
      print('BookingScreen: Ditemukan ${_lockers.length} loker tersedia: ${_lockers.map((l) => l['lockerNumber']).toList()}');
    }, onError: (e) {
      print('BookingScreen: Gagal memantau loker: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal memantau loker: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    });
  }

  Future<void> _verifyCartItems() async {
    if (!mounted) return;
    try {
      final user = _authService.currentUser;
      if (user == null) {
        print('BookingScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
        if (mounted) {
          Get.snackbar('Error', 'Silakan login untuk memverifikasi keranjang', backgroundColor: errorRed, colorText: backgroundWhite);
          Get.offAllNamed(AppRoutes.signIn);
        }
        return;
      }
      print('BookingScreen: Memverifikasi keranjang untuk userId: ${user.uid}');
      final cartSnapshot = await _firestoreService.firestore
          .collection('cart')
          .where('uid', isEqualTo: user.uid)
          .where('expiresAt', isGreaterThanOrEqualTo: Timestamp.now())
          .get();
      final cartItems = cartSnapshot.docs.map((doc) {
        final data = doc.data();
        print('BookingScreen: Item keranjang ditemukan: cartId=${data['cartId']}, lockerId=${data['lockerId']}, lockerNumber=${data['lockerNumber']}');
        return data;
      }).toList();
      print('BookingScreen: Ditemukan ${cartItems.length} item keranjang aktif');
      if (mounted) {
        setState(() => _cartItems = cartItems);
      }
      _fetchLockers();
    } catch (e) {
      print('BookingScreen: Gagal memverifikasi keranjang: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal memverifikasi keranjang: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  Future<void> _fetchLocations() async {
    if (!mounted) return;
    setState(() => _isLoadingLocations = true);
    try {
      print('BookingScreen: Mengambil data lokasi...');
      final locations = await _firestoreService.getLocations();
      print('BookingScreen: Ditemukan ${locations.length} lokasi: ${locations.map((l) => l['locationId']).toList()}');
      if (mounted) {
        setState(() {
          _locations = locations;
          _selectedLocationId = _selectedLocationId != null && locations.any((loc) => loc['locationId'] == _selectedLocationId)
              ? _selectedLocationId
              : locations.isNotEmpty
                  ? locations[0]['locationId']
                  : null;
          _isLoadingLocations = false;
        });
      }
      if (_selectedLocationId != null) {
        print('BookingScreen: Lokasi dipilih: $_selectedLocationId');
        _fetchLockers();
        _startLockerListener();
      } else {
        print('BookingScreen: Tidak ada lokasi tersedia');
        if (mounted) {
          Get.snackbar('Peringatan', 'Tidak ada lokasi tersedia', backgroundColor: warningOrange, colorText: backgroundWhite);
        }
      }
    } catch (e) {
      print('BookingScreen: Gagal memuat lokasi: $e');
      if (mounted) {
        setState(() => _isLoadingLocations = false);
        Get.snackbar('Error', 'Gagal memuat lokasi: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  Future<void> _fetchLockers() async {
    if (_selectedLocationId == null) {
      print('BookingScreen: Tidak ada lokasi yang dipilih, lewati pengambilan loker');
      return;
    }
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      print('BookingScreen: Mengambil loker untuk locationId: $_selectedLocationId');
      final lockers = await _firestoreService.getAvailableLockers(_selectedLocationId!);
      final validLockers = lockers.where((locker) {
        final isValid = locker['lockerId'] != null &&
            locker['lockerNumber'] != null &&
            locker['bookingStatus'] == 'available';
        if (!isValid) {
          print('BookingScreen: Loker tidak valid diabaikan: $locker');
        }
        return isValid;
      }).toList();
      print('BookingScreen: Ditemukan ${validLockers.length} loker tersedia: ${validLockers.map((l) => l['lockerNumber']).toList()}');
      if (mounted) {
        setState(() {
          _lockers = validLockers;
          _isLoading = false;
        });
      }
      if (validLockers.isEmpty) {
        if (mounted) {
          Get.snackbar('Peringatan', 'Tidak ada loker tersedia di lokasi ini', backgroundColor: warningOrange, colorText: backgroundWhite);
        }
      }
    } catch (e) {
      print('BookingScreen: Gagal memuat loker: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        Get.snackbar('Error', 'Gagal memuat loker: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    }
  }

  Future<void> _addToCart(Map<String, dynamic> locker, int hours) async {
    print('BookingScreen: Memulai _addToCart untuk loker: ${locker['lockerNumber']}');
    if (locker['lockerId'] == null || locker['lockerNumber'] == null) {
      print('BookingScreen: Validasi gagal - Data loker tidak valid: $locker');
      if (mounted) {
        Get.snackbar('Error', 'Data loker ${locker['lockerNumber'] ?? 'tidak diketahui'} tidak valid', backgroundColor: errorRed, colorText: backgroundWhite);
      }
      return;
    }

    if (_authService.currentUser == null) {
      print('BookingScreen: Pengguna tidak terautentikasi, navigasi ke SignIn');
      if (mounted) {
        Get.snackbar('Error', 'Silakan login untuk memesan loker', backgroundColor: errorRed, colorText: backgroundWhite);
        Get.offAllNamed(AppRoutes.signIn);
      }
      return;
    }

    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      print('BookingScreen: Memeriksa koneksi Firestore...');
      await _firestoreService.firestore.collection('test').doc('test').get();
      print('BookingScreen: Koneksi Firestore berhasil');

      final now = DateTime.now();
      final cartId = DateTime.now().millisecondsSinceEpoch.toString();
      final pricePerHour = (locker['pricePerHour'] as num?)?.toDouble() ?? 5000.0;
      final price = hours * pricePerHour;
      final cartItem = {
        'cartId': cartId,
        'uid': _authService.currentUser!.uid,
        'lockerId': locker['lockerId'],
        'lockerNumber': locker['lockerNumber'],
        'hours': hours,
        'price': price,
        'startTime': Timestamp.fromDate(now),
        'endTime': Timestamp.fromDate(now.add(Duration(hours: hours))),
        'expiresAt': Timestamp.fromDate(now.add(const Duration(minutes: 2))),
        'createdAt': Timestamp.fromDate(now),
      };
      print('BookingScreen: Data cartItem: $cartItem');

      print('BookingScreen: Memulai transaksi untuk loker ${locker['lockerNumber']} dengan cartId: $cartId');
      await _firestoreService.firestore.runTransaction((transaction) async {
        final lockerRef = _firestoreService.firestore.collection('lockers').doc(locker['lockerId']);
        final lockerDoc = await transaction.get(lockerRef);
        print('BookingScreen: Status dokumen loker ${locker['lockerId']}: exists=${lockerDoc.exists}');
        if (!lockerDoc.exists) {
          throw Exception('Loker ${locker['lockerNumber']} tidak ditemukan di database');
        }
        final lockerData = lockerDoc.data();
        if (lockerData == null) {
          throw Exception('Data loker ${locker['lockerNumber']} tidak valid (null)');
        }
        print('BookingScreen: Status loker ${locker['lockerNumber']}: ${lockerData['bookingStatus']}');
        if (lockerData['bookingStatus'] != 'available') {
          throw Exception('Loker ${locker['lockerNumber']} sudah dipesan atau tidak tersedia (status: ${lockerData['bookingStatus']})');
        }
        transaction.set(_firestoreService.firestore.collection('cart').doc(cartId), cartItem);
        transaction.update(lockerRef, {
          'bookingStatus': 'pending',
          'lastUpdated': FieldValue.serverTimestamp(),
          'lastUser': _authService.currentUser!.uid,
          'currentOrderId': cartId,
        });
      });

      print('BookingScreen: Transaksi berhasil, memperbarui _cartItems dan _lockers');
      if (mounted) {
        setState(() {
          _cartItems.add(cartItem);
          _lockers.removeWhere((l) => l['lockerId'] == locker['lockerId']);
        });
      }
      await _verifyCartItems();
      if (mounted) {
        Get.snackbar('Sukses', 'Loker ${locker['lockerNumber']} ditambahkan ke keranjang', backgroundColor: successGreen, colorText: backgroundWhite);
        print('BookingScreen: Navigasi ke CartScreen dengan ${_cartItems.length} item');
        Get.toNamed(AppRoutes.cart, arguments: {
          'cartItems': _cartItems,
          'totalPrice': _cartItems.fold(0.0, (sum, item) => sum + item['price']),
          'locationId': _selectedLocationId,
        });
      }
    } catch (e) {
      print('BookingScreen: Gagal menambahkan loker ${locker['lockerNumber']}: $e');
      if (mounted) {
        Get.snackbar('Error', 'Gagal menambahkan loker ${locker['lockerNumber']} ke keranjang: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
      print('BookingScreen: Transaksi selesai, _isLoading=false');
    }
  }

  void _showDurationDialog(Map<String, dynamic> locker) {
    int selectedHours = 2;
    final pricePerHour = (locker['pricePerHour'] as num?)?.toDouble() ?? 5000.0;
    print('BookingScreen: Menampilkan dialog durasi untuk loker ${locker['lockerNumber']}');
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [backgroundWhite, surfaceGray],
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header with icon
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: primaryBlue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.access_time_rounded,
                    size: 32,
                    color: primaryBlue,
                  ),
                ),
                const SizedBox(height: 16),
                
                // Title
                Text(
                  'Loker ${locker['lockerNumber']}',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: textDark,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Pilih durasi penyewaan',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: textLight,
                  ),
                ),
                const SizedBox(height: 24),
                
                // Duration slider with custom styling
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: backgroundWhite,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: dividerColor),
                  ),
                  child: Column(
                    children: [
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor: primaryBlue,
                          inactiveTrackColor: primaryBlue.withOpacity(0.2),
                          thumbColor: primaryBlue,
                          thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 12),
                          overlayColor: primaryBlue.withOpacity(0.2),
                          valueIndicatorColor: primaryBlue,
                          valueIndicatorTextStyle: const TextStyle(
                            color: backgroundWhite,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        child: Slider(
                          value: selectedHours.toDouble(),
                          min: 2,
                          max: 24,
                          divisions: 22,
                          label: '$selectedHours jam',
                          onChanged: (value) => setDialogState(() => selectedHours = value.round()),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Durasi',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: textLight,
                                ),
                              ),
                              Text(
                                '$selectedHours jam',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: primaryBlue,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                'Total Harga',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: textLight,
                                ),
                              ),
                              Text(
                                'Rp ${(selectedHours * pricePerHour).toStringAsFixed(0)}',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: successGreen,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          print('BookingScreen: Memilih durasi $selectedHours jam untuk loker ${locker['lockerNumber']}');
                          _addToCart(locker, selectedHours);
                          Navigator.pop(context);
                        },
                        child: const Text('Tambah ke Keranjang'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          print('BookingScreen: Dialog dibatalkan untuk loker ${locker['lockerNumber']}');
                          Navigator.pop(context);
                        },
                        child: const Text('Batal'),
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
  }

  Widget _buildLocationCard() {
    final campusInfo = _campusInfo[_selectedLocationId];
    
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            // Background image
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                image: campusInfo != null 
                  ? DecorationImage(
                      image: AssetImage(campusInfo['image']!),
                      fit: BoxFit.cover,
                    )
                  : null,
                color: campusInfo == null ? surfaceGray : null,
              ),
              child: campusInfo == null 
                ? const Center(
                    child: Icon(
                      Icons.location_city_rounded,
                      size: 48,
                      color: textLight,
                    ),
                  )
                : null,
            ),
            
            // Gradient overlay
            Container(
              height: 200,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.7),
                  ],
                ),
              ),
            ),
            
            // Content
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_rounded,
                          color: backgroundWhite,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Lokasi Kampus',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: backgroundWhite.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    
                    // Location selector
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: backgroundWhite,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedLocationId,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: textDark,
                            fontWeight: FontWeight.w600,
                          ),
                          onChanged: (value) {
                            print('BookingScreen: Lokasi diubah menjadi: $value');
                            setState(() => _selectedLocationId = value!);
                            _fetchLockers();
                            _startLockerListener();
                          },
                          items: _locations.map((location) {
                            final locationId = location['locationId'];
                            final campusInfo = _campusInfo[locationId];
                            return DropdownMenuItem<String>(
                              value: locationId,
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.school_rounded,
                                    size: 20,
                                    color: primaryBlue,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      campusInfo?['name'] ?? location['name'] ?? 'Lokasi ${location['locationId']}',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    
                    if (campusInfo != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        campusInfo['description']!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: backgroundWhite,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        campusInfo['address']!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: backgroundWhite.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLockerCard(Map<String, dynamic> locker, int index) {
    final isInCart = _cartItems.any((item) => item['lockerId'] == locker['lockerId']);
    final pricePerHour = (locker['pricePerHour'] as num?)?.toDouble() ?? 5000.0;
    
    return AnimatedContainer(
      duration: Duration(milliseconds: 300 + (index * 100)),
      margin: const EdgeInsets.only(bottom: 12),
      child: Card(
        elevation: isInCart ? 8 : 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: isInCart 
              ? LinearGradient(
                  colors: [successGreen.withOpacity(0.1), backgroundWhite],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
            border: isInCart 
              ? Border.all(color: successGreen, width: 2)
              : null,
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Locker icon
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: isInCart ? successGreen : primaryBlue,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: (isInCart ? successGreen : primaryBlue).withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    isInCart ? Icons.check_circle_rounded : Icons.lock_rounded,
                    color: backgroundWhite,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                
                // Locker info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        locker['lockerNumber'] ?? 'Loker Tidak Valid',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: textDark,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.payments_rounded,
                            size: 16,
                            color: textLight,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Rp ${pricePerHour.toStringAsFixed(0)}/jam',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: textLight,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      if (isInCart) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.shopping_cart_rounded,
                              size: 16,
                              color: successGreen,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Sudah di keranjang',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: successGreen,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                
// Action button
                if (isInCart)
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: successGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.check_circle_rounded,
                      color: successGreen,
                      size: 24,
                    ),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [primaryBlue, secondaryBlue],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: primaryBlue.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => _showDurationDialog(locker),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          child: Icon(
                            Icons.add_rounded,
                            color: backgroundWhite,
                            size: 24,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
  return SingleChildScrollView(
    child: Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: surfaceGray,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.inbox_rounded,
                size: 64,
                color: textLight,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Tidak ada loker tersedia',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Semua loker di lokasi ini sedang digunakan.\nSilakan coba lagi nanti atau pilih lokasi lain.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: textLight,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchLockers,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Muat Ulang'),
            ),
          ],
        ),
      ),
    ),
  );
}


  Widget _buildCartSummary() {
    if (_cartItems.isEmpty) return const SizedBox.shrink();
    
    final totalItems = _cartItems.length;
    final totalPrice = _cartItems.fold(0.0, (sum, item) => sum + (item['price'] as num).toDouble());
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryBlue, secondaryBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryBlue.withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: backgroundWhite.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.shopping_cart_rounded,
                  color: backgroundWhite,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Keranjang Anda',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: backgroundWhite,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '$totalItems loker dipilih',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: backgroundWhite.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'Rp ${totalPrice.toStringAsFixed(0)}',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: backgroundWhite,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Get.toNamed(AppRoutes.cart, arguments: {
                  'cartItems': _cartItems,
                  'totalPrice': totalPrice,
                  'locationId': _selectedLocationId,
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: backgroundWhite,
                foregroundColor: primaryBlue,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: const Icon(Icons.arrow_forward_rounded),
              label: const Text(
                'Lanjut ke Pembayaran',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingShimmer() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 6,
      itemBuilder: (context, index) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        height: 88,
        decoration: BoxDecoration(
          color: surfaceGray,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              margin: const EdgeInsets.all(16),
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: dividerColor,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: double.infinity,
                    height: 16,
                    margin: const EdgeInsets.only(right: 32),
                    decoration: BoxDecoration(
                      color: dividerColor,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 120,
                    height: 12,
                    decoration: BoxDecoration(
                      color: dividerColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundWhite,
      appBar: AppBar(
        title: const Text('Pilih Loker'),
        backgroundColor: backgroundWhite,
        foregroundColor: textDark,
        elevation: 0,
        actions: [
          if (_cartItems.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(right: 16),
              child: Stack(
                children: [
                  IconButton(
                    onPressed: () {
                      Get.toNamed(AppRoutes.cart, arguments: {
                        'cartItems': _cartItems,
                        'totalPrice': _cartItems.fold(0.0, (sum, item) => sum + (item['price'] as num).toDouble()),
                        'locationId': _selectedLocationId,
                      });
                    },
                    icon: const Icon(Icons.shopping_cart_rounded),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: errorRed,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        '${_cartItems.length}',
                        style: const TextStyle(
                          color: backgroundWhite,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
      body: _isLoadingLocations
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : _locations.isEmpty
              ? _buildEmptyState()
              : FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Column(
                      children: [
                        // Location Card
                        _buildLocationCard(),
                        
                        // Section Header
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Row(
                            children: [
                              Icon(
                                Icons.lock_rounded,
                                color: primaryBlue,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Loker Tersedia',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: textDark,
                                ),
                              ),
                              const Spacer(),
                              if (_lockers.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: successGreen.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${_lockers.length} tersedia',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: successGreen,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        
                        // Lockers List
                        Expanded(
                          child: _isLoading
                              ? _buildLoadingShimmer()
                              : _lockers.isEmpty
                                  ? _buildEmptyState()
                                  : ListView.builder(
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      itemCount: _lockers.length,
                                      itemBuilder: (context, index) => _buildLockerCard(_lockers[index], index),
                                    ),
                        ),
                        
                        // Cart Summary
                        _buildCartSummary(),
                      ],
                    ),
                  ),
                ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    _lockerListener?.cancel();
    super.dispose();
  }
}