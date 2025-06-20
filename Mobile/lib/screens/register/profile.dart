import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF6A9C89), // background hijau
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 20),
              const Text(
                'Profile',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () {
                  Navigator.pushNamed(context, '/edit_profile');
                },
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 6,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Row(
                    children: const [
                      CircleAvatar(
                        radius: 30,
                        backgroundImage: AssetImage('assets/images/avatar.png'),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Muhammad Sumbul',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'MuhammadSumbul69@gmail.com',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.edit, color: Colors.grey),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _ProfileCard(
                children: [
                  _ProfileOption(
                    icon: Icons.language,
                    title: 'Languages',
                    subtitle: 'Change your languages',
                    onTap: () => Navigator.pushNamed(context, '/language'),
                  ),
                  _ProfileOption(
                    icon: Icons.history,
                    title: 'History',
                    subtitle: 'Your History',
                    onTap: () => Navigator.pushNamed(context, '/history'),
                  ),
                  _ProfileOption(
                    icon: Icons.logout,
                    title: 'Log out',
                    subtitle: 'Further secure your account for safety',
                    onTap: () => Navigator.pushReplacementNamed(context, '/sign-in'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text(
                'More',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              _ProfileCard(
                children: [
                  _ProfileOption(
                    icon: Icons.help_outline,
                    title: 'Help & Support',
                    onTap: () => Navigator.pushNamed(context, '/help_and_support'),
                  ),
                  _ProfileOption(
                    icon: Icons.favorite_border,
                    title: 'About App',
                    onTap: () => Navigator.pushNamed(context, '/about'),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              Column(
                children: const [
                  Icon(Icons.shield_rounded, size: 36, color: Colors.white),
                  SizedBox(height: 8),
                  Text('Smart Locker', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  Text('No Keys, No Hassle, Just Click !', style: TextStyle(color: Colors.white)),
                ],
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 3,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF6A9C89),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.credit_card), label: 'Card'),
          BottomNavigationBarItem(icon: Icon(Icons.swap_vert), label: 'Transactions'),
          BottomNavigationBarItem(icon: Icon(Icons.message), label: 'Requests'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushNamed(context, '/card');
              break;
            case 1:
              Navigator.pushNamed(context, '/transactions');
              break;
            case 2:
              Navigator.pushNamed(context, '/requests');
              break;
          }
        },
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  final List<Widget> children;

  const _ProfileCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _ProfileOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  const _ProfileOption({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF6A9C89)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }
}
