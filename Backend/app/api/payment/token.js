import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createLogger, format, transports } from 'winston';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
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
  points: 10,
  duration: 60
});

// Inisialisasi Firebase
const firebaseApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  })
});
const db = getFirestore(firebaseApp);

export async function POST(request) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimiter.consume(ip);

    // Validasi Input
    const { orderId, amount, email, uid } = await request.json();
    if (!orderId || !amount || !email || !uid) {
      return NextResponse.json({ error: 'Parameter orderId, amount, email, dan uid diperlukan' }, { status: 400 });
    }
    if (!validator.isInt(amount.toString(), { min: 1000 })) {
      return NextResponse.json({ error: 'Jumlah harus berupa angka lebih dari 1000' }, { status: 400 });
    }
    if (!validator.isEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }
    if (!validator.isLength(orderId, { min: 1, max: 50 })) {
      return NextResponse.json({ error: 'orderId harus antara 1-50 karakter' }, { status: 400 });
    }

    // Verifikasi UID dengan Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().email !== email) {
      return NextResponse.json({ error: 'Pengguna tidak valid' }, { status: 401 });
    }

    logger.info('Menerima permintaan token Snap', { orderId, amount, email, uid });

    // Inisialisasi Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: { email },
      enabled_payments: ['credit_card'],
      credit_card: {
        secure: true,
        channel: 'migs',
        authentication: '3ds'
      },
      callbacks: {
        finish: process.env.NEXT_PUBLIC_SUCCESS_URL,
        error: process.env.NEXT_PUBLIC_ERROR_URL,
        unfinish: process.env.NEXT_PUBLIC_UNFINISH_URL
      },
      custom_expiry: {
        expiry_duration: 60,
        unit: 'minute'
      }
    };

    logger.info('Mengirim permintaan ke Midtrans', { orderId, amount });

    const transaction = await snap.createTransaction(transactionDetails);

    logger.info('Berhasil mendapatkan token Snap', { orderId, token: transaction.token });

    return NextResponse.json({ token: transaction.token }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      logger.warn('Rate limit terlampaui', { ip });
      return NextResponse.json({ error: 'Terlalu banyak permintaan, coba lagi nanti' }, { status: 429 });
    }

    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error_messages?.join(', ') || error.message;
    logger.error('Gagal mendapatkan token Snap', {
      status,
      message: errorMessage,
      orderId: request.json()?.orderId || 'unknown'
    });

    return NextResponse.json({ error: errorMessage }, { status });
  }
}