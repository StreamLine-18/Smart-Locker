const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedLocations = async () => {
  try {
    // Sample locations
    const locations = [
      { id: 'loc1', name: 'Building A - Main Entrance' },
      { id: 'loc2', name: 'Building B - Student Center' },
      { id: 'loc3', name: 'Building C - Library' },
      { id: 'loc4', name: 'Building D - Cafeteria' },
      { id: 'loc5', name: 'Sports Complex' }
    ];

    // Add each location to Firestore
    for (const location of locations) {
      const locationRef = doc(db, 'locations', location.id);
      await setDoc(locationRef, {
        name: location.name,
        createdAt: new Date()
      });
      console.log(`Location ${location.name} added with ID: ${location.id}`);
    }

    console.log('Locations seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding locations:', error);
  }
};

// Run the seed function
seedLocations();
