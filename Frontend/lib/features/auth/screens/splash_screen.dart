import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/constants/app_routes.dart';
import '../../../core/constants/colors.dart';

/// Layar splash dengan animasi dan pemeriksaan status autentikasi.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _textController;
  late AnimationController _backgroundController;
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _logoFadeAnimation;
  late Animation<double> _textFadeAnimation;
  late Animation<Offset> _textSlideAnimation;
  late Animation<double> _backgroundAnimation;

  @override
  void initState() {
    super.initState();
    
    // Logo animations
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    
    _logoScaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoController,
      curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
    ));
    
    _logoFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoController,
      curve: const Interval(0.0, 0.8, curve: Curves.easeInOut),
    ));

    // Text animations
    _textController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _textFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _textController,
      curve: Curves.easeInOut,
    ));
    
    _textSlideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _textController,
      curve: Curves.easeOutCubic,
    ));

    // Background animation
    _backgroundController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    
    _backgroundAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _backgroundController,
      curve: Curves.easeInOut,
    ));

    _startAnimations();
  }

  /// Memulai animasi dan memeriksa status autentikasi.
  void _startAnimations() async {
    _backgroundController.forward();
    await Future.delayed(const Duration(milliseconds: 300));
    _logoController.forward();
    await Future.delayed(const Duration(milliseconds: 600));
    _textController.forward();
    await Future.delayed(const Duration(milliseconds: 1500));

    if (mounted) {
      final authService = Get.find<AuthService>();
      print('SplashScreen: Memeriksa status autentikasi...');
      await authService.waitForAuthState(); // Tunggu status autentikasi
      final user = authService.currentUser;

      if (user != null) {
        try {
          print('SplashScreen: Pengguna ditemukan, UID: ${user.uid}, memeriksa verifikasi email...');
          await user.reload();
          final refreshedUser = authService.currentUser;
          if (refreshedUser != null && refreshedUser.emailVerified) {
            print('SplashScreen: Email terverifikasi, navigasi ke MainScreen');
            Get.offAllNamed(AppRoutes.main);
          } else {
            print('SplashScreen: Email belum diverifikasi, navigasi ke EmailVerificationScreen');
            Get.offAllNamed(AppRoutes.emailVerification, arguments: {
              'email': user.email ?? '',
              'password': '',
              'fullName': user.displayName ?? '',
            });
          }
        } catch (e) {
          print('SplashScreen: Gagal memeriksa status autentikasi: $e');
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (e is FirebaseAuthException && e.code == 'user-not-found') {
              print('SplashScreen: Pengguna tidak ditemukan, logout dan navigasi ke SignInScreen');
              authService.signOut();
              Get.snackbar('Error', 'Pengguna tidak ditemukan. Silakan login ulang.', backgroundColor: errorRed, colorText: backgroundWhite);
              Get.offAllNamed(AppRoutes.signIn);
            } else {
              Get.snackbar('Error', 'Gagal memeriksa status login: $e', backgroundColor: errorRed, colorText: backgroundWhite);
              Get.offAllNamed(AppRoutes.signIn);
            }
          });
        }
      } else {
        print('SplashScreen: Tidak ada pengguna yang login, navigasi ke SignInScreen');
        Get.offAllNamed(AppRoutes.signIn);
      }
    }
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    _backgroundController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      body: AnimatedBuilder(
        animation: _backgroundAnimation,
        builder: (context, child) {
          return Container(
            width: size.width,
            height: size.height,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color.lerp(backgroundWhite, lightBlue, _backgroundAnimation.value)!,
                  Color.lerp(surfaceGray, primaryBlue, _backgroundAnimation.value)!,
                ],
              ),
            ),
            child: Stack(
              children: [
                // Background patterns
                Positioned(
                  top: -50,
                  right: -50,
                  child: AnimatedBuilder(
                    animation: _backgroundAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _backgroundAnimation.value,
                        child: Container(
                          width: 200,
                          height: 200,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: primaryBlue,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Positioned(
                  bottom: -100,
                  left: -100,
                  child: AnimatedBuilder(
                    animation: _backgroundAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _backgroundAnimation.value * 0.8,
                        child: Container(
                          width: 300,
                          height: 300,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: secondaryBlue.withOpacity(0.1),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                // Main content
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo with animations
                      AnimatedBuilder(
                        animation: _logoController,
                        builder: (context, child) {
                          return Opacity(
                            opacity: _logoFadeAnimation.value,
                            child: Transform.scale(
                              scale: _logoScaleAnimation.value,
                              child: Container(
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  color: backgroundWhite,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: textDark.withOpacity(0.1),
                                      blurRadius: 20,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: Image.asset(
                                    'assets/images/logo.png',
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                      // App name with animations
                      SlideTransition(
                        position: _textSlideAnimation,
                        child: Opacity(
                          opacity: _textFadeAnimation.value,
                          child: Text(
                            'Smart Locker',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: textDark,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      SlideTransition(
                        position: _textSlideAnimation,
                        child: Opacity(
                          opacity: _textFadeAnimation.value,
                          child: Text(
                            'Penyimpanan Cerdas, Aman, dan Mudah',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: textLight,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}