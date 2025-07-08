import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/primary_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final AuthService _authService = Get.find<AuthService>();
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  late AnimationController _controller;
  late Animation<double> _animation;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    print('LoginScreen: Menginisialisasi state...');
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();
  }

  @override
  void dispose() {
    print('LoginScreen: Membersihkan controller...');
    _emailController.dispose();
    _passwordController.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      try {
        print('LoginScreen: Mencoba login dengan email: ${_emailController.text}');
        await _authService.signIn(
          _emailController.text.trim(),
          _passwordController.text.trim(),
        );
        await _authService.waitForAuthState();
        print('LoginScreen: Login berhasil, navigasi ke MainScreen');
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.offAllNamed(AppRoutes.main);
        });
      } catch (e) {
        String errorMessage = e.toString().contains('user-not-found')
            ? 'Email tidak ditemukan. Silakan daftar.'
            : e.toString().contains('wrong-password')
            ? 'Kata sandi salah.'
            : e.toString().contains('Email belum diverifikasi')
            ? 'Email belum diverifikasi. Silakan cek email Anda.'
            : 'Gagal masuk. Coba lagi.';
        print('LoginScreen: Gagal login: $errorMessage');
        setState(() => _errorMessage = errorMessage);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('Error', errorMessage, backgroundColor: errorRed, colorText: backgroundWhite);
        });
        if (e.toString().contains('Email belum diverifikasi')) {
          _showResendVerificationDialog();
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  void _showResendVerificationDialog() {
    showDialog(
      context: context,
      builder: (context) {
        final TextEditingController passwordController = TextEditingController();
        bool isDialogLoading = false;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Verifikasi Email Diperlukan'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Email Anda belum diverifikasi. Kirim ulang email verifikasi?'),
                  const SizedBox(height: 16),
                  CustomTextField(
                    controller: passwordController,
                    hintText: 'Masukkan Kata Sandi',
                    obscureText: true,
                    prefixIcon: const Icon(Icons.lock),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal', style: TextStyle(color: textLight)),
                ),
                PrimaryButton(
                  text: isDialogLoading ? 'Mengirim...' : 'Kirim Ulang',
                  icon: Icons.email,
                  onPressed: isDialogLoading
                      ? () {}
                      : () async {
                          setDialogState(() => isDialogLoading = true);
                          try {
                            print('LoginScreen: Mengirim ulang email verifikasi untuk: ${_emailController.text}');
                            await _authService.resendVerificationEmail(
                              _emailController.text.trim(),
                              passwordController.text.trim(),
                            );
                            Navigator.pop(context);
                          } catch (e) {
                            print('LoginScreen: Gagal mengirim ulang email verifikasi: $e');
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

  Widget _socialButton({required String icon, required String label, required VoidCallback onPressed}) {
    return GestureDetector(
      onTap: onPressed,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 50,
        decoration: BoxDecoration(
          border: Border.all(color: dividerColor),
          borderRadius: BorderRadius.circular(12),
          color: backgroundWhite,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(icon, height: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width >= 600;

    return Scaffold(
      backgroundColor: backgroundWhite,
      body: SafeArea(
        child: SingleChildScrollView(
          child: FadeTransition(
            opacity: _animation,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: isWide ? CrossAxisAlignment.start : CrossAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: isWide ? MainAxisAlignment.start : MainAxisAlignment.center,
                    children: [
                      Image.asset('assets/images/logo.png', height: 32),
                      const SizedBox(width: 8),
                      Text('Smart Locker', style: Theme.of(context).textTheme.headlineMedium),
                    ],
                  ),
                  const SizedBox(height: 24),
                  if (isWide)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(child: _buildFormContent(isWide)),
                        const SizedBox(width: 32),
                        Image.asset('assets/images/verify.png', height: 400),
                      ],
                    )
                  else
                    Column(
                      children: [
                        Image.asset('assets/images/verify.png', height: 200),
                        const SizedBox(height: 16),
                        _buildFormContent(isWide),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormContent(bool isWide) {
    return Column(
      crossAxisAlignment: isWide ? CrossAxisAlignment.start : CrossAxisAlignment.center,
      children: [
        Text('Masuk', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 8),
        Text('ke Akun Anda', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: textLight)),
        const SizedBox(height: 16),
        Text('Masukkan email dan kata sandi Anda', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: textLight)),
        const SizedBox(height: 24),
        Card(
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 50,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: [primaryBlue, secondaryBlue]),
                            borderRadius: const BorderRadius.only(topLeft: Radius.circular(12)),
                          ),
                          child: Center(child: Text('Masuk', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: backgroundWhite))),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => Get.toNamed(AppRoutes.createAccount),
                          child: Container(
                            height: 50,
                            decoration: BoxDecoration(color: surfaceGray, borderRadius: const BorderRadius.only(topRight: Radius.circular(12))),
                            child: Center(child: Text('Daftar', style: Theme.of(context).textTheme.labelMedium)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  CustomTextField(
                    controller: _emailController,
                    hintText: 'Email',
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: const Icon(Icons.email, color: primaryBlue),
                    validator: (v) => v?.isEmpty ?? true ? 'Masukkan email yang valid' : !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v!) ? 'Format email tidak valid' : null,
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    controller: _passwordController,
                    hintText: 'Kata Sandi',
                    obscureText: true,
                    keyboardType: TextInputType.visiblePassword,
                    prefixIcon: const Icon(Icons.lock, color: primaryBlue),
                    validator: (v) => (v?.length ?? 0) < 6 ? 'Kata sandi minimal 6 karakter' : null,
                    suffixIcon: TextButton(
                      onPressed: () => WidgetsBinding.instance.addPostFrameCallback((_) {
                        Get.snackbar('Info', 'Hubungi dukungan untuk mereset kata sandi.', backgroundColor: successGreen, colorText: backgroundWhite);
                      }),
                      child: Text('Lupa?', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: primaryBlue)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _isLoading
                      ? const Center(child: CircularProgressIndicator(color: primaryBlue))
                      : PrimaryButton(
                          text: 'Masuk',
                          icon: Icons.login,
                          onPressed: _isLoading ? () {} : () => _submit(),
                          isLoading: _isLoading,
                        ),
                  const SizedBox(height: 16),
                  Row(
                    children: const [
                      Expanded(child: Divider(color: dividerColor)),
                      Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('Atau', style: TextStyle(color: textLight))),
                      Expanded(child: Divider(color: dividerColor)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _socialButton(icon: 'assets/images/google.png', label: 'Lanjut dengan Google', onPressed: () {}),
                  const SizedBox(height: 12),
                  _socialButton(icon: 'assets/images/facebook.png', label: 'Lanjut dengan Facebook', onPressed: () {}),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: () => Get.toNamed(AppRoutes.createAccount),
                    child: Text.rich(
                      TextSpan(
                        text: "Belum punya akun? ",
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: textLight),
                        children: [
                          TextSpan(
                            text: 'Daftar',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: primaryBlue, decoration: TextDecoration.underline),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(_errorMessage!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: errorRed)),
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}