import 'package:flutter/material.dart';
import '/routes/app_routes.dart';

class SuccessScreen extends StatelessWidget {
  const SuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF37655A),
      body: Stack(
        clipBehavior: Clip.none,
        children: [
          // Kotak abu-abu besar di tengah
          Positioned(
            left: 42,
            top: 100, // Lebih naik agar proporsional dengan tombol
            child: Container(
              width: 309,
              height: 394,
              decoration: BoxDecoration(
                color: const Color(0xFFC4DAD2),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          // Gambar centang
          Positioned(
            left: 116,
            top: 170, // Naik mengikuti container abu
            child: Container(
              width: 161,
              height: 140,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                image: const DecorationImage(
                  image: AssetImage('assets/images/images.png'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          // Background hijau gelap melengkung atas putih
          Positioned(
            left: -55,
            top: 370, // Naik untuk proporsi
            child: Container(
              width: 504,
              height: 461,
              decoration: BoxDecoration(
                color: const Color(0xFF16423C),
                borderRadius: BorderRadius.circular(113),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 58.2,
                  ),
                ],
              ),
            ),
          ),
          // Background putih bawah hijau
          Positioned(
            left: -55,
            top: 480, // Naik untuk proporsi
            child: Container(
              width: 504,
              height: 313,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(113),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 58.2,
                  ),
                ],
              ),
            ),
          ),
          // Tulisan SUCCESS
          Positioned(
            left: 76,
            top: 400, // Ditarik naik agar tepat berada di tengah lengkungan hijau gelap
            child: const Text(
              'SUCCESS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 50,
                fontFamily: 'Inter',
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          // Tombol Back Home
          Positioned(
            left: 95,
            top: 520, // Naik
            child: _buildActionButton(
              context: context,
              text: 'Back Home',
              onPressed: () {
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  AppRoutes.home,
                  (route) => false,
                );
              },
            ),
          ),
          // Tombol Detail
          Positioned(
            left: 95,
            top: 600, // Naik
            child: _buildActionButton(
              context: context,
              text: 'Detail',
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required BuildContext context,
    required String text,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: 204,
      height: 57,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(width: 1),
          ),
          elevation: 5,
          shadowColor: Colors.black.withOpacity(0.5),
        ),
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF16423C), Color(0xFF6CD6AE)],
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 21.29,
                fontFamily: 'Inter',
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
