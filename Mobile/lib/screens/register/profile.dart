import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFF1D726C), // Warna background hijau gradasi
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 3,
        selectedItemColor: Colors.teal,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.credit_card), label: 'Card'),
          BottomNavigationBarItem(icon: Icon(Icons.swap_vert), label: 'Transactions'),
          BottomNavigationBarItem(icon: Icon(Icons.inbox), label: 'Requests'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Profile", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 16),

              // Profile Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF3BB07B), Color(0xFF1D726C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                ),
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 30,
                      backgroundImage: AssetImage('assets/avatar_placeholder.png'), // Ganti sesuai asset kamu
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text("Muhammad Sumbul", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          SizedBox(height: 4),
                          Text("MuhammadSumbul69@gmail.com", style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                    const Icon(Icons.edit, color: Colors.white),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Section 1
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _buildListTile(
                      icon: Icons.language,
                      title: "Languages",
                      subtitle: "Change your languages",
                      trailing: const Icon(Icons.warning, color: Colors.red),
                    ),
                    _buildListTile(
                      icon: Icons.history,
                      title: "History",
                      subtitle: "Your History",
                    ),
                    _buildListTile(
                      icon: Icons.logout,
                      title: "Log out",
                      subtitle: "Further secure your account for safety",
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              const Center(child: Text("More", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),

              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _buildListTile(
                      icon: Icons.support,
                      title: "Help & Support",
                    ),
                    _buildListTile(
                      icon: Icons.info,
                      title: "About App",
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
              // Footer logo
              Center(
                child: Column(
                  children: const [
                    Icon(Icons.shield, color: Colors.teal, size: 40), // Ganti dengan logo asli kalau ada
                    SizedBox(height: 8),
                    Text("Smart Locker", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    Text("No Keys, No Hassle, Just Click !", style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.teal),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle, style: const TextStyle(fontSize: 12)) : null,
      trailing: trailing ?? const Icon(Icons.chevron_right),
    );
  }
}
