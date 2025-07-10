import { getDatabase, ref, get } from "firebase/database";
import { initializeApp, getApps, getApp } from "firebase/app";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export async function fetchRealtimeData(path: string) {
  try {
    // Check if we're on the client side
    if (typeof window === "undefined") {
      console.warn("fetchRealtimeData: Cannot run on server side");
      return null;
    }

    // Ensure Firebase is initialized
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    // Get the database instance
    const realtimeDb = getDatabase(app);

    if (!realtimeDb) {
      console.error("Firebase Realtime Database not initialized");
      return null;
    }

    // Create the database reference
    const dbRef = ref(realtimeDb, path);

    // Get the data from the database
    const snapshot = await get(dbRef);

    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error fetching realtime data:", error);
    return null;
  }
}
