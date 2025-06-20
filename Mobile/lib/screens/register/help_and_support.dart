import 'package:flutter/material.dart';

void main() {
  runApp(const HelpAndSupportScreen());
}

class HelpAndSupportScreen extends StatelessWidget {
  const HelpAndSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.light(),
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: const Color(0xFF16423C),
        body: const HelpSupportContent(),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: 3,
          selectedItemColor: Colors.teal,
          unselectedItemColor: Colors.grey,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Card'),
            BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: 'Transactions'),
            BottomNavigationBarItem(icon: Icon(Icons.upload), label: 'Requests'),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

class HelpSupportContent extends StatelessWidget {
  const HelpSupportContent({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 16.0, top: 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Help and Support',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x20000000),
                  blurRadius: 20,
                  offset: Offset(0, 4),
                )
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF50BF95), Color(0xFF386F5A)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Aplikasinya sangat responsif\ndan desain minimalis\nmudah untuk di pahami',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  width: 100,
                  height: 100,
                  color: Colors.limeAccent, // kotak hijau seperti di gambar
                ),
                const SizedBox(height: 20),
                Container(
                  height: 50,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF50BF95), Color(0xFF386F5A)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          Column(
            children: const [
              SizedBox(height: 10),
              Icon(Icons.shield_outlined, color: Colors.cyan, size: 32),
              Text(
                'Smart Locker',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'No Keys, No Hassle, Just Click !',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.white70,
                ),
              ),
              SizedBox(height: 10),
            ],
          )
        ],
      ),
    );
  }
}
