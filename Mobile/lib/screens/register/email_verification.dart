import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// EmailVerificationScreen
/// Halaman untuk verifikasi email dengan input kode OTP
/// Desain responsif untuk iPhone 14 Pro Max, iPad, hingga laptop

class EmailVerificationScreen extends StatefulWidget {
  const EmailVerificationScreen({super.key});

  @override
  State<EmailVerificationScreen> createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  int _timer = 20;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (_timer > 0 && mounted) {
        setState(() => _timer--);
        _startTimer();
      }
    });
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _submitCode() {
    String code = _controllers.map((c) => c.text).join();
    debugPrint('Kode verifikasi: $code');
    // TODO: Kirim kode ke backend untuk verifikasi
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final padding = size.width * 0.06;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        padding: EdgeInsets.symmetric(horizontal: padding),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF6DD6AE), Color(0xFF16423C)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 48),

              // Logo + Text Branding
              Row(
                children: [
                  Image.asset(
                    'assets/images/logo.png',
                    width: 22,
                    height: 23,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Smart Locker',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      height: 1.4,
                      letterSpacing: -0.01,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Ilustrasi password
              Image.asset(
                'assets/images/password.png',
                width: size.width * 0.9,
                height: size.height * 0.25,
                fit: BoxFit.contain,
              ),

              const SizedBox(height: 16),

              // Judul
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'VERIFY YOUR EMAIL',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w800,
                    fontSize: 26,
                    height: 1.0,
                    color: Colors.white,
                  ),
                ),
              ),

              const SizedBox(height: 8),

              // Deskripsi
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'We\u2019ve sent an Email with an activation code to your Email',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w400,
                    fontSize: 11,
                    height: 1.25,
                    color: Colors.white,
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Container Putih berisi input OTP
              Container(
                padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Label
                    Text(
                      'Enter Your code number',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // OTP Input Fields
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) {
                        return SizedBox(
                          width: 45,
                          child: TextField(
                            controller: _controllers[index],
                            focusNode: _focusNodes[index],
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            maxLength: 1,
                            decoration: InputDecoration(
                              counterText: '',
                              contentPadding: const EdgeInsets.symmetric(vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onChanged: (value) {
                              if (value.isNotEmpty && index < 5) {
                                _focusNodes[index + 1].requestFocus();
                              } else if (value.isEmpty && index > 0) {
                                _focusNodes[index - 1].requestFocus();
                              }
                            },
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 24),

                    // Timer
                    Center(
                      child: Text(
                        'Send code again 00:${_timer.toString().padLeft(2, '0')}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Tombol Submit
                    Center(
                      child: ElevatedButton(
                        onPressed: _submitCode,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6DD6AE),
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Verify Code',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 200), // Padding tambahan untuk keyboard
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
