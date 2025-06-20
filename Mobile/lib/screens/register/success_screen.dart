import 'package:flutter/material.dart';
import 'package:register_smartlocker/routes/app_routes.dart';
import '/widgets/custom_button.dart';

// Langsung warna dan textstyle di dalam file
class AppColors {
  static const primary = Color(0xFF6A9C89);
  static const secondary = Color(0xFF16423C);
  static const grey = Color(0xFFC4DAD2);
  static const textBlack = Colors.black;
}

class AppTextStyles {
  static const heading = TextStyle(
    fontSize: 28.8,
    fontWeight: FontWeight.w700,
    color: AppColors.textBlack,
  );
  static const normal = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.textBlack,
  );
  static const buttonText = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );
}

class SuccessScreen extends StatelessWidget {
  const SuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF37655A),
      body: SafeArea(
        child: Stack(
          children: [
            // Background Circle 1
            Positioned(
              left: -55,
              top: 481,
              child: Container(
                width: 504,
                height: 461,
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(113),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x59000000),
                      blurRadius: 58.2,
                    ),
                  ],
                ),
              ),
            ),
            // Background Circle 2
            Positioned(
              left: -55,
              top: 596,
              child: Container(
                width: 504,
                height: 313,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(113),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x59000000),
                      blurRadius: 58.2,
                    ),
                  ],
                ),
              ),
            ),
            // SUCCESS Text
            Positioned(
              left: 76,
              top: 516,
              child: const Text(
                'SUCCESS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 50,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            // Image Success
            Positioned(
              left: 116,
              top: 299,
              child: Container(
                width: 161,
                height: 140,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  image: const DecorationImage(
                    image: NetworkImage('https://placehold.co/161x140'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            // Button Back Home
            Positioned(
              left: 95,
              top: 655,
              child: SizedBox(
                width: 204,
                height: 57,
                child: CustomButton(
                  text: 'Back Home',
                  onPressed: () {
                    Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (route) => false);
                  },
                ),
              ),
            ),
            // Button Detail
            Positioned(
              left: 95,
              top: 743,
              child: SizedBox(
                width: 204,
                height: 57,
                child: CustomButton(
                  text: 'Detail',
                  onPressed: () {
                    // TODO: Tambahkan navigasi ke halaman detail jika ada
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
