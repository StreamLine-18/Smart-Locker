import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createLogger, format, transports } from 'winston';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import validator from 'validator';
import dotenv from 'dotenv';

// Muat .env.local secara eksplisit
dotenv.config();

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

// Validasi variabel lingkungan Firebase dan Midtrans
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID', 
  'FIREBASE_PRIVATE_KEY', 
  'FIREBASE_CLIENT_EMAIL',
  'MIDTRANS_SERVER_KEY',
  'MIDTRANS_CLIENT_KEY',
  'NEXT_PUBLIC_SUCCESS_URL',
  'NEXT_PUBLIC_ERROR_URL',
  'NEXT_PUBLIC_UNFINISH_URL'
];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Logging variabel lingkungan untuk debugging
logger.info('Environment variables', {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY,
  midtransServerKeyExists: !!process.env.MIDTRANS_SERVER_KEY,
  midtransClientKeyExists: !!process.env.MIDTRANS_CLIENT_KEY,
  successUrl: process.env.NEXT_PUBLIC_SUCCESS_URL,
  errorUrl: process.env.NEXT_PUBLIC_ERROR_URL,
  unfinishUrl: process.env.NEXT_PUBLIC_UNFINISH_URL
});

// Inisialisasi Firebase
let firebaseApp;
try {
  firebaseApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
  });
  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Firebase', { error: error.message, stack: error.stack });
  throw error;
}
const db = getFirestore(firebaseApp);

export async function POST(request) {
  let body = {};
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    logger.info('Processing request from IP', { ip });
    await rateLimiter.consume(ip);

    // Baca body sekali dan simpan
    body = await request.json();
    const { orderId, amount, email, uid } = body;

    // Validasi Input
    if (!orderId || !amount || !email || !uid) {
      logger.warn('Missing required parameters', { orderId, amount, email, uid });
      return NextResponse.json({ error: 'Parameter orderId, amount, email, dan uid diperlukan' }, { status: 400 });
    }
    if (!validator.isInt(amount.toString(), { min: 1000 })) {
      logger.warn('Invalid amount', { amount });
      return NextResponse.json({ error: 'Jumlah harus berupa angka lebih dari 1000' }, { status: 400 });
    }
    if (!validator.isEmail(email)) {
      logger.warn('Invalid email format', { email });
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }
    if (!validator.isLength(orderId, { min: 1, max: 50 })) {
      logger.warn('Invalid orderId length', { orderId });
      return NextResponse.json({ error: 'orderId harus antara 1-50 karakter' }, { status: 400 });
    }

    logger.info('Received Snap token request', { orderId, amount, email, uid });

    // Verifikasi UID dengan Firestore
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        logger.warn('User document not found', { uid });
        return NextResponse.json({ error: 'Pengguna tidak valid: Dokumen pengguna tidak ditemukan' }, { status: 401 });
      }
      const firestoreEmail = userDoc.data().email;
      if (firestoreEmail.toLowerCase() !== email.toLowerCase()) {
        logger.warn('Email mismatch', { uid, email, firestoreEmail });
        return NextResponse.json({ error: 'Pengguna tidak valid: Email tidak cocok' }, { status: 401 });
      }
      logger.info('User verified successfully', { uid, email });
    } catch (firestoreError) {
      logger.error('Firestore query failed', { error: firestoreError.message, stack: firestoreError.stack });
      throw firestoreError;
    }

    // Inisialisasi Midtrans Snap
    let snap;
    try {
      snap = new midtransClient.Snap({
        isProduction: process.env.NODE_ENV === 'production',
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY
      });
      logger.info('Midtrans Snap initialized');
    } catch (midtransInitError) {
      logger.error('Failed to initialize Midtrans', { error: midtransInitError.message, stack: midtransInitError.stack });
      throw midtransInitError;
    }

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

    logger.info('Sending request to Midtrans', { orderId, amount });

    // Buat transaksi Midtrans
    let transaction;
    try {
      transaction = await snap.createTransaction(transactionDetails);
      logger.info('Successfully obtained Snap token', { orderId, token: transaction.token });
    } catch (midtransError) {
      logger.error('Midtrans transaction failed', { error: midtransError.message, stack: midtransError.stack });
      throw midtransError;
    }

    return NextResponse.json({ token: transaction.token }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      logger.warn('Rate limit exceeded', { ip });
      return NextResponse.json({ error: 'Terlalu banyak permintaan, coba lagi nanti' }, { status: 429 });
    }

    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error_messages?.join(', ') || error.message || 'Unknown error';
    logger.error('Failed to process Snap token request', {
      status,
      message: errorMessage,
      stack: error.stack,
      orderId: body.orderId || 'unknown'
    });

    return NextResponse.json({ error: errorMessage }, { status });
  }
}