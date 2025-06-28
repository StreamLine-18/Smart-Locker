import 'package:flutter/material.dart';

class MainHome extends StatefulWidget {
  const MainHome({super.key});

  @override
  State<MainHome> createState() => _MainHomeState();
}

class _MainHomeState extends State<MainHome> {
  final TextEditingController searchController = TextEditingController();

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Lockers'),
        actions: const [
          Icon(Icons.notifications),
          SizedBox(width: 10),
          Icon(Icons.share),
          SizedBox(width: 10),
          Icon(Icons.edit),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Search Bar di bawah AppBar
          TextField(
            controller: searchController,
            decoration: InputDecoration(
              hintText: 'Cari locker atau lokasi...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
            ),
            onChanged: (value) {
              // Tambahkan logika pencarian/filter di sini jika diperlukan
              // Misal: setState(() { ... });
            },
          ),
          const SizedBox(height: 16),
          const UserInfo(),
          const SizedBox(height: 16),
          const SectionTitle(title: 'Active Bookings'),
          const ActiveBookings(),
          const SizedBox(height: 16),
          const SectionTitle(title: 'Available Lockers'),
          const AvailableLockers(),
          const SizedBox(height: 16),
          const SectionTitle(title: 'Quick Access'),
          const QuickAccessButtons(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.bookmark), label: 'Bookings'),
          BottomNavigationBarItem(icon: Icon(Icons.lock), label: 'Lockers'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
        currentIndex: 0,
        onTap: (index) {
          // Tambahkan navigasi sesuai kebutuhan
          if (index == 1) {
            Navigator.pushNamed(context, '/history');
          } else if (index == 2) {
            Navigator.pushNamed(context, '/select_locker');
          } else if (index == 3) {
            Navigator.pushNamed(context, '/profile');
          }
        },
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  const SectionTitle({required this.title, super.key});

  @override
  Widget build(BuildContext context) {
    return Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold));
  }
}

class UserInfo extends StatelessWidget {
  const UserInfo({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const CircleAvatar(
          backgroundImage: AssetImage('assets/images/profile1.jpg'), // Gambar placeholder
          radius: 30,
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('imam samudra', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            Text('imamsmdraa@example.com', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ],
    );
  }
}

class ActiveBookings extends StatelessWidget {
  const ActiveBookings({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 170,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: const [
          BookingCard(lockerName: 'Locker A1', bookingDetails: 'Booked until 5 PM'),
          BookingCard(lockerName: 'Locker B2', bookingDetails: 'Booked until 6 PM'),
          BookingCard(lockerName: 'Locker B2', bookingDetails: 'Booked until 6 PM'),
          BookingCard(lockerName: 'Locker B2', bookingDetails: 'Booked until 6 PM'),
        ],
      ),
    );
  }
}

class BookingCard extends StatelessWidget {
  final String lockerName;
  final String bookingDetails;

  const BookingCard({super.key, required this.lockerName, required this.bookingDetails});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(right: 12),
      child: Container(
        width: 150,
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            
            Image.asset(
              'assets/images/lokasilocker.jpg', 
              width: 150,
              height: 80,
              fit: BoxFit.cover,
            ),
            const SizedBox(height: 8),
            Text(lockerName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(bookingDetails, style: const TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class AvailableLockers extends StatelessWidget {
  const AvailableLockers({super.key});

  @override
  Widget build(BuildContext context) {
    final lockers = ['Locker C3', 'Locker D4', 'Locker E5', 'Locker F6'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: lockers
            .map(
              (label) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: LockerButton(label: label),
              ),
            )
            .toList(),
      ),
    );
  }
}

class LockerButton extends StatelessWidget {
  final String label;

  const LockerButton({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Pilih $label')),
        );
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue[100],
        foregroundColor: Colors.blue,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: Text(label),
    );
  }
}

class QuickAccessButtons extends StatelessWidget {
  const QuickAccessButtons({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
  SizedBox(
    width: double.infinity,
    child: ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue, // warna utama
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
      ),
      icon: const Icon(Icons.book_online),
      label: const Text('My Booking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      onPressed: () {
        Navigator.pushNamed(context, '/history');
      },
    ),
  ),
  const SizedBox(height: 12),
  SizedBox(
    width: double.infinity,
    child: ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.green, // warna sekunder/aksen
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
      ),
      icon: const Icon(Icons.search),
      label: const Text('Find Locker', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      onPressed: () {
        Navigator.pushNamed(context, '/select_locker');
      },
    ),
  ),
],
    );
  }
}