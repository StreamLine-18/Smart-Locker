import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../widgets/primary_button.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';

/// Layar untuk memverifikasi email pengguna setelah registrasi.
class EmailVerificationScreen extends StatefulWidget {
  const EmailVerificationScreen({Key? key}) : super(key: key);

  @override
  _EmailVerificationScreenState createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> with SingleTickerProviderStateMixin {
  final AuthService _authService = Get.find<AuthService>();
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    print('EmailVerificationScreen: Menginisialisasi state...');
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();
  }

  /// Memeriksa status verifikasi email dan menyimpan data pengguna.
  void _checkVerification() async {
    if (!_isLoading) {
      setState(() => _isLoading = true);
      try {
        final args = Get.arguments as Map<String, dynamic>? ?? {};
        final email = args['email'] as String? ?? '';
        final password = args['password'] as String? ?? '';
        final fullName = args['fullName'] as String? ?? '';
        print('EmailVerificationScreen: Memeriksa verifikasi untuk email: $email');

        bool isVerified = await _authService.verifyEmailAndSaveUserData(email, password, fullName);
        if (isVerified) {
          print('EmailVerificationScreen: Email terverifikasi, navigasi ke MainScreen');
          await _controller.reverse();
          Get.offAllNamed(AppRoutes.main);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Get.snackbar('Sukses', 'Email berhasil diverifikasi.', backgroundColor: successGreen, colorText: backgroundWhite);
          });
        } else {
          print('EmailVerificationScreen: Email belum diverifikasi');
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Get.snackbar('Info', 'Email belum diverifikasi. Klik tautan di email Anda.', backgroundColor: warningOrange, colorText: backgroundWhite);
          });
        }
      } catch (e) {
        print('EmailVerificationScreen: Gagal memeriksa verifikasi: $e');
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('Error', 'Gagal memeriksa verifikasi: $e', backgroundColor: errorRed, colorText: backgroundWhite);
        });
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  /// Menampilkan dialog untuk mengirim ulang email verifikasi.
  void _showResendVerificationDialog() {
    showDialog(
      context: context,
      builder: (context) {
        final TextEditingController emailController = TextEditingController();
        final TextEditingController passwordController = TextEditingController();
        bool isDialogLoading = false;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Kirim Ulang Email Verifikasi'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Masukkan email dan kata sandi untuk mengirim ulang email verifikasi.'),
                  const SizedBox(height: 16),
                  TextField(
                    controller: emailController,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      prefixIcon: const Icon(Icons.email),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: passwordController,
                    decoration: InputDecoration(
                      labelText: 'Kata Sandi',
                      prefixIcon: const Icon(Icons.lock),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    obscureText: true,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal', style: TextStyle(color: textLight)),
                ),
                PrimaryButton(
                  text: isDialogLoading ? 'Mengirim...' : 'Kirim',
                  icon: Icons.email,
                  onPressed: isDialogLoading
                      ? () {}
                      : () async {
                          setDialogState(() => isDialogLoading = true);
                          try {
                            print('EmailVerificationScreen: Mengirim ulang email verifikasi untuk: ${emailController.text}');
                            await _authService.resendVerificationEmail(
                              emailController.text.trim(),
                              passwordController.text.trim(),
                            );
                            Navigator.pop(context);
                          } catch (e) {
                            print('EmailVerificationScreen: Gagal mengirim ulang email verifikasi: $e');
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              Get.snackbar('Error', 'Gagal mengirim ulang email: $e', backgroundColor: errorRed, colorText: backgroundWhite);
                            });
                          } finally {
                            setDialogState(() => isDialogLoading = false);
                          }
                        },
                  isLoading: isDialogLoading,
                  isSecondary: true,
                  width: 120,
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    print('EmailVerificationScreen: Membersihkan controller...');
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: backgroundWhite,
      body: SafeArea(
        child: SingleChildScrollView(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: size.width * 0.06),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 48),
                  Row(
                    children: [
                      Image.asset('assets/images/logo.png', width: 24, height: 24),
                      const SizedBox(width: 8),
                      Text('Smart Locker', style: Theme.of(context).textTheme.titleLarge),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Image.asset('assets/images/verify.png', width: size.width * 0.9, height: size.height * 0.25),
                  const SizedBox(height: 16),
                  Text(
                    'VERIFIKASI EMAIL ANDA',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Kami telah mengirim tautan verifikasi ke email Anda. Klik tautan untuk mengaktifkan akun Anda.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: textLight),
                  ),
                  const SizedBox(height: 32),
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Periksa Email Anda',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 20),
                          Text(
                            'Buka kotak masuk email Anda (atau folder spam/junk) dan klik tautan verifikasi untuk mengaktifkan akun Anda.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: textLight),
                          ),
                          const SizedBox(height: 24),
                          Center(
                            child: PrimaryButton(
                              text: 'Periksa Verifikasi',
                              icon: Icons.email,
                              onPressed: _isLoading ? () {} : () => _checkVerification(),
                              isLoading: _isLoading,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: TextButton(
                              onPressed: _isLoading ? null : _showResendVerificationDialog,
                              child: Text(
                                'Kirim Ulang Tautan Verifikasi',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: primaryBlue),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: TextButton(
                              onPressed: () => Get.toNamed(AppRoutes.signIn),
                              child: Text(
                                'Kembali ke Masuk',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: textLight),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}