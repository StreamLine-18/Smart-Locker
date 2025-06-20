import 'package:flutter/material.dart';
import '/routes/app_routes.dart';
import '/widgets/custom_button.dart';
// Langsung warna dan textstyle di dalam file
class AppColors {
  static const primary = Color(0xFF6A9C89);
  static const secondary = Color(0xFF16423C);
  static const grey = Color(0xFFC4DAD2);
  static const textBlack = Colors.black;
}

class AppTextStyles {
  static const heading = TextStyle(
    fontSize: 28.8,
    fontWeight: FontWeight.w700,
    color: AppColors.textBlack,
  );
  static const normal = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.textBlack,
  );
  static const buttonText = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Text('Select Metode Payment', style: AppTextStyles.normal)),
              const SizedBox(height: 16),
              Container(
                height: 126,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF2A3E36)),
                  image: const DecorationImage(
                    image: NetworkImage('https://placehold.co/344x126'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Masjid IC', style: AppTextStyles.heading),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.secondary],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Jl. Ringroad Selatan, Kragilan, Tamanan, Kec. Banguntapan, Kabupaten Bantul, DIY 55191',
                  style: TextStyle(color: Colors.white, fontSize: 14, height: 1.4),
                ),
              ),
              const SizedBox(height: 16),
              Text('Booking Summary', style: AppTextStyles.normal),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.grey,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF2A3E36)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Masjid IC - Locker A1\nSize - Small\nDuration - 3 Hours',
                      style: TextStyle(color: Color(0xFF16423C), fontSize: 18, fontFamily: 'Itim'),
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        'Rp. 15.000',
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 25,
                          fontFamily: 'Fredoka One',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text('Payment Method', style: AppTextStyles.normal),
              const SizedBox(height: 8),
              buildPaymentOption('Credit', 'Visa, Mastercard', AppColors.secondary),
              buildPaymentOption('E-Wallet', 'BRI, BCA, DANA', AppColors.grey),
              buildPaymentOption('Cash', '', AppColors.grey),
              const SizedBox(height: 24),
              CustomButton(
                text: 'Checkout Now',
                onPressed: () {
                  Navigator.pushNamed(context, AppRoutes.payment);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildPaymentOption(String title, String subtitle, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
      child: ListTile(
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        subtitle: subtitle.isNotEmpty
            ? Text(subtitle, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold))
            : null,
        trailing: const Icon(Icons.circle_outlined, color: Colors.white),
      ),
    );
  }
}
