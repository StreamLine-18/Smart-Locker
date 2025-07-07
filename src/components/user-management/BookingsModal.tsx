import React, { useState } from 'react';
import Badge from '../ui/badge/Badge';

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

interface BookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const BookingsModal: React.FC<BookingsModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('active');
  
  if (!isOpen || !user) return null;
  
  // Group bookings by status
  const activeBookings = user.bookings?.filter(b => b.orderStatus === 'active') || [];
  const completedBookings = user.bookings?.filter(b => b.orderStatus === 'completed') || [];
  const pendingBookings = user.bookings?.filter(b => ['pending', 'processing'].includes(b.orderStatus)) || [];
  
  // Format timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
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
  
  // Get payment status badge color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'info';
    }
  };
  
  // Display the appropriate booking list based on active tab
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
    
    if (bookingsToShow.length === 0) {
      return (
        <div className="py-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {bookingsToShow.map((booking) => (
          <div key={booking.transactionId} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium dark:text-white">Locker: {booking.lockerNumber || 'Unknown'}</p>
                  {booking.bookingCode && (
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-0.5 px-2 rounded text-gray-700 dark:text-gray-300">
                      {booking.bookingCode}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Location: {booking.locationName || booking.locationId || 'Unknown location'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={booking.orderStatus === 'active' ? 'solid' : 'light'}
                  color={
                    booking.orderStatus === 'active' ? 'success' : 
                    booking.orderStatus === 'pending' ? 'warning' : 
                    booking.orderStatus === 'completed' ? 'primary' : 'info'
                  }
                >
                  {booking.orderStatus}
                </Badge>
                <Badge
                  variant="light"
                  color={getPaymentStatusColor(booking.paymentStatus)}
                >
                  {booking.paymentStatus}
                </Badge>
              </div>
            </div>
            
            {/* Time information */}
            {booking.startTime && (
              <div className="mt-3 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">Start: {formatDate(booking.startTime)}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">
                    {booking.orderStatus === 'active' 
                      ? calculateTimeRemaining(booking) 
                      : `Duration: ${booking.duration || 'Unknown'} hours`}
                  </span>
                </div>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Transaction ID</p>
                <p className="font-mono dark:text-white">{booking.transactionId.substring(0, 8)}...</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-medium dark:text-white">Rp {booking.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Booked on</p>
                <p className="dark:text-white">{formatDate(booking.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="dark:text-white">{formatDate(booking.updatedAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-11/12 max-w-3xl max-h-[80vh] overflow-hidden flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling instanceof HTMLElement) {
                        e.currentTarget.nextSibling.style.display = 'flex';
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
                  {user.name || user.displayName || 'User'}'s Bookings
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
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active ({activeBookings.length})
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
          </div>
        </div>
        
        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-grow">
          {renderBookingsList()}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
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
