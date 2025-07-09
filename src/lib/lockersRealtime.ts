import { getDatabase, ref, onValue, off } from 'firebase/database';
import { getApps, getApp } from 'firebase/app';

// Interface for active locker data
export interface ActiveLocker {
  lockerId: string;
  lockerNumber: string;
  locationId: string;
  bookingStatus: string;
  userId?: string;
  startTime?: number;
  endTime?: number;
  transactionId?: string;
}

// Hook to listen to active lockers in realtime
export function subscribeToActiveLockers(callback: (lockers: { [key: string]: ActiveLocker }) => void) {
  // Check if we're on the client side
  if (typeof window === 'undefined') return () => {};
  
  const app = getApps().length ? getApp() : null;
  if (!app) return () => {};
  
  const database = getDatabase(app);
  const lockersRef = ref(database, 'lockers');
  
  const unsubscribe = onValue(lockersRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const activeLockers: { [key: string]: ActiveLocker } = {};
      
      Object.entries(data).forEach(([lockerId, lockerData]: [string, any]) => {
        // Check if the locker is currently booked
        if (lockerData.bookingStatus === 'occupied' || 
            lockerData.bookingStatus === 'booked' || 
            lockerData.status?.booking === 'occupied' || 
            lockerData.status?.booking === 'booked') {
          
          const userId = lockerData.currentUserId || lockerData.lastUser;
          
          if (userId) {
            activeLockers[lockerId] = {
              lockerId,
              lockerNumber: lockerData.lockerNumber || 'Unknown',
              locationId: lockerData.locationId || 'Unknown location',
              bookingStatus: lockerData.bookingStatus || lockerData.status?.booking || 'occupied',
              userId,
              startTime: lockerData.startTime || Date.now(),
              endTime: lockerData.endTime || (Date.now() + 3600000), // Default 1 hour if not specified
              transactionId: lockerData.currentOrderId || lockerData.transactionId,
            };
          }
        }
      });
      
      callback(activeLockers);
    } else {
      callback({});
    }
  }, (error) => {
    console.error("Error getting realtime locker data:", error);
    callback({});
  });
  
  return () => {
    off(lockersRef);
  };
}

// Get remaining time in a booking
export function getRemainingTime(startTime: number, endTime: number): string {
  const now = Date.now();
  if (now > endTime) return 'Expired';
  
  const diffMs = endTime - now;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHrs}h ${diffMins}m remaining`;
}

// Format the date for display
export function formatBookingDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
