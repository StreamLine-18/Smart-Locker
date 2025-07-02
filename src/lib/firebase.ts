// // src/lib/firebase.ts

// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';


// if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
//   console.error("❌ ENV belum terdeteksi! Pastikan .env.local sudah benar dan server di-restart.");
// }

// // Firebase Config
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };
// console.log('Firebase Config:', firebaseConfig);

// // ✅ Inisialisasi dulu sebelum dipakai!
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// // ✅ Pakai `app` yang udah ada
// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const storage = getStorage(app);

// // ✅ Google Auth Provider
// export const googleProvider = new GoogleAuthProvider();
// googleProvider.setCustomParameters({ prompt: 'select_account' });

// export default app;
// src/lib/firebase.ts




// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// const isClient = typeof window !== "undefined";
// // Pastikan konfigurasi Firebase hanya diakses di client-side
// if (isClient) {
//   console.log("Firebase Config:", firebaseConfig);
// }
// // Cek apakah konfigurasi Firebase sudah lengkap
// if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.storageBucket || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
//   console.error("❌ ENV belum terdeteksi! Pastikan .env.local sudah benar dan server di-restart.");
// }

// if (!firebaseConfig.apiKey) {
//   console.error("❌ ENV belum terdeteksi! Pastikan .env.local sudah benar dan server di-restart.");
// } 

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const storage = getStorage(app);
// export const googleProvider = new GoogleAuthProvider();
// export default app;


import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ⛔ Tambahkan pengecekan agar tidak jalan di SSR
const isClient = typeof window !== "undefined";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = isClient ? getAuth(app) : undefined; // 🔧
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export default app;