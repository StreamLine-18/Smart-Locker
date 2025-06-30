// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.NEXT_API_KEY,
//   authDomain: process.env.NEXT_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PROJECT_ID,
//   storageBucket: process.env.NEXT_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_APP_ID,
// };

// export const db = getFirestore();
// export const auth = getAuth();
// // Initialize Firebase
// const app = initializeApp(firebaseConfig);



// src/lib/firebase.tsx
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config pakai env yang benar (NEXT_PUBLIC_)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi app jika belum ada
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export instance
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
