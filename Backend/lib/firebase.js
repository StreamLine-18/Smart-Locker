const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    console.log('Menginisialisasi Firebase Admin SDK...');
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT tidak dikonfigurasi');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK berhasil diinisialisasi');
  } catch (error) {
    console.error('Gagal menginisialisasi Firebase Admin SDK:', error);
    throw error;
  }
}

const db = admin.firestore();
module.exports = { db, admin };