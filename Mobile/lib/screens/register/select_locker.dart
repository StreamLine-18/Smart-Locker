import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

void main() => runApp(const BookingLockerApp());

class BookingLockerApp extends StatelessWidget {
  const BookingLockerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Locker',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.grey[100],
      ),
      home: const BookingLockerScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class BookingLockerScreen extends StatefulWidget {
  const BookingLockerScreen({super.key});

  @override
  State<BookingLockerScreen> createState() => _BookingLockerScreenState();
}

class _BookingLockerScreenState extends State<BookingLockerScreen> {
  String selectedSize = 'Semua';
  String selectedFilter = 'Semua';
  String durationInput = '';
  DateTime? selectedDate;

  final TextEditingController durationController = TextEditingController();

  final List<String> sizes = ['Semua', 'S', 'M', 'L'];
  final List<String> filters = ['Semua', 'Tersedia', 'Terisi'];

  final List<Map<String, dynamic>> lockers = List.generate(12, (index) {
    return {
      'id': index + 1,
      'size': ['S', 'M', 'L'][index % 3],
      'available': index % 4 != 0,
    };
  });

  Future<void> _pickDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null) {
      setState(() {
        selectedDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = screenWidth > 600 ? 4 : 2;

    final filteredLockers = lockers.where((locker) {
      final sizeMatch =
          selectedSize == 'Semua' || locker['size'] == selectedSize;
      final filterMatch = selectedFilter == 'Semua' ||
          (selectedFilter == 'Tersedia' && locker['available']) ||
          (selectedFilter == 'Terisi' && !locker['available']);
      return sizeMatch && filterMatch;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Booking Locker'),
        centerTitle: true,
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Card(
                  elevation: 6,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.settings, color: Colors.deepPurple),
                            SizedBox(width: 8),
                            Text(
                              "Pengaturan Booking",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.deepPurple,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: selectedSize,
                                decoration: const InputDecoration(
                                  labelText: 'Ukuran Locker',
                                  border: OutlineInputBorder(),
                                ),
                                items: sizes
                                    .map((s) => DropdownMenuItem(
                                        value: s, child: Text(s)))
                                    .toList(),
                                onChanged: (val) =>
                                    setState(() => selectedSize = val!),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: selectedFilter,
                                decoration: const InputDecoration(
                                  labelText: 'Status Locker',
                                  border: OutlineInputBorder(),
                                ),
                                items: filters
                                    .map((f) => DropdownMenuItem(
                                        value: f, child: Text(f)))
                                    .toList(),
                                onChanged: (val) =>
                                    setState(() => selectedFilter = val!),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: durationController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  labelText: 'Durasi (jam)',
                                  prefixIcon: Icon(Icons.timer),
                                  border: OutlineInputBorder(),
                                ),
                                onChanged: (val) =>
                                    setState(() => durationInput = val),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => _pickDate(context),
                                child: AbsorbPointer(
                                  child: TextFormField(
                                    decoration: InputDecoration(
                                      labelText: 'Tanggal Booking',
                                      prefixIcon:
                                          const Icon(Icons.calendar_today),
                                      border: const OutlineInputBorder(),
                                      hintText: 'Pilih tanggal',
                                      suffixIcon:
                                          const Icon(Icons.edit_calendar),
                                    ),
                                    controller: TextEditingController(
                                      text: selectedDate != null
                                          ? DateFormat('dd MMM yyyy')
                                              .format(selectedDate!)
                                          : '',
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final locker = filteredLockers[index];
                    final isAvailable = locker['available'];

                    return GestureDetector(
                      onTap: isAvailable &&
                              durationInput.isNotEmpty &&
                              selectedDate != null
                          ? () => showDialog(
                                context: context,
                                builder: (_) => AlertDialog(
                                  title: const Text("Konfirmasi Booking"),
                                  content: Text(
                                      "Booking Locker #${locker['id']} (Ukuran ${locker['size']}) untuk $durationInput jam pada ${DateFormat('dd MMM yyyy').format(selectedDate!)}?"),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(context),
                                      child: const Text("Batal"),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                'Locker #${locker['id']} berhasil dibooking!'),
                                          ),
                                        );
                                      },
                                      child: const Text("Ya, Booking"),
                                    )
                                  ],
                                ),
                              )
                          : null,
                      child: Card(
                        elevation: 3,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        color: isAvailable
                            ? Colors.green.shade50
                            : Colors.grey.shade300,
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                isAvailable
                                    ? Icons.lock_open
                                    : Icons.lock,
                                size: 28,
                                color: isAvailable
                                    ? Colors.green
                                    : Colors.grey.shade700,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                "Locker #${locker['id']}",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: isAvailable
                                      ? Colors.black
                                      : Colors.grey.shade600,
                                ),
                              ),
                              Text("Ukuran: ${locker['size']}"),
                              const SizedBox(height: 4),
                              Text(
                                isAvailable ? "Tersedia" : "Terisi",
                                style: TextStyle(
                                  color: isAvailable
                                      ? Colors.green
                                      : Colors.grey.shade600,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                  childCount: filteredLockers.length,
                ),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.85,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
