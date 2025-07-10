import React, { useState, useEffect } from 'react';
import Badge from '../ui/badge/Badge';
import Image from 'next/image';
// Add imports for Realtime Database
import { getDatabase, ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { fetchRealtimeData } from '@/utils/fetchRealtimeData';

// Ensure Firebase is initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase if it hasn't been initialized yet
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Initialize Realtime Database (only on client side)
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
  bookingCode?: string;
  lockerId?: string; // Added lockerId field
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
  activeLockers?: { lockerId: string; lockerNumber: string; locationId: string; bookingStatus: string; }[]; // Added activeLockers field
}

interface BookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface RealtimeLockerData {
  lockerId: string;
  lockerNumber: string;
  locationId: string;
  bookingStatus: string;
  currentUserId?: string;
  lastUser?: string;
  startTime?: number;
  endTime?: number;
  transactionId?: string;
  userDetails?: {
    name?: string;
    email?: string;
    photoURL?: string;
  };
}

const BookingsModal: React.FC<BookingsModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  // New state for realtime data
  const [realtimeLockers, setRealtimeLockers] = useState<RealtimeLockerData[]>([]);
  const [loadingRealtimeData, setLoadingRealtimeData] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  // State to track all active bookings across users (for admin view)
  const [allActiveBookings, setAllActiveBookings] = useState<RealtimeLockerData[]>([]);
  
  // Reset expanded booking when user changes and set the appropriate default tab
  useEffect(() => {
    setExpandedBooking(null);
    
    // If user has active bookings, show them first
    if (user?.bookings?.some(b => b.orderStatus === 'active') || 
        user?.activeLockers?.length) {
      setActiveTab('active');
    } 
    // Otherwise show completed bookings if available
    else if (user?.bookings?.some(b => b.orderStatus === 'completed')) {
      setActiveTab('completed');
    }
    // Or pending as last resort
    else if (user?.bookings?.some(b => ['pending', 'processing'].includes(b.orderStatus))) {
      setActiveTab('pending');
    }
  }, [user]);

  // Fetch locker data from Realtime Database when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchRealtimeLockers = async () => {
      setLoadingRealtimeData(true);
      setRealtimeError(null);
      
      try {
        // Fetch locker data
        const lockersData = await fetchRealtimeData('lockers');
        
        if (!lockersData) {
          console.log("No lockers data found or error accessing database");
          setRealtimeLockers([]);
          setAllActiveBookings([]);
          setLoadingRealtimeData(false);
          return;
        }
        
        // Process lockers data and filter by current user
        const activeLockers: RealtimeLockerData[] = [];
        const allActiveLockers: RealtimeLockerData[] = [];
        
        for (const lockerId in lockersData) {
          const lockerData = lockersData[lockerId];
          
          // Check if locker is currently booked
          if (lockerData.bookingStatus === 'occupied' || 
              lockerData.bookingStatus === 'booked' || 
              lockerData.status?.booking === 'occupied' || 
              lockerData.status?.booking === 'booked') {
            
            // Extract user ID from locker data
            const userId = lockerData.currentUserId || lockerData.lastUser;
            
            // If this locker belongs to the current user, add to their active lockers
            if (userId && user && userId === user.uid) {
              activeLockers.push({
                lockerId,
                lockerNumber: lockerData.lockerNumber || 'Unknown',
                locationId: lockerData.locationId || 'Unknown location',
                bookingStatus: lockerData.bookingStatus || lockerData.status?.booking || 'occupied',
                currentUserId: userId,
                startTime: lockerData.startTime || Date.now(),
                endTime: lockerData.endTime || (Date.now() + 3600000), // Default 1 hour if not specified
                transactionId: lockerData.currentOrderId || lockerData.transactionId,
              });
            }
            
            // Also add to the all active lockers list (for admin view)
            if (userId) {
              // Fetch user details if possible
              let userDetails = {};
              try {
                const userData = await fetchRealtimeData(`users/${userId}`);
                if (userData) {
                  userDetails = {
                    name: userData.name || userData.displayName,
                    email: userData.email,
                    photoURL: userData.photoURL,
                  };
                }
              } catch (err) {
                console.error("Error fetching user details:", err);
              }
              
              allActiveLockers.push({
                lockerId,
                lockerNumber: lockerData.lockerNumber || 'Unknown',
                locationId: lockerData.locationId || 'Unknown location',
                bookingStatus: lockerData.bookingStatus || lockerData.status?.booking || 'occupied',
                currentUserId: userId,
                lastUser: lockerData.lastUser,
                startTime: lockerData.startTime || Date.now(),
                endTime: lockerData.endTime || (Date.now() + 3600000),
                transactionId: lockerData.currentOrderId || lockerData.transactionId,
                userDetails,
              });
            }
          }
        }
        
        setRealtimeLockers(activeLockers);
        setAllActiveBookings(allActiveLockers);
      } catch (error: any) {
        console.error("Error fetching realtime locker data:", error);
        setRealtimeError(error.message || 'Failed to fetch active locker data');
      } finally {
        setLoadingRealtimeData(false);
      }
    };
    
    fetchRealtimeLockers();
  }, [isOpen, user]);
  
  // Format timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Helper function to calculate and format time remaining  
  // Calculate remaining time for active bookings
  const calculateTimeRemaining = (booking: Order) => {
    if (!booking.endTime) return 'Unknown';
    
    try {
      const endTime = booking.endTime.toDate ? booking.endTime.toDate() : new Date(booking.endTime);
      const now = new Date();
      
      if (now > endTime) return 'Expired';
      
      const diffMs = endTime.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs}h ${diffMins}m remaining`;
    } catch (err) {
      return 'Unknown';
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = (booking: Order) => {
    if (!booking.startTime || !booking.endTime) return 0;
    
    try {
      const startTime = booking.startTime.toDate ? booking.startTime.toDate() : new Date(booking.startTime);
      const endTime = booking.endTime.toDate ? booking.endTime.toDate() : new Date(booking.endTime);
      const now = new Date();
      
      if (now < startTime) return 0;
      if (now > endTime) return 100;
      
      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = now.getTime() - startTime.getTime();
      
      return Math.min(100, Math.floor((elapsed / totalDuration) * 100));
    } catch (err) {
      return 0;
    }
  };
  
  // Get payment status badge color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'info';
    }
  };

  // Get locker status icon
  const getLockerStatusIcon = (booking: Order) => {
    if (booking.orderStatus === 'active') {
      return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-1-1.732l-5-3a2 2 0 00-2 0l-5 3A2 2 0 004 13v6a2 2 0 002 2z" />
          </svg>
        </div>
      );
    } else if (booking.orderStatus === 'completed') {
      return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };
  
  // Toggle expanded booking detail
  const toggleExpandBooking = (bookingId: string) => {
    setExpandedBooking(prevId => prevId === bookingId ? null : bookingId);
  };
  
  if (!isOpen) return null;
  
  // Group bookings by status - Make sure user is not null before accessing properties
  const activeBookings = user?.bookings?.filter(b => b.orderStatus === 'active') || [];
  const completedBookings = user?.bookings?.filter(b => b.orderStatus === 'completed') || [];
  const pendingBookings = user?.bookings?.filter(b => ['pending', 'processing'].includes(b.orderStatus)) || [];
  
  // Add a better empty state when there are no bookings or user is null
  if (!user || (!user.bookings?.length && !user.activeLockers?.length && realtimeLockers.length === 0)) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-11/12 max-w-3xl max-h-[80vh] overflow-hidden flex flex-col animate-scaleIn">
          {/* Header with safer user access */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                  {user && user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user?.name || 'User'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentNode as HTMLElement;
                        if (parent) {
                          parent.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600', 'flex', 'items-center', 'justify-center');
                          const letter = document.createElement('span');
                          letter.className = 'text-white font-bold text-xl';
                          letter.textContent = (user?.name?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();
                          parent.appendChild(letter);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-xl">
                      {user ? (user.name?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {user ? (user.name || user.displayName || 'User') : 'User'}'s Locker Bookings
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {user?.email || 'No email available'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white rounded-full p-2 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Booking stats with null check */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-white font-bold text-lg">{activeBookings.length}</p>
                <p className="text-blue-100 text-xs">Active</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-white font-bold text-lg">{pendingBookings.length}</p>
                <p className="text-blue-100 text-xs">Pending</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-white font-bold text-lg">{completedBookings.length}</p>
                <p className="text-blue-100 text-xs">Completed</p>
              </div>
            </div>
          </div>
          
          {/* Empty state */}
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2m0 0v2m0 0H5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Bookings Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {user ? (user.name || user.displayName || 'This user') : 'This user'} hasn't made any locker bookings yet.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Enhance the booking list rendering to support active lockers from realtime DB
  const renderBookingsList = () => {
    let bookingsToShow: Order[] = [];
    let emptyMessage = '';
    
    switch (activeTab) {
      case 'active':
        bookingsToShow = activeBookings;
        emptyMessage = 'No active bookings found';
        break;
      case 'completed':
        bookingsToShow = completedBookings;
        emptyMessage = 'No completed bookings found';
        break;
      case 'pending':
        bookingsToShow = pendingBookings;
        emptyMessage = 'No pending bookings found';
        break;
      default:
        bookingsToShow = [...activeBookings, ...pendingBookings, ...completedBookings];
        emptyMessage = 'No bookings found';
    }
    
    // Show message for active lockers from realtime DB if we're on the active tab
    // and have active lockers but no active bookings from Firestore
    if (bookingsToShow.length === 0 && activeTab === 'active' && realtimeLockers.length > 0) {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 mb-4">
            <div className="flex items-center text-blue-600 dark:text-blue-400 mb-2">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Realtime Locker Data</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
              Found {realtimeLockers.length} active locker(s) for this user in the realtime database.
            </p>
          </div>
          
          {realtimeLockers.map((locker) => (
            <div 
              key={locker.lockerId} 
              className="border dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-1-1.732l-5-3a2 2 0 00-2 0l-5 3A2 2 0 004 13v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Locker {locker.lockerNumber || 'Unknown'}
                      </h4>
                      <Badge
                        variant="solid"
                        color="success"
                        size="sm"
                      >
                        {locker.bookingStatus.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {locker.locationId}
                    </p>
                    
                    {/* Time information */}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                      {locker.startTime && (
                        <span>Start: {new Date(locker.startTime).toLocaleString('id-ID')}</span>
                      )}
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatTimeRemaining(locker.startTime, locker.endTime)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar for active bookings */}
                {locker.startTime && locker.endTime && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(
                            100, 
                            Math.max(
                              0, 
                              ((Date.now() - locker.startTime) / (locker.endTime - locker.startTime)) * 100
                            )
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(locker.startTime).toLocaleTimeString()}</span>
                      <span>{new Date(locker.endTime).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (bookingsToShow.length === 0) {
      return (
        <div className="py-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {bookingsToShow.map((booking) => (
          <div 
            key={booking.transactionId} 
            className={`border dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
              expandedBooking === booking.transactionId ? 'shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {/* Booking Header - Always visible */}
            <div 
              className={`p-4 ${expandedBooking === booking.transactionId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => toggleExpandBooking(booking.transactionId)}
            >
              <div className="flex items-start gap-3">
                {getLockerStatusIcon(booking)}
                
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Locker {booking.lockerNumber || 'Unknown'}
                    </h4>
                    {booking.bookingCode && (
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-0.5 px-2 rounded text-gray-700 dark:text-gray-300">
                        {booking.bookingCode}
                      </span>
                    )}
                    <Badge
                      variant={booking.orderStatus === 'active' ? 'solid' : 'light'}
                      color={
                        booking.orderStatus === 'active' ? 'success' : 
                        booking.orderStatus === 'pending' ? 'warning' : 
                        booking.orderStatus === 'completed' ? 'primary' : 'info'
                      }
                      size="sm"
                    >
                      {booking.orderStatus}
                    </Badge>
                    <Badge
                      variant="light"
                      color={getPaymentStatusColor(booking.paymentStatus)}
                      size="sm"
                    >
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {booking.locationName || booking.locationId || 'Unknown location'}
                  </p>
                  
                  {/* Time information - condensed version */}
                  {booking.startTime && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Booked: {formatDate(booking.createdAt)}</span>
                      {booking.orderStatus === 'active' && (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {calculateTimeRemaining(booking)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Expand/collapse indicator */}
                <button 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={expandedBooking === booking.transactionId ? "Collapse details" : "Expand details"}
                >
                  <svg 
                    className={`w-5 h-5 transform transition-transform ${expandedBooking === booking.transactionId ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Progress bar for active bookings */}
              {booking.orderStatus === 'active' && booking.startTime && booking.endTime && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${calculateProgress(booking)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(booking.startTime)}</span>
                    <span>{formatDate(booking.endTime)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Expanded details */}
            {expandedBooking === booking.transactionId && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {/* Visual representation of locker */}
                <div className="mb-4 flex justify-center">
                  <div className="relative w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image 
                        src="/images/locker-placeholder.png" 
                        alt="Locker" 
                        width={120} 
                        height={120}
                        className="opacity-30"
                      />
                    </div>
                    <div className="relative z-10 text-center p-2">
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {booking.lockerNumber || '?'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {booking.lockerId || 'Unknown ID'}
                      </div>
                      <Badge
                        variant="solid"
                        color={booking.orderStatus === 'active' ? 'success' : 'primary'}
                        className="mt-2"
                      >
                        {booking.orderStatus === 'active' ? 'IN USE' : 'COMPLETED'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Detailed information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Transaction ID</p>
                      <p className="font-mono text-gray-800 dark:text-white">{booking.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Amount</p>
                      <p className="font-medium text-gray-800 dark:text-white">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Duration</p>
                      <p className="text-gray-800 dark:text-white">{booking.duration || '?'} jam</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Start Time</p>
                      <p className="text-gray-800 dark:text-white">{formatDate(booking.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">End Time</p>
                      <p className="text-gray-800 dark:text-white">{formatDate(booking.endTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Booking Created</p>
                      <p className="text-gray-800 dark:text-white">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                  {booking.orderStatus === 'active' && (
                    <button className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg">
                      Extend Time
                    </button>
                  )}
                  <button className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg">
                    View Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-11/12 max-w-3xl max-h-[80vh] overflow-hidden flex flex-col animate-scaleIn">
        {/* Header - fix the photoURL access issue */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentNode as HTMLElement;
                      if (parent) {
                        parent.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600', 'flex', 'items-center', 'justify-center');
                        const letter = document.createElement('span');
                        letter.className = 'text-white font-bold text-xl';
                        letter.textContent = (user.name?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase();
                        parent.appendChild(letter);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-xl">
                    {(user.name?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {user.name || user.displayName || 'User'}'s Locker Bookings
                </h3>
                <p className="text-blue-100 text-sm">
                  {user.email}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white rounded-full p-2 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Booking stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white font-bold text-lg">{activeBookings.length + realtimeLockers.length}</p>
              <p className="text-blue-100 text-xs">Active</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white font-bold text-lg">{pendingBookings.length}</p>
              <p className="text-blue-100 text-xs">Pending</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white font-bold text-lg">{completedBookings.length}</p>
              <p className="text-blue-100 text-xs">Completed</p>
            </div>
          </div>
        </div>
        
        {/* Tabs - Add "All Active" tab for admins */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active ({activeBookings.length + realtimeLockers.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'pending'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingBookings.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'completed'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({completedBookings.length})
            </button>
            
            {/* Only show this tab for admin users */}
            {user.role === 'admin' && (
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'all-active'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('all-active')}
              >
                All Active ({allActiveBookings.length})
              </button>
            )}
          </div>
        </div>
        
        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'all-active' ? renderAllActiveBookings() : renderBookingsList()}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {activeTab === 'all-active' 
              ? 'Showing all active locker bookings from realtime database' 
              : 'Click on a booking to see detailed information'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingsModal;

