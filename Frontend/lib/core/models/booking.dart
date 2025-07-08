class Booking {
  final String id;
  final String location;
  final String lockerId;
  final String date;
  final String time;
  final String price;
  final String status;

  Booking({
    required this.id,
    required this.location,
    required this.lockerId,
    required this.date,
    required this.time,
    required this.price,
    required this.status,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as String,
      location: json['location'] as String,
      lockerId: json['lockerId'] as String,
      date: json['date'] as String,
      time: json['time'] as String,
      price: json['price'] as String,
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'location': location,
      'lockerId': lockerId,
      'date': date,
      'time': time,
      'price': price,
      'status': status,
    };
  }
}