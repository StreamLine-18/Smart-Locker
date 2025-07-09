"use client";

import { useEffect, useState } from 'react';
import { Table } from '../ui/table';
import Badge from '../ui/badge/Badge';
import { collection, getDocs, getFirestore, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db as importedDb } from '@/lib/firebase';
import Avatar from '@/components/ui/avatar/Avatar';
import { initializeApp, getApps, getApp } from 'firebase/app';
import BookingsModal from './BookingsModal';
import EditUserModal from './EditUserModal';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
// Add imports for Realtime Database
import { getDatabase, ref, onValue, off } from 'firebase/database';

// Ensure Firebase is initialized properly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Make sure this is set
};

// Initialize Firebase if it hasn't been initialized yet
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Use the imported db or create a new instance if it's undefined
const db = importedDb || getFirestore(app);
// Initialize Realtime Database
const realtimeDb = typeof window !== 'undefined' ? getDatabase(app) : null;

interface Order {
  uid: string;
  locationId: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  transactionId: string;
  createdAt: any;
  updatedAt: any;
  lockerNumber?: string;
  locationName?: string;
  duration?: number;
  startTime?: any;
  endTime?: any;
}

interface ActiveLocker {
  lockerId: string;
  lockerNumber: string;
  locationId: string;
  bookingStatus: string;
  userId: string;
  startTime: number;
  endTime: number;
}

interface User {
  uid: string;
  name?: string;
  displayName?: string;
  email: string;
  role: string;
  emailVerified: boolean;
  photoURL?: string;
  createdAt?: any;
  bookings?: Order[];
  hasActiveBooking?: boolean;
  activeLockers?: ActiveLocker[]; // New field to track current active lockers
  lastActivity?: number; // Timestamp of last activity
}

