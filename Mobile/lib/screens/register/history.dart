import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: HistoryScreen()));
}

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('History'),
        backgroundColor: const Color.fromARGB(255, 255, 255, 255),
      ),
      body: Column(
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(color: Color(0xFFF9F9F9)),
              child: const ProfileUser(),
            ),
          ),
        ],
      ),
    );
  }
}

class ProfileUser extends StatelessWidget {
  const ProfileUser({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF50BF95),
              Color(0xFF39705B),
            ],
          ),
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Container Putih Besar (Gradient + History Title + Active Booking)
            SizedBox(
              width: 343,
              height: 558,
              child: Stack(
                children: [
                  // Background Gradient Putih
                  Positioned(
                    left: 0,
                    top: 0,
                    child: Container(
                      width: 343,
                      height: 558,
                      decoration: ShapeDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment(0.50, -0.00),
                          end: Alignment(0.50, 1.00),
                          colors: [Colors.white, Color(0xFF50BD93)],
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(5),
                        ),
                        shadows: const [
                          BoxShadow(
                            color: Color(0x0F000000),
                            blurRadius: 44,
                            offset: Offset(0, 4),
                            spreadRadius: 0,
                          )
                        ],
                      ),
                    ),
                  ),
                  // Title dan Elemen
                  Positioned(
                    left: 17,
                    top: 31.55,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Transform.rotate(
                          angle: 1.57,
                          child: const SizedBox(
                            width: 15,
                            height: 25,
                            child: Stack(),
                          ),
                        ),
                        const Text(
                          'History',
                          style: TextStyle(
                            color: Color(0xFF181D27),
                            fontSize: 30,
                            fontFamily: 'DM Sans',
                            fontWeight: FontWeight.w700,
                            height: 0.65,
                          ),
                        ),
                        const SizedBox(height: 25),
                        Container(
                          width: 40,
                          height: 40,
                          decoration: const ShapeDecoration(
                            color: Color(0xFF39705B),
                            shape: OvalBorder(),
                          ),
                        ),
                        const SizedBox(height: 25),
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: Stack(),
                        ),
                      ],
                    ),
                  ),
                  // Active Booking di dalam container putih
                  Positioned(
                    left: 10,
                    top: 150,
                    child: SizedBox(
                      width: 320,
                      height: 350,
                      child: Stack(
                        children: [
                          Container(
                            width: double.infinity,
                            height: double.infinity,
                            decoration: const BoxDecoration(
                              image: DecorationImage(
                                image: AssetImage('assets/images/history.png'),
                                fit: BoxFit.cover,
                              ),
                              borderRadius: BorderRadius.all(Radius.circular(10)),
                            ),
                          ),
                          const Positioned(
                            top: 20,
                            left: 20,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Active Booking',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 10),
                                Text(
                                  'Kampus UAD 4',
                                  style: TextStyle(fontSize: 16, color: Colors.white),
                                ),
                                SizedBox(height: 10),
                                Text(
                                  'A1',
                                  style: TextStyle(
                                    fontSize: 96,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 20),
                                Text(
                                  'Expired in',
                                  style: TextStyle(fontSize: 16, color: Colors.white),
                                ),
                                Text(
                                  '3 : 59 : 10',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 20),
                                Text(
                                  'Rp. 15.000',
                                  style: TextStyle(
                                    fontSize: 25,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
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

            const SizedBox(height: 30), // Jarak dengan bawah
          ],
        ),
      ),
    );
  }
}
