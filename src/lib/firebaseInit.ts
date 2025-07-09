import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase with retry logic
let app: ReturnType<typeof initializeApp> | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

export const initializeFirebase = async (): Promise<{ auth: Auth; db: Firestore }> => {
  // Return existing instances if already initialized
  if (auth && db) {
    return { auth, db };
  }

  try {
    // Check if Firebase is already initialized
    if (getApps().length) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);

    return { auth, db };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    initializationAttempts++;

    if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
      console.log(`Retrying Firebase initialization (${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS})...`);
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return initializeFirebase();
    }

    throw new Error(`Failed to initialize Firebase after ${MAX_INITIALIZATION_ATTEMPTS} attempts`);
  }
};

// Function to ensure auth is initialized with retries
export const ensureAuthInitialized = async (): Promise<Auth> => {
  if (auth) return auth;
  
  const { auth: initializedAuth } = await initializeFirebase();
  return initializedAuth;
};

// Function to ensure Firestore is initialized with retries
export const ensureDbInitialized = async (): Promise<Firestore> => {
  if (db) return db;
  
  const { db: initializedDb } = await initializeFirebase();
  return initializedDb;
};

// Get the current auth and db instances (may be null if not initialized)
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;

// Initialize Firebase on import in browser environments
if (typeof window !== 'undefined') {
  initializeFirebase().catch(error => {
    console.error('Failed to initialize Firebase on module import:', error);
  });
}
