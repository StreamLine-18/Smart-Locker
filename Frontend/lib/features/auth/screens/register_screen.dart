import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/primary_button.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';

/// Layar untuk registrasi pengguna baru dengan verifikasi email.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> with SingleTickerProviderStateMixin {
  final AuthService _authService = Get.find<AuthService>();
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  late AnimationController _controller;
  late Animation<double> _animation;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    print('RegisterScreen: Menginisialisasi state...');
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();
  }

  @override
  void dispose() {
    print('RegisterScreen: Membersihkan controller...');
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _controller.dispose();
    super.dispose();
  }

  /// Mendaftarkan pengguna baru dan mengirim email verifikasi.
  void _submit() async {
    if (_formKey.currentState!.validate()) {
      if (_passwordController.text != _confirmPasswordController.text) {
        setState(() => _errorMessage = 'Kata sandi tidak cocok');
        return;
      }
      setState(() => _isLoading = true);
      try {
        print('RegisterScreen: Mendaftar pengguna dengan email: ${_emailController.text}');
        await _authService.signUp(
          _emailController.text.trim(),
          _passwordController.text.trim(),
          '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
        );
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar(
            'Sukses',
            'Email verifikasi dikirim ke ${_emailController.text.trim()}. Silakan verifikasi untuk melanjutkan.',
            backgroundColor: successGreen,
            colorText: backgroundWhite,
          );
        });
        print('RegisterScreen: Navigasi ke EmailVerificationScreen');
        Get.offAllNamed(AppRoutes.emailVerification, arguments: {
          'email': _emailController.text.trim(),
          'password': _passwordController.text.trim(),
          'fullName': '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
        });
      } catch (e) {
        String errorMessage = e.toString().contains('email-already-in-use')
            ? 'Email sudah digunakan. Coba yang lain.'
            : 'Pendaftaran gagal. Coba lagi.';
        print('RegisterScreen: Gagal mendaftar: $errorMessage');
        setState(() => _errorMessage = errorMessage);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('Error', errorMessage, backgroundColor: errorRed, colorText: backgroundWhite);
        });
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Image.asset('assets/images/logo.png', width: 24, height: 24),
                      const SizedBox(width: 8),
                      Text('Smart Locker', style: Theme.of(context).textTheme.headlineMedium),
                    ],
                  ),
                  const SizedBox(height: 24),
                  if (isWide)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Buat', style: Theme.of(context).textTheme.headlineLarge),
                              Text('Akun Anda', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: textLight)),
                              const SizedBox(height: 4),
                              Text('Masukkan detail Anda untuk memulai', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: textLight)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 32),
                        Image.asset('assets/images/note.png', width: size.width * 0.3, height: size.height * 0.25),
                      ],
                    )
                  else
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Buat', style: Theme.of(context).textTheme.headlineLarge),
                        Text('Akun Anda', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: textLight)),
                        const SizedBox(height: 4),
                        Text('Masukkan detail Anda untuk memulai', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: textLight)),
                        const SizedBox(height: 16),
                        Center(child: Image.asset('assets/images/note.png', width: size.width * 0.5, height: size.height * 0.25)),
                      ],
                    ),
                  const SizedBox(height: 24),
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => Get.toNamed(AppRoutes.signIn),
                                  child: Container(
                                    height: 45,
                                    decoration: BoxDecoration(
                                      color: surfaceGray,
                                      borderRadius: const BorderRadius.only(topLeft: Radius.circular(12)),
                                    ),
                                    child: Center(child: Text('Masuk', style: Theme.of(context).textTheme.labelMedium)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Container(
                                  height: 45,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(colors: [primaryBlue, secondaryBlue]),
                                    borderRadius: const BorderRadius.only(topRight: Radius.circular(12)),
                                  ),
                                  child: Center(child: Text('Daftar', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: backgroundWhite))),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Form(
                            key: _formKey,
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Expanded(child: CustomTextField(
                                      controller: _firstNameController,
                                      hintText: 'Nama Depan',
                                      keyboardType: TextInputType.name,
                                      prefixIcon: const Icon(Icons.person, color: primaryBlue),
                                      validator: (v) => v?.isEmpty ?? true ? 'Masukkan nama depan' : null,
                                    )),
                                    const SizedBox(width: 12),
                                    Expanded(child: CustomTextField(
                                      controller: _lastNameController,
                                      hintText: 'Nama Belakang',
                                      keyboardType: TextInputType.name,
                                      prefixIcon: const Icon(Icons.person, color: primaryBlue),
                                      validator: (v) => v?.isEmpty ?? true ? 'Masukkan nama belakang' : null,
                                    )),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                CustomTextField(
                                  controller: _emailController,
                                  hintText: 'Email',
                                  keyboardType: TextInputType.emailAddress,
                                  prefixIcon: const Icon(Icons.email, color: primaryBlue),
                                  validator: (v) => v?.isEmpty ?? true
                                      ? 'Masukkan email yang valid'
                                      : !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v!)
                                      ? 'Format email tidak valid'
                                      : null,
                                ),
                                const SizedBox(height: 12),
                                CustomTextField(
                                  controller: _passwordController,
                                  hintText: 'Kata Sandi',
                                  obscureText: true,
                                  keyboardType: TextInputType.visiblePassword,
                                  prefixIcon: const Icon(Icons.lock, color: primaryBlue),
                                  validator: (v) => (v?.length ?? 0) < 8 ? 'Kata sandi minimal 8 karakter' : null,
                                  helperText: 'Gunakan 8+ karakter dengan kombinasi huruf dan angka.',
                                ),
                                const SizedBox(height: 12),
                                CustomTextField(
                                  controller: _confirmPasswordController,
                                  hintText: 'Konfirmasi Kata Sandi',
                                  obscureText: true,
                                  keyboardType: TextInputType.visiblePassword,
                                  prefixIcon: const Icon(Icons.lock, color: primaryBlue),
                                  validator: (v) => v?.isEmpty ?? true
                                      ? 'Konfirmasi kata sandi Anda'
                                      : _passwordController.text != v
                                      ? 'Kata sandi tidak cocok'
                                      : null,
                                ),
                                if (_errorMessage != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 10),
                                    child: Text(_errorMessage!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: errorRed)),
                                  ),
                                const SizedBox(height: 24),
                                _isLoading
                                    ? const Center(child: CircularProgressIndicator(color: primaryBlue))
                                    : PrimaryButton(
                                        text: 'Buat Akun',
                                        icon: Icons.person_add,
                                        onPressed: _isLoading ? () {} : () => _submit(),
                                        isLoading: _isLoading,
                                      ),
                                const SizedBox(height: 16),
                                Text.rich(
                                  TextSpan(
                                    text: 'Dengan melanjutkan, Anda setuju dengan ',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textLight),
                                    children: [
                                      TextSpan(
                                        text: 'Ketentuan Layanan',
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                              color: primaryBlue,
                                              decoration: TextDecoration.underline,
                                            ),
                                      ),
                                      const TextSpan(text: ' dan '),
                                      TextSpan(
                                        text: 'Kebijakan Privasi',
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                              color: primaryBlue,
                                              decoration: TextDecoration.underline,
                                            ),
                                      ),
                                    ],
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
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