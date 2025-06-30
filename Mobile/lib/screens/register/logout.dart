import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(
    home: LogoutConfirmationScreen(),
    debugShowCheckedModeBanner: false,
  ));
}

class LogoutConfirmationScreen extends StatelessWidget {
  const LogoutConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF3E7D6B),
              Color(0xFF2E5D51),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Center(
          child: Container(
            width: screenWidth * 0.8,
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Color(0xFFC8DCD2), // abu hijau muda
              // tidak ada borderRadius di sini, jadi bentuknya persegi
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.logout,
                  size: 64,
                  color: Colors.grey,
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    buildButton(
                      label: "Cancel",
                      colors: [Colors.brown, Colors.green.shade200],
                      onTap: () {
                        Navigator.pop(context);
                      },
                    ),
                    buildButton(
                      label: "Logout",
                      colors: [Colors.green.shade400, Colors.teal.shade800],
                      onTap: () {
                        debugPrint("Logout tapped");
                      },
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

  static Widget buildButton({
    required String label,
    required List<Color> colors,
    required VoidCallback onTap,
  }) {
    return Container(
      width: 100,
      height: 40,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors),
        borderRadius: BorderRadius.circular(12), // tombol tetap rounded
        boxShadow: const [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 4,
            offset: Offset(1, 2),
          )
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
