import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/firestore_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../../auth/widgets/primary_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  final AuthService _authService = Get.find<AuthService>();
  final FirestoreService _firestoreService = Get.find<FirestoreService>();
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _fetchUserData();
    _controller.forward();
  }

  Future<void> _fetchUserData() async {
    setState(() => _isLoading = true);
    try {
      final userId = _authService.currentUser?.uid;
      if (userId == null) {
        Get.snackbar(
          'Error', 
          'Pengguna belum login', 
          backgroundColor: errorRed, 
          colorText: backgroundWhite,
          snackPosition: SnackPosition.TOP,
          margin: const EdgeInsets.all(16),
          borderRadius: 12,
          icon: const Icon(Icons.error_outline, color: backgroundWhite),
        );
        return;
      }
      final userDoc = await _firestoreService.firestore.collection('users').doc(userId).get();
      setState(() {
        _userData = userDoc.data();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      Get.snackbar(
        'Error', 
        'Gagal memuat data pengguna: $e', 
        backgroundColor: errorRed, 
        colorText: backgroundWhite,
        snackPosition: SnackPosition.TOP,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(Icons.error_outline, color: backgroundWhite),
      );
    }
  }

  Future<void> _signOut() async {
    // Show confirmation dialog
    final confirmed = await _showSignOutDialog();
    if (!confirmed) return;

    setState(() => _isLoading = true);
    try {
      await _authService.signOut();
      Get.offAllNamed(AppRoutes.signIn);
      Get.snackbar(
        'Sukses', 
        'Berhasil keluar', 
        backgroundColor: successGreen, 
        colorText: backgroundWhite,
        snackPosition: SnackPosition.TOP,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(Icons.check_circle, color: backgroundWhite),
      );
    } catch (e) {
      Get.snackbar(
        'Error', 
        'Gagal keluar: $e', 
        backgroundColor: errorRed, 
        colorText: backgroundWhite,
        snackPosition: SnackPosition.TOP,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(Icons.error_outline, color: backgroundWhite),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<bool> _showSignOutDialog() async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: warningOrange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.logout, color: warningOrange),
            ),
            const SizedBox(width: 12),
            const Text('Konfirmasi Keluar'),
          ],
        ),
        content: const Text('Apakah Anda yakin ingin keluar dari aplikasi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: errorRed,
              foregroundColor: backgroundWhite,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Keluar'),
          ),
        ],
      ),
    ) ?? false;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Saya', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: backgroundWhite,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            child: CircleAvatar(
              backgroundColor: primaryBlue.withOpacity(0.1),
              child: Text(
                _userData?['name']?.toString().substring(0, 1).toUpperCase() ?? 'U',
                style: const TextStyle(
                  color: primaryBlue,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [lightBlue, backgroundWhite],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: primaryBlue))
            : SlideTransition(
                position: _slideAnimation,
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header Section with Welcome Message
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [primaryBlue, secondaryBlue],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: primaryBlue.withOpacity(0.3),
                                blurRadius: 15,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Hero(
                                tag: 'profile_avatar',
                                child: Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    color: backgroundWhite,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Text(
                                      _userData?['name']?.toString().substring(0, 1).toUpperCase() ?? 'U',
                                      style: const TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.bold,
                                        color: primaryBlue,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Selamat Datang!',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: backgroundWhite.withOpacity(0.9),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _userData?['name'] ?? 'Pengguna',
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: backgroundWhite,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Profile Information Section
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: backgroundWhite,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: primaryBlue.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.info_outline, color: primaryBlue),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Informasi Akun',
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              
                              _buildProfileInfoItem(
                                icon: Icons.person_outline,
                                title: 'Nama Lengkap',
                                value: _userData?['name'] ?? 'Tidak Diketahui',
                                color: primaryBlue,
                              ),
                              
                              const SizedBox(height: 16),
                              
                              _buildProfileInfoItem(
                                icon: Icons.email_outlined,
                                title: 'Email',
                                value: _userData?['email'] ?? 'Tidak Diketahui',
                                color: accentBlue,
                              ),
                              
                              const SizedBox(height: 16),
                              
                              _buildProfileInfoItem(
                                icon: _authService.currentUser?.emailVerified == true 
                                    ? Icons.verified_user 
                                    : Icons.warning_amber_outlined,
                                title: 'Status Verifikasi',
                                value: _authService.currentUser?.emailVerified == true 
                                    ? 'Email Terverifikasi' 
                                    : 'Email Belum Terverifikasi',
                                color: _authService.currentUser?.emailVerified == true 
                                    ? successGreen 
                                    : warningOrange,
                                isStatus: true,
                              ),
                              
                              const SizedBox(height: 16),
                              
                              _buildProfileInfoItem(
                                icon: Icons.access_time,
                                title: 'Bergabung',
                                value: _userData?['createdAt'] != null 
                                    ? 'Member sejak ${DateTime.now().year}' 
                                    : 'Tidak Diketahui',
                                color: textLight,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Statistics Section
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: backgroundWhite,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: successGreen.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.analytics_outlined, color: successGreen),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Statistik Penggunaan',
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildStatCard(
                                      'Total Booking',
                                      '0',
                                      Icons.book_online,
                                      primaryBlue,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildStatCard(
                                      'Aktif Hari Ini',
                                      '0',
                                      Icons.today,
                                      successGreen,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Quick Actions Section
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: backgroundWhite,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: accentBlue.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.dashboard_outlined, color: accentBlue),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Aksi Cepat',
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              
                              _buildQuickActionItem(
                                icon: Icons.history,
                                title: 'Riwayat Booking',
                                subtitle: 'Lihat semua booking Anda',
                                color: primaryBlue,
                                onTap: () {
                                  Get.snackbar(
                                    'Info', 
                                    'Fitur riwayat booking sedang dikembangkan',
                                    backgroundColor: warningOrange,
                                    colorText: backgroundWhite,
                                    snackPosition: SnackPosition.TOP,
                                    margin: const EdgeInsets.all(16),
                                    borderRadius: 12,
                                  );
                                },
                              ),
                              
                              const SizedBox(height: 12),
                              
                              _buildQuickActionItem(
                                icon: Icons.settings,
                                title: 'Pengaturan',
                                subtitle: 'Kelola preferensi akun',
                                color: textLight,
                                onTap: () {
                                  Get.snackbar(
                                    'Info', 
                                    'Fitur pengaturan sedang dikembangkan',
                                    backgroundColor: warningOrange,
                                    colorText: backgroundWhite,
                                    snackPosition: SnackPosition.TOP,
                                    margin: const EdgeInsets.all(16),
                                    borderRadius: 12,
                                  );
                                },
                              ),
                              
                              const SizedBox(height: 12),
                              
                              _buildQuickActionItem(
                                icon: Icons.help_outline,
                                title: 'Bantuan & Dukungan',
                                subtitle: 'Dapatkan bantuan penggunaan',
                                color: accentBlue,
                                onTap: () {
                                  Get.snackbar(
                                    'Info', 
                                    'Hubungi admin untuk bantuan lebih lanjut',
                                    backgroundColor: primaryBlue,
                                    colorText: backgroundWhite,
                                    snackPosition: SnackPosition.TOP,
                                    margin: const EdgeInsets.all(16),
                                    borderRadius: 12,
                                  );
                                },
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Sign Out Button
                        PrimaryButton(
                          text: 'Keluar dari Akun',
                          icon: Icons.logout,
                          onPressed: _signOut,
                          isLoading: _isLoading,
                          isSecondary: true,
                        ),

                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildProfileInfoItem({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
    bool isStatus = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surfaceGray,
        borderRadius: BorderRadius.circular(16),
        border: isStatus ? Border.all(color: color.withOpacity(0.3)) : null,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: textLight,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: isStatus ? color : textDark,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: textLight,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: surfaceGray),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: textLight,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: textLight,
              ),
            ],
          ),
        ),
      ),
    );
  }
}