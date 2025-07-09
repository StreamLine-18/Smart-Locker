import { getDatabase, ref, set, update, get } from 'firebase/database';
import { serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

// Get the Firebase app instance
const getAppInstance = () => {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  };

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
};

// Get the Realtime Database instance
const getRealtimeDb = () => {
  const app = getAppInstance();
  return getDatabase(app);
};

// Function to add a locker to Realtime Database
export const addLockerToRealtimeDb = async (lockerData: any) => {
  const realtimeDb = getRealtimeDb();
  const lockerId = lockerData.lockerId || lockerData.id;
  
  if (!lockerId) {
    throw new Error('Locker ID is required');
  }
  
  const realtimeDbRef = ref(realtimeDb, `lockers/${lockerId}`);
  
  // Prepare data for Realtime Database
  const realtimeData = {
    ...lockerData,
    lastUpdated: Date.now(),
    status: {
      lock: lockerData.lockStatus,
      door: lockerData.doorStatus,
      booking: lockerData.bookingStatus,
      content: lockerData.contentStatus,
    }
  };
  
  // Convert price to number if it's a string
  if (typeof realtimeData.pricePerHour === 'string') {
    realtimeData.pricePerHour = Number(realtimeData.pricePerHour);
  }
  
  await set(realtimeDbRef, realtimeData);
  return realtimeData;
};

// Function to update a locker in Realtime Database
export const updateLockerInRealtimeDb = async (lockerId: string, lockerData: any) => {
  const realtimeDb = getRealtimeDb();
  const realtimeDbRef = ref(realtimeDb, `lockers/${lockerId}`);
  
  // Get the current data first
  const snapshot = await get(realtimeDbRef);
  const currentData = snapshot.exists() ? snapshot.val() : {};
  
  // Prepare update data
  const updateData = {
    ...currentData,
    ...lockerData,
    lastUpdated: Date.now(),
    status: {
      ...(currentData.status || {}),
      lock: lockerData.lockStatus || currentData.lockStatus,
      door: lockerData.doorStatus || currentData.doorStatus,
      booking: lockerData.bookingStatus || currentData.bookingStatus,
      content: lockerData.contentStatus || currentData.contentStatus,
    }
  };
  
  // Convert price to number if it's a string
  if (typeof updateData.pricePerHour === 'string') {
    updateData.pricePerHour = Number(updateData.pricePerHour);
  }
  
  await update(realtimeDbRef, updateData);
  return updateData;
};

// Function to delete a locker from Realtime Database
export const deleteLockerFromRealtimeDb = async (lockerId: string) => {
  const realtimeDb = getRealtimeDb();
  const realtimeDbRef = ref(realtimeDb, `lockers/${lockerId}`);
  
  // Set to null to remove the node
  await set(realtimeDbRef, null);
  return true;
};
