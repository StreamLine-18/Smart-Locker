import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/colors.dart';

class FirestoreService extends GetxService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  Timer? _cleanupTimer;

  FirebaseFirestore get firestore => _firestore;

  Future<FirestoreService> init() async {
    try {
      await cleanExpiredCartItems();
      await cleanExpiredOrders();
      _startPeriodicCleanup();
      print('FirestoreService: Inisialisasi selesai');
      return this;
    } catch (e) {
      print('FirestoreService: Gagal menginisialisasi Firestore: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal menginisialisasi Firestore: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  void _startPeriodicCleanup() {
    _cleanupTimer?.cancel();
    _cleanupTimer = Timer.periodic(const Duration(minutes: 5), (timer) async {
      print('FirestoreService: Menjalankan pembersihan periodik untuk pesanan kedaluwarsa');
      await cleanExpiredOrders();
    });
  }

  Future<void> saveUserData(String uid, String email, String name) async {
    try {
      await _firestore.collection('users').doc(uid).set({
        'uid': uid,
        'email': email,
        'name': name,
        'createdAt': FieldValue.serverTimestamp(),
        'role': 'user',
        'emailVerified': false,
      }, SetOptions(merge: true));
      print('FirestoreService: Data pengguna disimpan untuk UID: $uid');
    } catch (e) {
      print('FirestoreService: Gagal menyimpan data pengguna: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal menyimpan data pengguna: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getUserOrders(String userId) async {
    try {
      final querySnapshot = await _firestore
          .collection('orders')
          .where('uid', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .get();
      final orders = <Map<String, dynamic>>[];
      for (var doc in querySnapshot.docs) {
        final data = doc.data();
        data['orderId'] = doc.id;
        final orderDetailsSnapshot = await _firestore
            .collection('order_details')
            .where('orderId', isEqualTo: doc.id)
            .get();
        final orderDetails = orderDetailsSnapshot.docs.map((detailDoc) {
          final detailData = detailDoc.data();
          detailData['orderDetailId'] = detailDoc.id;
          return detailData;
        }).toList();
        data['cartItems'] = orderDetails;
        orders.add(data);
      }
      print('FirestoreService: Mengambil ${orders.length} pesanan untuk userId: $userId');
      return orders;
    } catch (e) {
      print('FirestoreService: Gagal mengambil pesanan: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (e.toString().contains('permission-denied')) {
          Get.snackbar('Error', 'Izin ditolak: Tidak dapat mengakses pesanan. Silakan hubungi admin.', backgroundColor: errorRed, colorText: backgroundWhite);
        } else if (e.toString().contains('failed-precondition')) {
          Get.snackbar('Error', 'Kueri memerlukan indeks Firestore. Silakan hubungi admin.', backgroundColor: errorRed, colorText: backgroundWhite);
        }
      });
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getAvailableLockers(String locationId) async {
    try {
      final querySnapshot = await _firestore
          .collection('lockers')
          .where('locationId', isEqualTo: locationId)
          .where('bookingStatus', isEqualTo: 'available')
          .get();
      final lockers = querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['lockerId'] = doc.id;
        return data;
      }).toList();
      print('FirestoreService: Mengambil ${lockers.length} loker tersedia untuk locationId: $locationId');
      return lockers;
    } catch (e) {
      print('FirestoreService: Gagal mengambil loker: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (e.toString().contains('permission-denied')) {
          Get.snackbar('Error', 'Izin ditolak: Tidak dapat mengakses loker. Silakan hubungi admin.', backgroundColor: errorRed, colorText: backgroundWhite);
        } else if (e.toString().contains('failed-precondition')) {
          Get.snackbar('Error', 'Kueri loker memerlukan indeks Firestore. Silakan hubungi admin.', backgroundColor: errorRed, colorText: backgroundWhite);
        }
      });
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getLocations() async {
    try {
      final querySnapshot = await _firestore.collection('locations').get();
      final locations = querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['locationId'] = doc.id;
        return data;
      }).toList();
      print('FirestoreService: Mengambil ${locations.length} lokasi');
      return locations;
    } catch (e) {
      print('FirestoreService: Gagal mengambil lokasi: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal mengambil lokasi: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      return [];
    }
  }

  Future<String> createPendingOrder(String uid, List<Map<String, dynamic>> cartItems, String locationId) async {
    try {
      final orderId = DateTime.now().millisecondsSinceEpoch.toString();
      final totalAmount = cartItems.fold(0.0, (sum, item) => sum + (item['price'] as num));

      await _firestore.collection('orders').doc(orderId).set({
        'uid': uid,
        'locationId': locationId,
        'orderStatus': 'pending',
        'paymentStatus': 'pending',
        'totalAmount': totalAmount,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      for (var item in cartItems) {
        final orderDetailId = '$orderId-${item['lockerId']}';
        await _firestore.collection('order_details').doc(orderDetailId).set({
          'orderDetailId': orderDetailId,
          'orderId': orderId,
          'lockerId': item['lockerId'],
          'lockerNumber': item['lockerNumber'] ?? 'Unknown',
          'hours': item['hours'],
          'price': item['price'],
          'startTime': item['startTime'],
          'endTime': item['endTime'],
          'status': 'active',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
      print('FirestoreService: Pesanan dibuat dengan orderId: $orderId');
      return orderId;
    } catch (e) {
      print('FirestoreService: Gagal membuat pesanan: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (e.toString().contains('permission-denied')) {
          Get.snackbar('Error', 'Izin ditolak: Tidak dapat membuat pesanan. Silakan hubungi admin.', backgroundColor: errorRed, colorText: backgroundWhite);
        }
      });
      rethrow;
    }
  }

  Future<void> confirmOrder(String orderId, String transactionId, String invoiceUrl) async {
    try {
      final orderDoc = await _firestore.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        throw Exception('Pesanan $orderId tidak ditemukan');
      }
      final uid = orderDoc.data()?['uid'];

      await _firestore.collection('orders').doc(orderId).update({
        'orderStatus': 'confirmed',
        'paymentStatus': 'success',
        'transactionId': transactionId,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      final totalAmount = orderDoc.data()?['totalAmount'] ?? 0.0;
      await _firestore.collection('payments').doc(transactionId).set({
        'paymentId': transactionId,
        'orderId': orderId,
        'transactionId': transactionId,
        'amount': totalAmount,
        'status': 'settlement',
        'paymentMethod': 'unknown',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      await _firestore.collection('invoices').doc(transactionId).set({
        'invoiceId': transactionId,
        'orderId': orderId,
        'paymentId': transactionId,
        'invoiceUrl': invoiceUrl,
        'status': 'paid',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      final orderDetailsSnapshot = await _firestore
          .collection('order_details')
          .where('orderId', isEqualTo: orderId)
          .get();
      for (var doc in orderDetailsSnapshot.docs) {
        final lockerId = doc.data()['lockerId'];
        final lockerDoc = await _firestore.collection('lockers').doc(lockerId).get();
        if (!lockerDoc.exists) {
          throw Exception('Loker $lockerId tidak ditemukan');
        }
        await _firestore.collection('lockers').doc(lockerId).update({
          'bookingStatus': 'booked',
          'lastUpdated': FieldValue.serverTimestamp(),
          'lastUser': uid,
          'currentOrderId': orderId,
        });
      }
      print('FirestoreService: Pesanan $orderId dikonfirmasi');
    } catch (e) {
      print('FirestoreService: Gagal mengkonfirmasi pesanan: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal mengkonfirmasi pesanan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> cancelPendingOrder(String orderId) async {
    try {
      final orderDoc = await _firestore.collection('orders').doc(orderId).get();
      if (orderDoc.exists && orderDoc.data()?['paymentStatus'] == 'pending') {
        final orderDetailsSnapshot = await _firestore
            .collection('order_details')
            .where('orderId', isEqualTo: orderId)
            .get();
        for (var doc in orderDetailsSnapshot.docs) {
          final lockerId = doc.data()['lockerId'];
          final lockerDoc = await _firestore.collection('lockers').doc(lockerId).get();
          if (!lockerDoc.exists) {
            throw Exception('Loker $lockerId tidak ditemukan');
          }
          await _firestore.collection('lockers').doc(lockerId).update({
            'bookingStatus': 'available',
            'lastUpdated': FieldValue.serverTimestamp(),
            'lastUser': null,
            'currentOrderId': null,
          });
        }
        await _firestore.collection('orders').doc(orderId).delete();
        await _firestore.collection('order_details').where('orderId', isEqualTo: orderId).get().then((snapshot) {
          for (var doc in snapshot.docs) {
            doc.reference.delete();
          }
        });
        print('FirestoreService: Pesanan $orderId dibatalkan');
      }
    } catch (e) {
      print('FirestoreService: Gagal membatalkan pesanan: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal membatalkan pesanan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> updateLockerStatus(String lockerId, String bookingStatus) async {
    try {
      final lockerDoc = await _firestore.collection('lockers').doc(lockerId).get();
      if (!lockerDoc.exists) {
        throw Exception('Loker $lockerId tidak ditemukan');
      }
      await _firestore.collection('lockers').doc(lockerId).update({
        'bookingStatus': bookingStatus,
        'lastUpdated': FieldValue.serverTimestamp(),
      });
      print('FirestoreService: Status loker $lockerId diperbarui ke $bookingStatus');
    } catch (e) {
      print('FirestoreService: Gagal memperbarui status loker: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal memperbarui status loker: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> cleanExpiredCartItems() async {
    try {
      final now = Timestamp.now();
      final expiredItems = await _firestore.collection('cart').where('expiresAt', isLessThanOrEqualTo: now).get();
      for (var doc in expiredItems.docs) {
        final data = doc.data();
        final lockerId = data['lockerId'];
        final lockerDoc = await _firestore.collection('lockers').doc(lockerId).get();
        if (!lockerDoc.exists) {
          print('FirestoreService: Loker $lockerId tidak ditemukan, melewati penghapusan item keranjang');
          continue;
        }
        await _firestore.runTransaction((transaction) async {
          transaction.delete(doc.reference);
          transaction.update(_firestore.collection('lockers').doc(lockerId), {
            'bookingStatus': 'available',
            'lastUpdated': FieldValue.serverTimestamp(),
            'lastUser': null,
            'currentOrderId': null,
          });
        });
        print('FirestoreService: Item keranjang ${doc.id} dihapus, loker $lockerId kembali tersedia');
      }
    } catch (e) {
      print('FirestoreService: Gagal membersihkan item keranjang kedaluwarsa: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal membersihkan item keranjang kedaluwarsa: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<void> cleanExpiredOrders() async {
    try {
      final now = Timestamp.now();
      final orderDetailsSnapshot = await _firestore
          .collection('order_details')
          .where('endTime', isLessThanOrEqualTo: now)
          .where('status', isEqualTo: 'active')
          .get();
      for (var doc in orderDetailsSnapshot.docs) {
        final data = doc.data();
        final orderId = data['orderId'];
        final lockerId = data['lockerId'];
        final lockerDoc = await _firestore.collection('lockers').doc(lockerId).get();
        if (!lockerDoc.exists) {
          print('FirestoreService: Loker $lockerId tidak ditemukan, melewati pembersihan pesanan');
          continue;
        }
        await _firestore.runTransaction((transaction) async {
          final orderRef = _firestore.collection('orders').doc(orderId);
          final lockerRef = _firestore.collection('lockers').doc(lockerId);
          transaction.update(doc.reference, {
            'status': 'completed',
            'updatedAt': FieldValue.serverTimestamp(),
          });
          transaction.update(orderRef, {
            'orderStatus': 'completed',
            'updatedAt': FieldValue.serverTimestamp(),
          });
          transaction.update(lockerRef, {
            'bookingStatus': 'available',
            'currentOrderId': null,
            'lastUser': null,
            'lastUpdated': FieldValue.serverTimestamp(),
          });
        });
        print('FirestoreService: Pesanan $orderId untuk loker $lockerId selesai, status loker diperbarui ke available');
      }
    } catch (e) {
      print('FirestoreService: Gagal membersihkan pesanan kedaluwarsa: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal membersihkan pesanan kedaluwarsa: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getOrderDetails(String orderId) async {
    try {
      final orderDoc = await _firestore.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        throw Exception('Pesanan $orderId tidak ditemukan');
      }
      final orderDetailsSnapshot = await _firestore
          .collection('order_details')
          .where('orderId', isEqualTo: orderId)
          .get();
      final orderDetails = orderDetailsSnapshot.docs.map((doc) {
        final data = doc.data();
        data['orderDetailId'] = doc.id;
        return data;
      }).toList();
      print('FirestoreService: Mengambil detail pesanan untuk orderId: $orderId, ditemukan ${orderDetails.length} item');
      return {
        'order': orderDoc.data(),
        'orderDetails': orderDetails,
      };
    } catch (e) {
      print('FirestoreService: Gagal mengambil detail pesanan: $e');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar('Error', 'Gagal mengambil detail pesanan: $e', backgroundColor: errorRed, colorText: backgroundWhite);
      });
      rethrow;
    }
  }

  void disposeService() {
    _cleanupTimer?.cancel();
    print('FirestoreService: Timer pembersihan dibatalkan');
  }
}