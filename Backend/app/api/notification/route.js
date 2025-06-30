import { NextResponse } from 'next/server';
import { createLogger, format, transports } from 'winston';

// Inisialisasi Logger
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

export async function POST(request) {
  try {
    const { message, userId } = await request.json();
    if (!message || !userId) {
      return NextResponse.json({ error: 'Parameter message dan userId diperlukan' }, { status: 400 });
    }

    logger.info('Mengirim notifikasi', { userId, message });

    // Simulasi pengiriman notifikasi (ganti dengan Firebase Cloud Messaging jika diperlukan)
    console.log(`Notifikasi ke user ${userId}: ${message}`);

    return NextResponse.json({ message: 'Notifikasi dikirim' }, { status: 200 });
  } catch (error) {
    logger.error('Gagal mengirim notifikasi', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}