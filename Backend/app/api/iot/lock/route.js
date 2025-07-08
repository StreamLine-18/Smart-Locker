import { NextResponse } from 'next/server';
import { getDatabase } from 'firebase-admin/database';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    console.log('Menginisialisasi Firebase Admin SDK...');
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT tidak dikonfigurasi');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK berhasil diinisialisasi');
  } catch (error) {
    console.error('Gagal menginisialisasi Firebase Admin SDK:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    console.log('Memproses permintaan POST ke /api/iot/lock');
    const startTime = Date.now();
    const { lockerId, action, uid } = await request.json();
    console.log(`Mengontrol loker ${lockerId}, action: ${action}, UID: ${uid}`);

    if (!lockerId || !action || !uid) {
      return NextResponse.json(
        { error: 'lockerId, action, dan uid diperlukan' },
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
        }
      );
    }

    const db = getDatabase();
    const lockerRef = db.ref(`lockers/${lockerId}`);
    console.log(`Mengakses Realtime Database untuk loker: ${lockerId}`);
    const snapshot = await lockerRef.once('value');
    if (!snapshot.exists()) {
      console.log(`Loker ${lockerId} tidak ditemukan di Realtime Database`);
      return NextResponse.json(
        { error: `Loker ${lockerId} tidak ditemukan` },
        {
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
        }
      );
    }

    await lockerRef.update({
      lockStatus: action === 'unlock' ? 'unlocked' : 'locked',
      doorStatus: action === 'unlock' ? 'open' : 'closed',
      lastUser: uid,
      lastUpdated: new Date().toISOString(),
    });
    const duration = Date.now() - startTime;
    console.log(`Loker ${lockerId} berhasil ${action === 'unlock' ? 'dibuka' : 'dikunci'} dalam ${duration}ms`);
    return NextResponse.json(
      { message: `Loker ${lockerId} berhasil ${action === 'unlock' ? 'dibuka' : 'dikunci'}` },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      }
    );
  } catch (error) {
    console.error('Gagal mengontrol loker:', error);
    return NextResponse.json(
      { error: 'Gagal mengontrol loker: ' + error.message },
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
}