import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createLogger, format, transports } from 'winston';
import validator from 'validator';

// Inisialisasi Logger
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Inisialisasi Rate Limiter
const rateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60
});

export async function GET(request, { params }) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimiter.consume(ip);

    // Await params untuk mendapatkan orderId
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: 'Parameter orderId diperlukan' }, { status: 400 });
    }
    if (!validator.isLength(orderId, { min: 1, max: 50 })) {
      return NextResponse.json({ error: 'orderId harus antara 1-50 karakter' }, { status: 400 });
    }

    logger.info('Menerima permintaan status transaksi', { orderId });

    // Inisialisasi Midtrans Core API
    const core = new midtransClient.CoreApi({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const statusResponse = await core.transaction.status(orderId);

    logger.info('Berhasil mendapatkan status transaksi', { orderId, status: statusResponse.transaction_status });

    return NextResponse.json(statusResponse, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      logger.warn('Rate limit terlampaui', { ip });
      return NextResponse.json({ error: 'Terlalu banyak permintaan, coba lagi nanti' }, { status: 429 });
    }

    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error_messages?.join(', ') || error.message;
    logger.error('Gagal mendapatkan status transaksi', {
      status,
      message: errorMessage,
      orderId: params.orderId || 'unknown'
    });

    return NextResponse.json({ error: errorMessage }, { status });
  }
}