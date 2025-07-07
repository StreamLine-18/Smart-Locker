"use client";

import { useEffect, useState } from 'react';
import { Table } from '../ui/table';
import Badge from '../ui/badge/Badge';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { db as importedDb } from '@/lib/firebase';
import { initializeApp, getApps, getApp } from 'firebase/app';
import BookingsModal from './BookingsModal';
import EditUserModal from './EditUserModal';
import Alert from '../ui/alert/Alert';

// Ensure Firebase is initialized
const firebaseConfig = {
  // Your Firebase config should be imported from environment variables or config file
  // This is a fallback in case the imported db is not working
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase if it hasn't been initialized yet
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = importedDb || getFirestore(app);

interface User {
  uid: string;
  name?: string;
  displayName?: string;
  email: string;
  role: string;
  emailVerified: boolean;
  photoURL?: string;
  createdAt?: any;
}

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

// Add this interface for user bookings
interface UserWithBookings extends User {
  bookings?: Order[];
}

export function UserTable() {
  const [users, setUsers] = useState<UserWithBookings[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [bookedLockers, setBookedLockers] = useState(0);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBookings | null>(null);
  
  // Add state for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithBookings | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'verified', 'unverified'
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all', 'withBookings', 'withoutBookings'
  
  // Add state for notifications
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    show: false,
    type: "info",
    title: "",
    message: ""
  });

  // Function to show a notification
  const showNotification = (type: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  
  // Function to reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setBookingFilter('all');
  };
  
  // Get paginated data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };
  
  // Filter and search users
  useEffect(() => {
    if (!users.length) return;
    
    let result = [...users];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.name || '').toLowerCase().includes(query) ||
        (user.displayName || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => 
        statusFilter === 'verified' ? user.emailVerified : !user.emailVerified
      );
    }
    
    // Apply booking filter
    if (bookingFilter !== 'all') {
      result = result.filter(user => {
        const hasBookings = user.bookings && user.bookings.length > 0;
        return bookingFilter === 'withBookings' ? hasBookings : !hasBookings;
      });
    }
    
    // Update filtered users and pagination info
    setFilteredUsers(result);
    setTotalPages(Math.max(1, Math.ceil(result.length / itemsPerPage)));
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [users, searchQuery, statusFilter, bookingFilter, itemsPerPage]);

  // Pagination handler functions
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Original data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if db is properly initialized
        if (!db) {
          throw new Error("Firestore database is not initialized");
        }
        
        // Fetch users with role "user" only
        try {
          const usersCollection = collection(db, 'users');
          const usersQuery = query(usersCollection, where("role", "==", "user"));
          const usersSnapshot = await getDocs(usersQuery);
          
          const userData = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              uid: doc.id,
              name: data.name || '',
              displayName: data.displayName || '',
              email: data.email || '',
              role: data.role || 'user',
              emailVerified: Boolean(data.emailVerified),
              photoURL: data.photoURL || '',
              createdAt: data.createdAt || null,
              bookings: [] // Initialize empty bookings array
            };
          }) as UserWithBookings[];
          
          setUsers(userData);
          setFilteredUsers(userData);
          setTotalUsers(userData.length);
          setTotalPages(Math.ceil(userData.length / itemsPerPage));

          // Fetch orders with error handling
          const ordersCollection = collection(db, 'orders');
          const ordersSnapshot = await getDocs(ordersCollection);
          
          let activeBookingsCount = 0;
          const updatedUsers = [...userData];
          
          // Process orders and associate them with users
          ordersSnapshot.docs.forEach(doc => {
            const orderData = doc.data();
            const order = {
              uid: orderData.uid || '',
              locationId: orderData.locationId || '',
              orderStatus: orderData.orderStatus || '',
              paymentStatus: orderData.paymentStatus || '',
              totalAmount: orderData.totalAmount || 0,
              transactionId: orderData.transactionId || '',
              createdAt: orderData.createdAt || null,
              updatedAt: orderData.updatedAt || null,
              lockerNumber: orderData.lockerNumber || '',
              locationName: orderData.locationName || orderData.locationId || ''
            };
            
            // Check if this is an active booking
            if (order.orderStatus === 'active' || order.orderStatus === 'pending' || order.orderStatus === 'booked') {
              activeBookingsCount++;
              
              // Find the user and add this booking to their bookings array
              const userIndex = updatedUsers.findIndex(user => user.uid === order.uid);
              if (userIndex >= 0) {
                if (!updatedUsers[userIndex].bookings) {
                  updatedUsers[userIndex].bookings = [];
                }
                updatedUsers[userIndex].bookings?.push(order);
              }
            }
          });
          
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers);
          setBookedLockers(activeBookingsCount);
        } catch (dataError) {
          console.error('Error fetching data:', dataError);
          setError('Failed to load data. Please check your connection and try again.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to initialize database or load data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle viewing user's bookings
  const handleViewBookings = (user: UserWithBookings) => {
    setSelectedUser(user);
    setShowBookingsModal(true);
  };

  // Function to handle editing user
  const handleEditUser = (user: UserWithBookings) => {
    setUserToEdit(user);
    setShowEditModal(true);
  };
  
  // Function to close the bookings modal
  const handleCloseModal = () => {
    setShowBookingsModal(false);
  };
  
  // Function to close the edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };
  
  // Function to handle user data refresh after editing
  const handleUserUpdated = async () => {
    // Reload users data after update
    try {
      setLoading(true);
      
      const usersCollection = collection(db, 'users');
      const usersQuery = query(usersCollection, where("role", "==", "user"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const userData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || '',
          displayName: data.displayName || '',
          email: data.email || '',
          role: data.role || 'user',
          emailVerified: Boolean(data.emailVerified),
          photoURL: data.photoURL || '',
          createdAt: data.createdAt || null,
          bookings: [] // Preserve bookings structure
        };
      }) as UserWithBookings[];
      
      // Update bookings info
      const updatedUsers = userData.map(newUser => {
        // Find the corresponding old user to get their bookings
        const oldUser = users.find(u => u.uid === newUser.uid);
        if (oldUser && oldUser.bookings) {
          return { ...newUser, bookings: oldUser.bookings };
        }
        return newUser;
      });
      
      setUsers(updatedUsers);
      // This will trigger the search/filter useEffect to update filteredUsers
      showNotification("success", "User Updated", "User information was successfully updated.");
      
    } catch (err) {
      console.error('Error refreshing user data:', err);
      showNotification("error", "Update Failed", "Failed to refresh user data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading regular users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Get current page data
  const currentUsers = getCurrentPageData();
  const totalFilteredUsers = filteredUsers.length;

  return (
    <div>
      {/* Notification Alert */}
      {notification.show && (
        <div className="mb-4 fixed top-20 right-4 z-50 w-80 shadow-lg animate-fade-in-right">
          <Alert
            variant={notification.type}
            title={notification.title}
            message={notification.message}
          />
        </div>
      )}
      
      {/* Summary Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Regular Users</p>
              <p className="text-2xl font-bold text-blue-900">{totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Booked Lockers</p>
              <p className="text-2xl font-bold text-green-900">{bookedLockers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Users
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full md:w-56">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Users</option>
              <option value="unverified">Unverified Users</option>
            </select>
          </div>
          
          <div className="w-full md:w-56">
            <label htmlFor="bookingFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Bookings
            </label>
            <select
              id="bookingFilter"
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="withBookings">With Active Bookings</option>
              <option value="withoutBookings">Without Bookings</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{totalFilteredUsers}</span> users
            {(searchQuery || statusFilter !== 'all' || bookingFilter !== 'all') && ' with current filters'}
          </p>
          
          {(searchQuery || statusFilter !== 'all' || bookingFilter !== 'all') && (
            <button 
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <Table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Active Bookings</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center">
                  <div className="text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg font-medium">
                      {totalUsers > 0 ? 'No users match the current filters' : 'No regular users found'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr 
                  key={user.uid} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-800">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.name || 'User'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-lg">
                            {(user.name?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || user.displayName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          User since {user.createdAt && user.createdAt.toDate ? 
                            new Date(user.createdAt.toDate()).toLocaleDateString() : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900 dark:text-white">{user.email || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="light"
                      color={user.emailVerified ? 'success' : 'warning'}
                      size="sm"
                    >
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.bookings && user.bookings.length > 0 ? (
                      <Badge
                        variant="light"
                        color="primary"
                        size="sm"
                      >
                        {user.bookings.length} active
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No bookings</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <button 
                        className={`rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          (!user.bookings || user.bookings.length === 0) 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        onClick={() => user.bookings?.length && handleViewBookings(user)}
                        disabled={!user.bookings || user.bookings.length === 0}
                        title={user.bookings && user.bookings.length > 0 ? "View bookings" : "No bookings to view"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </button>
                      <button 
                        className="rounded-full p-1.5 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        className="rounded-full p-1.5 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => window.alert(`View details for ${user.name || user.email}`)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        
        {/* Pagination Controls */}
        {totalFilteredUsers > 0 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                  currentPage === 1 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalFilteredUsers)}
                  </span>{' '}
                  of <span className="font-medium">{totalFilteredUsers}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  id="itemsPerPage"
                  className="block border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
                
                <nav className="relative inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === 1 
                        ? 'text-gray-300 dark:text-gray-600' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                    let pageNumber: number;
                    
                    // Show proper page numbers depending on current page and total pages
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                      if (index === 4) pageNumber = totalPages;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }
                    
                    // Add ellipsis
                    if ((totalPages > 5) && 
                        ((index === 3 && currentPage < totalPages - 2) || 
                         (index === 1 && currentPage > 3))) {
                      return (
                        <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } text-sm font-medium`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === totalPages 
                        ? 'text-gray-300 dark:text-gray-600' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentUsers.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-sm">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium">
              {totalUsers > 0 ? 'No users match the current filters' : 'No regular users found'}
            </p>
            
            {totalUsers > 0 && (searchQuery || statusFilter !== 'all' || bookingFilter !== 'all') && (
              <button 
                onClick={handleResetFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center mx-auto"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <>
            {currentUsers.map((user) => (
              <div key={user.uid} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-800">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.name || 'User'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-lg">
                        {(user.name?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name || user.displayName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Badge
                      variant="light"
                      color={user.emailVerified ? 'success' : 'warning'}
                      size="sm"
                    >
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 flex justify-between items-center">
                  <div>
                    {user.bookings && user.bookings.length > 0 ? (
                      <Badge
                        variant="light"
                        color="primary"
                        size="sm"
                      >
                        {user.bookings.length} active bookings
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">No bookings</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className={`rounded-full p-1.5 ${
                        (!user.bookings || user.bookings.length === 0) 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-blue-600 hover:bg-blue-100'
                      }`}
                      onClick={() => user.bookings?.length && handleViewBookings(user)}
                      disabled={!user.bookings || user.bookings.length === 0}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>
                    <button 
                      className="rounded-full p-1.5 text-blue-600 hover:bg-blue-100"
                      onClick={() => handleEditUser(user)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      className="rounded-full p-1.5 text-blue-600 hover:bg-blue-100"
                      onClick={() => window.alert(`View details for ${user.name || user.email}`)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mobile Pagination */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center p-2 text-sm font-medium rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`inline-flex items-center p-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bookings Modal - Enhanced */}
      <BookingsModal 
        isOpen={showBookingsModal} 
        onClose={handleCloseModal} 
        user={selectedUser} 
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        user={userToEdit}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
