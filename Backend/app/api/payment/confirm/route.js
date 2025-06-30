import { NextResponse } from 'next/server';
import { createLogger, format, transports } from 'winston';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import dotenv from 'dotenv';

// Muat .env.local secara eksplisit untuk debugging
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

// Validasi variabel lingkungan Firebase
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Logging variabel lingkungan untuk debugging
logger.info('Firebase environment variables', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY
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
} catch (error) {
  logger.error('Failed to initialize Firebase', { error: error.message });
  throw error;
}
const db = getFirestore(firebaseApp);

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, transactionId, invoiceUrl, uid } = body;
    if (!orderId || !transactionId || !invoiceUrl || !uid) {
      return NextResponse.json({ error: 'Parameter orderId, transactionId, invoiceUrl, dan uid diperlukan' }, { status: 400 });
    }

    logger.info('Menerima permintaan konfirmasi pesanan', { orderId, transactionId, uid });

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists || orderDoc.data().uid !== uid) {
      return NextResponse.json({ error: 'Pesanan tidak valid atau tidak ditemukan' }, { status: 401 });
    }

    await orderRef.update({
      paymentStatus: 'success',
      transactionId,
      invoiceUrl,
      updatedAt: new Date().toISOString()
    });

    const cartItems = orderDoc.data().cartItems || [];
    for (const item of cartItems) {
      const lockerRef = db.collection('lockers').doc(item.lockerId);
      await lockerRef.update({
        bookingStatus: 'booked',
        lockStatus: item.lockStatus || 'booked',
        lastUpdated: new Date().toISOString()
      });
    }

    logger.info('Berhasil mengkonfirmasi pesanan', { orderId });

    return NextResponse.json({ message: 'Pesanan berhasil dikonfirmasi' }, { status: 200 });
  } catch (error) {
    logger.error('Gagal mengkonfirmasi pesanan', {
      status: error.status || 500,
      message: error.message,
      orderId: 'unknown'
    });
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}