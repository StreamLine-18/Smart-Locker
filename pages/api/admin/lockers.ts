// pages/api/admin/lockers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { 
  collection, getDocs, query, doc, getDoc, 
  updateDoc, setDoc, deleteDoc, serverTimestamp, 
  getFirestore 
} from "firebase/firestore";
import { initializeApp, getApps, getApp } from 'firebase/app';

// Ensure Firebase is initialized properly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase if needed
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Create a direct Firestore instance to ensure it's properly initialized
const firestore = getFirestore(app);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the locker id from query params
  const { id } = req.query;
  
  try {
    switch (req.method) {
      case "GET": {
        // If ID is provided, get a specific locker
        if (id && typeof id === 'string') {
          const lockerRef = doc(firestore, "lockers", id);
          const lockerDoc = await getDoc(lockerRef);
          
          if (!lockerDoc.exists()) {
            return res.status(404).json({ error: `Locker with ID ${id} not found` });
          }
          
          return res.status(200).json({ id: lockerDoc.id, ...lockerDoc.data() });
        } 
        // Otherwise return all lockers
        else {
          // Use the Firestore instance directly
          const lockersCollection = collection(firestore, "lockers");
          const lockersSnapshot = await getDocs(lockersCollection);
          
          // Convert the snapshot to an array of locker objects
          const lockers = lockersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          return res.status(200).json(lockers);
        }
      }

      case "POST": {
        const data = req.body;
        
        // Validate required fields
        const requiredFields = ['lockerId', 'lockerNumber', 'locationId', 'lockStatus', 'doorStatus', 'bookingStatus', 'contentStatus', 'pricePerHour'];
        const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
        
        if (missingFields.length > 0) {
          return res.status(400).json({ 
            error: `Missing required fields: ${missingFields.join(', ')}`,
            receivedData: data
          });
        }
        
        // Ensure pricePerHour is a number
        if (typeof data.pricePerHour !== "number") {
          data.pricePerHour = Number(data.pricePerHour);
        }
        
        // Add timestamps
        data.createdAt = serverTimestamp();
        data.lastUpdated = serverTimestamp();
        
        try {
          // Create document with custom ID
          const lockerRef = doc(firestore, "lockers", data.lockerId);
          await setDoc(lockerRef, data);
          return res.status(201).json({
            id: data.lockerId,
            ...data
          });
        } catch (err: any) {
          console.error("Error creating locker:", err);
          return res.status(400).json({ error: err.message || "Failed to create locker" });
        }
      }

      case "PUT": {
        // Check if ID exists
        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Locker ID is required and must be a string" });
        }
        
        // Validate request body
        const data = req.body;
        if (!data) {
          return res.status(400).json({ error: "Request body is required" });
        }
        
        // Required fields validation
        const requiredFields = ['lockerId', 'lockerNumber', 'locationId', 'lockStatus', 'doorStatus', 'bookingStatus', 'contentStatus', 'pricePerHour'];
        const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
        
        if (missingFields.length > 0) {
          return res.status(400).json({ 
            error: `Missing required fields: ${missingFields.join(', ')}`,
            receivedData: data
          });
        }
        
        // Get the locker reference
        const lockerRef = doc(firestore, "lockers", id);
        
        // Check if locker exists
        const lockerDoc = await getDoc(lockerRef);
        if (!lockerDoc.exists()) {
          return res.status(404).json({ error: `Locker with ID ${id} not found` });
        }
        
        // Ensure pricePerHour is a number
        if (typeof data.pricePerHour !== "number") {
          data.pricePerHour = Number(data.pricePerHour);
        }
        
        // Add lastUpdated timestamp
        data.lastUpdated = serverTimestamp();
        
        // Update the document
        await updateDoc(lockerRef, data);
        
        // Return the updated locker data
        return res.status(200).json({ id, ...data });
      }

      case "DELETE": {
        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Missing locker ID" });
        }

        const lockerRef = doc(firestore, "lockers", id);
        await deleteDoc(lockerRef);

        return res.status(200).json({ success: true, message: "Locker deleted successfully" });
      }

      default:
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    console.error("Error handling locker API request:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message 
    });
  }
}
