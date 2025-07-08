import 'package:get/get.dart';

class CartController extends GetxController {
  var cartItems = <Map<String, dynamic>>[].obs;

  void updateCartItems(List<Map<String, dynamic>> items) {
    cartItems.assignAll(items);
  }

  void clearCart() {
    cartItems.clear();
  }

  void removeCartItem(String cartId) {
    cartItems.removeWhere((item) => item['cartId'] == cartId);
  }
}