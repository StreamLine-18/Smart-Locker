import 'package:flutter/material.dart';

void main() {
  runApp(const HelpAndSupportScreen());
}

class HelpAndSupportScreen extends StatelessWidget {
  const HelpAndSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color.fromARGB(255, 18, 32, 47),
      ),
      home: Scaffold(
        body: ListView(children: const [
          Profile(),
        ]),
      ),
    );
  }
}

class Profile extends StatelessWidget {
  const Profile({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 403,
          height: 861,
          clipBehavior: Clip.antiAlias,
          decoration: const BoxDecoration(color: Color(0xFFF9F9F9)),
          child: Stack(
            children: [
              Positioned(
                left: 5,
                top: 102,
                child: Container(
                  width: 393,
                  height: 788,
                  decoration: ShapeDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment(0.50, -0.00),
                      end: Alignment(0.50, 1.00),
                      colors: [Color(0xFF38A898), Color(0xFF16423C)],
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    shadows: const [
                      BoxShadow(
                        color: Color(0x59000000),
                        blurRadius: 58.20,
                        offset: Offset(0, 0),
                        spreadRadius: 0,
                      )
                    ],
                  ),
                ),
              ),
              Positioned(
                left: 25,
                top: 59,
                child: Text(
                  'Help and suport',
                  style: TextStyle(
                    color: const Color(0xFF181D27),
                    fontSize: 20,
                    fontFamily: 'DM Sans',
                    fontWeight: FontWeight.w700,
                    height: 1.05,
                  ),
                ),
              ),
              Positioned(
                left: 30,
                top: 134,
                child: Container(
                  width: 343,
                  height: 350,
                  decoration: ShapeDecoration(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(70),
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        left: 0,
                        top: -5,
                        child: Container(
                          width: 343,
                          height: 566,
                          decoration: ShapeDecoration(
                            color: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
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
                      Positioned(
                        left: 14,
                        top: 11,
                        child: Container(
                          width: 316,
                          height: 420,
                          decoration: ShapeDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment(0.00, 0.50),
                              end: Alignment(1.00, 0.50),
                              colors: [Color(0xFF50BF95), Color(0xFF386F5A)],
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
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
                      Positioned(
                        left: 14,
                        top: 477,
                        child: Container(
                          width: 316,
                          height: 67,
                          decoration: ShapeDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment(0.00, 0.50),
                              end: Alignment(1.00, 0.50),
                              colors: [Color(0xFF50BF95), Color(0xFF386F5A)],
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
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
                      const Positioned(
                        left: 26,
                        top: 27,
                        child: SizedBox(
                          width: 291,
                          child: Text(
                            'Aplikasinya sangat resposnsif\ndan desain minimalis\nmudah untuk di pahami',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontFamily: 'DM Sans',
                              fontWeight: FontWeight.w700,
                              height: 1.30,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                left: 188,
                top: 710,
                child: Container(
                  width: 22.31,
                  height: 23,
                  decoration: BoxDecoration(
                    image: const DecorationImage(
                      image: NetworkImage("https://placehold.co/22x23"),
                      fit: BoxFit.fill,
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x19000000),
                        blurRadius: 2.10,
                        offset: Offset(2, 3),
                        spreadRadius: 0,
                      )
                    ],
                  ),
                ),
              ),
              const Positioned(
                left: 162,
                top: 735,
                child: Text(
                  'Smart Locker',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    height: 1.40,
                    letterSpacing: -0.11,
                  ),
                ),
              ),
              const Positioned(
                left: 132,
                top: 749,
                child: Text(
                  'No Keys, No Hassle, Just Click !',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w300,
                    height: 1.40,
                    letterSpacing: 0.56,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
