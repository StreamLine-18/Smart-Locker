"use client";

import { useEffect, useState } from 'react';
import { Table } from '../ui/table';
import Badge from '../ui/badge/Badge';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { db as importedDb } from '@/lib/firebase';
import Avatar from '@/components/ui/avatar/Avatar';
import { initializeApp, getApps, getApp } from 'firebase/app';
import BookingsModal from './BookingsModal';
import EditUserModal from './EditUserModal';

// Ensure Firebase is initialized properly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase if it hasn't been initialized yet
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Use the imported db or create a new instance if it's undefined
const db = importedDb || getFirestore(app);

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
}

export function UserTable() {
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
            bookings: []
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
  
  // Profile avatar rendering with fallback
  const renderUserAvatar = (user: User) => {
    if (user.photoURL) {
      return (
        <div className="ring-2 ring-white dark:ring-gray-800 shadow-sm">
          <Avatar 
            src={user.photoURL} 
            size="small"
          />
        </div>
      );
    } else {
      // Attractive fallback icon when no photo is available
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-600 dark:text-blue-300 shadow-sm ring-2 ring-white dark:ring-gray-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    }
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
      {/* Filters */}
      <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Users Management
          </h3>
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
              <tr className="text-sm bg-gray-50 dark:bg-gray-750">
                <th className="w-1/6">
                  <button 
                    className="flex items-center font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    onClick={() => toggleSort('name')}
                  >
                    User
                    {sortBy === 'name' && (
                      <span className="ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full p-0.5">
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
                <th className="w-1/5">
                  <button 
                    className="flex items-center font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    onClick={() => toggleSort('email')}
                  >
                    Email
                    {sortBy === 'email' && (
                      <span className="ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full p-0.5">
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
                <th className="w-1/6 font-medium">Role</th>
                <th className="w-1/6 font-medium">Status</th>
                <th className="w-1/6">
                  <button 
                    className="flex items-center font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    onClick={() => toggleSort('created')}
                  >
                    Created
                    {sortBy === 'created' && (
                      <span className="ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full p-0.5">
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
                <th className="w-1/6 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No users found matching your criteria</p>
                      <button 
                        onClick={() => {
                          setRoleFilter('all');
                          setBookingFilter('all');
                          setSearchQuery('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="transition-transform group-hover:scale-110 duration-200">
                          {renderUserAvatar(user)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {user.name || user.displayName || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {user.uid.slice(0, 6)}...
                          </div>
                        </div>
                        {user.hasActiveBooking && (
                          <Badge variant="light" color="success" size="sm" className="ml-auto">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Active
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="group-hover:underline">{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant="light"
                        color={user.role === 'admin' ? 'primary' : user.role === 'merchant' ? 'info' : 'light'}
                        className="w-fit"
                      >
                        <div className="flex items-center gap-1.5">
                          {user.role === 'admin' && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          )}
                          {user.role === 'merchant' && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          )}
                          {(!user.role || user.role === 'user') && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          {user.role || 'user'}
                        </div>
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        variant="light"
                        color={user.emailVerified ? 'success' : 'warning'}
                        className="w-fit"
                      >
                        <div className="flex items-center gap-1.5">
                          {user.emailVerified ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Verified
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Unverified
                            </>
                          )}
                        </div>
                      </Badge>
                    </td>
                    <td className="text-gray-600 dark:text-gray-300">
                      {user.createdAt && typeof user.createdAt.toDate === 'function' 
                        ? (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(user.createdAt.toDate()).toLocaleDateString()}
                          </div>
                        )
                        : 'N/A'}
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => editUser(user)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 transition-colors duration-150 transform hover:scale-110"
                          title="Edit User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => viewUserBookings(user)}
                          disabled={!user.hasActiveBooking}
                          className={`p-2 rounded-lg transition-all duration-150 transform hover:scale-110 ${
                            user.hasActiveBooking 
                              ? 'bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 cursor-pointer' 
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed opacity-70'
                          }`}
                          title={user.hasActiveBooking ? "View Bookings" : "No Active Bookings"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
      
      {/* BookingsModal - for viewing user bookings */}
      <BookingsModal 
        isOpen={isBookingsModalOpen}
        onClose={() => setIsBookingsModalOpen(false)}
        user={selectedUser}
      />
      
      {/* EditUserModal - for editing user details */}
      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}