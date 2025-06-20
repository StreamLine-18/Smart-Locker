import 'package:flutter/material.dart';

class OpenningScreen extends StatelessWidget {
  const OpenningScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SingleChildScrollView(
          child: SizedBox(
            width: double.infinity,
            child: Column(
              children: [
                const SizedBox(height: 50),
                Image.asset(
                  'assets/images/logo1.png',
                  width: 180,
                  height: 180,
                ),
                const SizedBox(height: 30),
                Text(
                  'Smart Locker',
                  style: TextStyle(
                    color: const Color(0xFF4D3E3E),
                    fontSize: 36,
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.36,
                    shadows: [
                      Shadow(
                        offset: Offset(2, 3),
                        blurRadius: 2,
                        color: Colors.black.withOpacity(0.1),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 80),
                const Text(
                  'Explore the app',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF4D3E3E),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 30, vertical: 16),
                  child: Text(
                    'Now your finances are in one place and always under control',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.black54,
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28.0),
                  child: SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6A9C89),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(9),
                        ),
                      ),
                      onPressed: () {
                        Navigator.pushNamed(context, '/sign-in');
                      },
                      child: const Text(
                        'Start',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
