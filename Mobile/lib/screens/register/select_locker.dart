import 'package:flutter/material.dart';

void main() {
  runApp(const BookingLockerApp());
}

class BookingLockerApp extends StatelessWidget {
  const BookingLockerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.blue,
      ),
      home: const BookingLockerScreen(),
    );
  }
}

class BookingLockerScreen extends StatefulWidget {
  const BookingLockerScreen({super.key});

  @override
  State<BookingLockerScreen> createState() => _BookingLockerScreenState();
}

class _BookingLockerScreenState extends State<BookingLockerScreen> {
  String selectedSize = 'All';
  String selectedStatus = 'All';
  DateTime? selectedDate;
  int selectedDuration = 1;
  String? selectedLocker;

  final allLockers = [
    {'number': '01', 'size': 'Small', 'status': 'Available'},
    {'number': '02', 'size': 'Medium', 'status': 'Occupied'},
    {'number': '03', 'size': 'Large', 'status': 'Available'},
    {'number': '04', 'size': 'Small', 'status': 'Occupied'},
    {'number': '05', 'size': 'Medium', 'status': 'Available'},
    {'number': '06', 'size': 'Large', 'status': 'Available'},
  ];

  List<Map<String, String>> get filteredLockers {
    return allLockers.where((locker) {
      final matchSize = selectedSize == 'All' || locker['size'] == selectedSize;
      final matchStatus = selectedStatus == 'All' || locker['status'] == selectedStatus;
      return matchSize && matchStatus;
    }).toList();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2101),
    );
    if (picked != null) {
      final TimeOfDay? pickedTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );
      if (pickedTime != null) {
        setState(() => selectedDate = DateTime(
              picked.year,
              picked.month,
              picked.day,
              pickedTime.hour,
              pickedTime.minute,
            ));
      }
    }
  }

  void _confirmSelection() {
    if (selectedLocker != null && selectedDate != null) {
      final endDate = selectedDate!.add(Duration(hours: selectedDuration));
      showDialog(
        context: context,
        builder: (BuildContext dialogContext) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Booking Confirmed'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Locker: $selectedLocker'),
                Text('Start: ${selectedDate!.day}/${selectedDate!.month}/${selectedDate!.year} at ${selectedDate!.hour.toString().padLeft(2, '0')}:${selectedDate!.minute.toString().padLeft(2, '0')}'),
                Text('End: ${endDate.day}/${endDate.month}/${endDate.year} at ${endDate.hour.toString().padLeft(2, '0')}:${endDate.minute.toString().padLeft(2, '0')}'),
                const SizedBox(height: 10),
                const Text('Thank you for booking!', style: TextStyle(fontWeight: FontWeight.w500)),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('Close'),
              ),
            ],
          );
        },
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a locker, date, and duration'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Locker'),
        centerTitle: true,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.blue, Colors.blueAccent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          decoration: const InputDecoration(labelText: 'Locker Size'),
                          value: selectedSize,
                          items: ['All', 'Small', 'Medium', 'Large']
                              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                              .toList(),
                          onChanged: (value) => setState(() => selectedSize = value!),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          decoration: const InputDecoration(labelText: 'Locker Status'),
                          value: selectedStatus,
                          items: ['All', 'Available', 'Occupied']
                              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                              .toList(),
                          onChanged: (value) => setState(() => selectedStatus = value!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.calendar_today),
                          label: Text(selectedDate == null
                              ? 'Pick Date & Time'
                              : '${selectedDate!.day}/${selectedDate!.month}/${selectedDate!.year} ${selectedDate!.hour.toString().padLeft(2, '0')}:${selectedDate!.minute.toString().padLeft(2, '0')}'),
                          onPressed: () => _selectDate(context),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          initialValue: selectedDuration.toString(),
                          decoration: const InputDecoration(labelText: 'Duration (hours)'),
                          keyboardType: TextInputType.number,
                          onChanged: (val) => setState(() {
                            selectedDuration = int.tryParse(val) ?? 1;
                          }),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: GridView.builder(
                itemCount: filteredLockers.length,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1,
                ),
                itemBuilder: (context, index) {
                  final locker = filteredLockers[index];
                  final isAvailable = locker['status'] == 'Available';
                  final isSelected = selectedLocker == locker['number'];

                  return GestureDetector(
                    onTap: isAvailable
                        ? () => setState(() => selectedLocker = locker['number'])
                        : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: isAvailable ? Colors.green[50] : Colors.grey[300],
                        borderRadius: BorderRadius.circular(12),
                        border: isSelected ? Border.all(color: Colors.blue, width: 2) : null,
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            isAvailable ? Icons.lock_open : Icons.lock,
                            color: isAvailable ? Colors.green : Colors.grey,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Locker ${locker['number']}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text('Size: ${locker['size']}'),
                          const SizedBox(height: 4),
                          Text(
                            locker['status']!,
                            style: TextStyle(
                              color: isAvailable ? Colors.green : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _confirmSelection,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Confirm Selection',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