export function UserTable() {
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [activeLockers, setActiveLockers] = useState<{[key: string]: ActiveLocker}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // New state for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe to realtime locker data
  useEffect(() => {
    if (!realtimeDb) return;

    const lockersRef = ref(realtimeDb, 'lockers');
    
    // Set up the listener for active lockers
    onValue(lockersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentActiveLockers: {[key: string]: ActiveLocker} = {};

        // Process each locker
        Object.entries(data).forEach(([lockerId, lockerData]: [string, any]) => {
          // Check if the locker is currently booked
          if (lockerData.bookingStatus === 'occupied' || 
              lockerData.bookingStatus === 'booked' || 
              lockerData.status?.booking === 'occupied' || 
              lockerData.status?.booking === 'booked') {
            
            const userId = lockerData.currentUserId || lockerData.lastUser;
            
            if (userId) {
              currentActiveLockers[lockerId] = {
                lockerId,
                lockerNumber: lockerData.lockerNumber || 'Unknown',
                locationId: lockerData.locationId || 'Unknown location',
                bookingStatus: lockerData.bookingStatus || lockerData.status?.booking || 'occupied',
                userId,
                startTime: lockerData.startTime || Date.now(),
                endTime: lockerData.endTime || (Date.now() + 3600000), // Default 1 hour if not specified
              };
            }
          }
        });

        setActiveLockers(currentActiveLockers);
        setRealtimeActive(true);
        
        // Update user data with active locker information
        updateUsersWithLockerData(currentActiveLockers);
      }
    }, (error) => {
      console.error("Error getting realtime locker data:", error);
    });

    // Clean up the listener when component unmounts
    return () => {
      off(lockersRef);
    };
  }, [realtimeDb]);

  // Update users with active locker data
  const updateUsersWithLockerData = (lockers: {[key: string]: ActiveLocker}) => {
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        // Find all lockers for this user
        const userLockers = Object.values(lockers).filter(locker => 
          locker.userId === user.uid
        );
        
        // Update user with locker information
        return {
          ...user,
          activeLockers: userLockers,
          hasActiveBooking: userLockers.length > 0,
          lastActivity: userLockers.length > 0 ? 
            Math.max(...userLockers.map(l => l.startTime)) : 
            user.lastActivity
        };
      });
    });
  };

  // Fetch users and their bookings
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        if (!db) {
          throw new Error("Firestore database is not initialized");
        }
        
        // Fetch users
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const userData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email || '',
            role: data.role || 'user',
            emailVerified: data.emailVerified ?? false,
            ...data,
            hasActiveBooking: false,
            bookings: [],
            activeLockers: []
          };
        }) as User[];
        
        // Fetch active bookings for all users
        const ordersCollection = collection(db, 'orders');
        const activeOrdersQuery = query(ordersCollection, where('orderStatus', '==', 'active'));
        const ordersSnapshot = await getDocs(activeOrdersQuery);
        
        const bookingsByUser = new Map<string, Order[]>();
        
        // Group bookings by user ID
        ordersSnapshot.docs.forEach(doc => {
          const order = { uid: doc.id, ...doc.data() } as Order;
          const userId = order.uid;
          
          if (userId) {
            if (!bookingsByUser.has(userId)) {
              bookingsByUser.set(userId, []);
            }
            bookingsByUser.get(userId)?.push(order);
          }
        });
        
        // Add bookings to user data
        const usersWithBookings = userData.map(user => {
          const userBookings = bookingsByUser.get(user.uid) || [];
          return {
            ...user,
            bookings: userBookings,
            hasActiveBooking: userBookings.length > 0
          };
        });
        
        setUsers(usersWithBookings);
        
        // If we already have realtime locker data, update users with it
        if (Object.keys(activeLockers).length > 0) {
          updateUsersWithLockerData(activeLockers);
        }
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  
  // Handle user refresh (e.g. after edit)
  const handleUserUpdated = () => {
    // Refresh the user list
    window.location.reload();
  };
  
  // Profile avatar rendering with fallback - simplified
  const renderUserAvatar = (user: User) => {
    if (user.photoURL) {
      return (
        <div className="ring-1 ring-white/70 dark:ring-gray-800/70 shadow-sm">
          <Avatar 
            src={user.photoURL} 
            size="small"
          />
        </div>
      );
    } else {
      // Simpler fallback icon
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-white/70 dark:ring-gray-800/70">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    }
  };
  
  // Format time remaining in booking
  const formatTimeRemaining = (startTime: number, endTime: number) => {
    const now = Date.now();
    if (now > endTime) return 'Expired';
    
    const diffMs = endTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };
  
  // Filter and sort users
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // Booking filter
    const matchesBooking = 
      bookingFilter === 'all' || 
      (bookingFilter === 'active' && user.hasActiveBooking) ||
      (bookingFilter === 'none' && !user.hasActiveBooking);
      
    return matchesSearch && matchesRole && matchesBooking;
  }).sort((a, b) => {
    // Sort users
    let compareResult = 0;
    
    if (sortBy === 'name') {
      const nameA = (a.name || a.displayName || a.email || '').toLowerCase();
      const nameB = (b.name || b.displayName || b.email || '').toLowerCase();
      compareResult = nameA.localeCompare(nameB);
    } else if (sortBy === 'email') {
      compareResult = a.email.localeCompare(b.email);
    } else if (sortBy === 'created') {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      compareResult = dateA.getTime() - dateB.getTime();
    }
    
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });
  
  // Toggle sort order
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Open bookings modal for a user
  const viewUserBookings = (user: User) => {
    setSelectedUser(user);
    setIsBookingsModalOpen(true);
  };
  
  // Open edit user modal
  const editUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Handle user deletion
  const deleteUser = async (userId: string) => {
    if (!db) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the user from Firestore
      await deleteDoc(doc(db, "users", userId));
      
      // Update the UI by removing the deleted user
      setUsers(prevUsers => prevUsers.filter(user => user.uid !== userId));
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      
    } catch (err) {
      console.error("Error deleting user:", err);
      // You could add error state handling here
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation modal
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-900/30">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error Loading Users</h3>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters - keeping existing code */}
      <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Users Management
          </h3>
          
          {/* Real-time status indicator */}
          <div className="flex items-center gap-2 mr-4">
            <span className={`w-2 h-2 rounded-full ${realtimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {realtimeActive ? 'Real-time monitoring active' : 'Loading real-time data...'}
            </span>
          </div>
          
          <div className="w-full sm:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              className="block w-full border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="merchant">Merchant</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Booking Status</label>
            <select
              className="block w-full border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="active">With Active Bookings</option>
              <option value="none">No Active Bookings</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                className="block w-full border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="created">Created Date</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600"
                aria-label={sortOrder === 'asc' ? "Sort descending" : "Sort ascending"}
              >
                {sortOrder === 'asc' ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{filteredUsers.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{users.length}</span> users
            {searchQuery && <span> matching "<span className="font-medium text-blue-600 dark:text-blue-400">{searchQuery}</span>"</span>}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            {roleFilter !== 'all' && (
              <Badge 
                variant="light" 
                color="primary" 
                size="sm"
                elevated
                className="pl-2 pr-1"
                endIcon={
                  <button onClick={() => setRoleFilter('all')} className="ml-1 hover:text-brand-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }
              >
                {roleFilter}
              </Badge>
            )}
            
            {bookingFilter !== 'all' && (
              <Badge 
                variant="light" 
                color="success" 
                size="sm"
                elevated
                className="pl-2 pr-1"
                endIcon={
                  <button onClick={() => setBookingFilter('all')} className="ml-1 hover:text-success-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }
              >
                {bookingFilter === 'active' ? 'Has Bookings' : 'No Bookings'}
              </Badge>
            )}
            
            {(roleFilter !== 'all' || bookingFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setRoleFilter('all');
                  setBookingFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* User Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <thead>
              <tr className="text-xs bg-gray-50 dark:bg-gray-750">
                <th className="w-[20%] px-4 py-3">
                  <button 
                    className="flex items-center font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    onClick={() => toggleSort('name')}
                  >
                    User
                    {sortBy === 'name' && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">
                        {sortOrder === 'asc' ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    )}
                  </button>
                </th>
                <th className="w-[20%] px-4 py-3">
                  <button 
                    className="flex items-center font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    onClick={() => toggleSort('email')}
                  >
                    Email
                    {sortBy === 'email' && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">
                        {sortOrder === 'asc' ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="w-[15%] px-4 py-3 font-medium">Status</th>
                
                {/* New column for active lockers */}
                <th className="w-[20%] px-4 py-3 font-medium">Active Lockers</th>
                
                <th className="w-[10%] px-4 py-3">
                  <button 
                    className="flex items-center font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    onClick={() => toggleSort('created')}
                  >
                    Created
                    {sortBy === 'created' && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">
                        {sortOrder === 'asc' ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    )}
                  </button>
                </th>
                <th className="w-[10%] px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria</p>
                      <button 
                        onClick={() => {
                          setRoleFilter('all');
                          setBookingFilter('all');
                          setSearchQuery('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {renderUserAvatar(user)}
                        <div className="truncate">
                          <div className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                            {user.name || user.displayName || 'Unnamed User'}
                          </div>
                          {user.hasActiveBooking && (
                            <Badge variant="light" color="success" size="sm">
                              Active Booking
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 012 2z" />
                        </svg>
                        <span className="truncate">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={user.role === 'admin' ? 'primary' : user.role === 'merchant' ? 'info' : 'light'}
                        className="whitespace-nowrap"
                      >
                        {user.role === 'admin' && (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={user.emailVerified ? 'success' : 'warning'}
                        className="whitespace-nowrap"
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </td>
                    
                    {/* New cell for active lockers */}
                    <td className="px-4 py-3">
                      {user.activeLockers && user.activeLockers.length > 0 ? (
                        <div className="space-y-1.5">
                          {user.activeLockers.map((locker, index) => (
                            <div key={locker.lockerId} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-xs font-medium">
                                  {locker.lockerNumber} 
                                  <span className="text-gray-500 ml-1">({locker.locationId})</span>
                                </span>
                              </div>
                              <div className="ml-2">
                                <Badge variant="light" color="info" size="sm">
                                  {formatTimeRemaining(locker.startTime, locker.endTime)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No active lockers</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {user.createdAt && typeof user.createdAt.toDate === 'function' 
                        ? new Date(user.createdAt.toDate()).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => editUser(user)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400"
                          title="Edit User"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => viewUserBookings(user)}
                          disabled={!user.hasActiveBooking}
                          className={`p-1.5 rounded-md ${
                            user.hasActiveBooking 
                              ? 'bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 cursor-pointer' 
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed opacity-70'
                          }`}
                          title={user.hasActiveBooking ? "View Bookings" : "No Active Bookings"}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => confirmDeleteUser(user)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400"
                          title="Delete User"
                          disabled={user.role === 'admin'} // Optional: prevent deleting admin users
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
      
      {/* Real-time status bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${realtimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {realtimeActive ? 'Real-time monitoring active' : 'Connecting to real-time data...'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Total active lockers: <span className="font-medium">{Object.keys(activeLockers).length}</span>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center"
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
      
      {/* Modals - keeping existing code */}
      <BookingsModal 
        isOpen={isBookingsModalOpen}
        onClose={() => setIsBookingsModalOpen(false)}
        user={selectedUser}
      />
      
      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
      
      {/* Delete User Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-0 shadow-2xl"
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Konfirmasi Hapus User</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-medium text-gray-800 dark:text-white">
                Hapus User: {userToDelete?.name || userToDelete?.displayName || userToDelete?.email}?
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tindakan ini tidak dapat dibatalkan. Semua data terkait user ini akan dihapus secara permanen dari sistem.
              </p>
            </div>
          </div>
          
          {userToDelete?.hasActiveBooking && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium">Peringatan: User memiliki booking aktif</span>
              </div>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                User ini masih memiliki booking aktif. Menghapus user akan mempengaruhi data booking.
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
            className="px-4 py-2 text-sm"
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={() => userToDelete && deleteUser(userToDelete.uid)}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Menghapus...
              </>
            ) : (
              'Hapus User'
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}