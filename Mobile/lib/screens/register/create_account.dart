import 'package:flutter/material.dart';
import 'package:register_smartlocker/widgets/custom_textfield.dart';
import 'package:register_smartlocker/widgets/primary_button.dart';

/// Screen untuk pembuatan akun baru (Register Page)
class CreateAccountScreen extends StatelessWidget {
  const CreateAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // Controller untuk input form
    final TextEditingController _firstNameController = TextEditingController();
    final TextEditingController _lastNameController = TextEditingController();
    final TextEditingController _emailController = TextEditingController();
    final TextEditingController _passwordController = TextEditingController();
    final TextEditingController _confirmPasswordController =
        TextEditingController();

    return Scaffold(
      backgroundColor: const Color(0xFF6DD6AE),
      body: SafeArea(
        child: Stack(
          children: [
            // ======== Background Gradien ========
            Container(
              width: size.width,
              height: size.height,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFF6DD6AE),
                    Color(0xFF16423C),
                  ],
                ),
              ),
            ),

            // ======== Latar Putih Melengkung (Card Input) ========
            Positioned(
              top: size.height * 0.28,
              left: -size.width * 0.1,
              child: Container(
                width: size.width * 1.2,
                height: size.height * 0.75,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(113),
                ),
              ),
            ),

            // ======== Logo dan Judul App ========
            Positioned(
              top: 20,
              left: 20,
              child: Row(
                children: [
                  Image.asset(
                    'assets/images/logo.png',
                    width: 23,
                    height: 24,
                  ),
                  const SizedBox(width: 2),
                  // const SizedBox(height: 20),
                  const Text(
                    'Smart Locker',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            // ======== Judul dan Deskripsi Halaman Register ========
            Positioned(
              top: size.height * 0.1,
              left: 22,
              right: 22,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Create',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 48,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 0),
                  Text(
                    'your Account',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w800,
                      fontSize: 20,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 1),
                  Text(
                    'Enter your email and password to log in',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w500,
                      fontSize: 11,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            // ======== Gambar Hiasan (Note) ========
            Positioned(
              top: 20,
              right: 20,
              child: Image.asset(
                'assets/images/note.png',
                width: size.width * 0.4,
                height: size.height * 0.25,
                fit: BoxFit.contain,
              ),
            ),

            // ======== Form Input dan Tombol ========
            Positioned.fill(
              top: size.height * 0.35,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 30),
                child: Column(
                  children: [
                    // ======== Tab Login / Register ========
                    Row(
                      children: [
                        // Tombol Login
                        Expanded(
                          child: Container(
                            height: 41,
                            decoration: BoxDecoration(
                              color: const Color(0xFFC8C9CA),
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: TextButton(
                              onPressed: () {
                                // Navigasi ke halaman login
                                Navigator.pushNamed(context, '/login');
                              },
                              child: const Text(
                                'Log in',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Tab Aktif Register
                        Expanded(
                          child: Container(
                            height: 41,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF6A9C89), Color(0xFF6A9C89)],
                              ),
                              borderRadius: BorderRadius.circular(9),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0xBF000000),
                                  offset: Offset(0, 4),
                                  blurRadius: 12.6,
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Text(
                                'Register',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // ======== Input Nama Depan dan Belakang ========
                    Row(
                      children: [
                        Expanded(
                          child: CustomTextField(
                            controller: _firstNameController,
                            hintText: 'First Name',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: CustomTextField(
                            controller: _lastNameController,
                            hintText: 'Last Name',
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // ======== Input Email ========
                    CustomTextField(
                      controller: _emailController,
                      hintText: 'E-mail',
                    ),

                    const SizedBox(height: 12),

                    // ======== Input Password ========
                    CustomTextField(
                      controller: _passwordController,
                      hintText: 'Password',
                      obscureText: true,
                    ),

                    // Keterangan Password
                    const Padding(
                      padding: EdgeInsets.only(top: 4, left: 8),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'must contain 8 char.',
                          style: TextStyle(fontSize: 10, color: Colors.grey),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // ======== Konfirmasi Password ========
                    CustomTextField(
                      controller: _confirmPasswordController,
                      hintText: 'Confirm Password',
                      obscureText: true,
                    ),

                    const SizedBox(height: 24),

                    // ======== Tombol Buat Akun ========
                    PrimaryButton(
                      text: 'Create Account',
                      onPressed: () {
                        Navigator.pushNamed(context, '/verify');
                        // TODO: Tambahkan logika pendaftaran akun
                      },
                    ),

                    const SizedBox(height: 16),

                    // ======== Syarat dan Ketentuan ========
                    const Text.rich(
                      TextSpan(
                        text: 'By continuing, you agree to our ',
                        style: TextStyle(fontSize: 10),
                        children: [
                          TextSpan(
                            text: 'Terms of Service',
                            style: TextStyle(
                              decoration: TextDecoration.underline,
                              color: Colors.blue,
                            ),
                          ),
                          TextSpan(text: ' and '),
                          TextSpan(
                            text: 'Privacy Policy.',
                            style: TextStyle(
                              decoration: TextDecoration.underline,
                              color: Colors.blue,
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
