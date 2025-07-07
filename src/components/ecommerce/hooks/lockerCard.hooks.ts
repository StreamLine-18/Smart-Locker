'use client';

import { useEffect, useState } from "react";

// Define proper type for locker
interface Locker {
  id: string;
  lockerId: string;
  lockerNumber: string;
  locationId: string;
  lockStatus: string;
  doorStatus: string;
  bookingStatus: string;
  contentStatus: string;
  pricePerHour: number;
  [key: string]: any;
}

export function useLockers() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLockers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/lockers');
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status} - ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Ensure we're working with an array
      const lockersArray = Array.isArray(data) ? data : [];
      setLockers(lockersArray);
      
    } catch (err: any) {
      console.error('Error fetching lockers:', err);
      setError(err.message || 'Failed to fetch lockers');
      setLockers([]); // Set to empty array on error to avoid "not a function" errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLockers();
  }, []);

  return { 
    lockers, 
    setLockers, 
    loading, 
    error, 
    refreshLockers: fetchLockers 
  };
}