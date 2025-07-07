import React from 'react';
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
}

interface BookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const BookingsModal: React.FC<BookingsModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium">
                  {(user.name?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold dark:text-white">
              {user.name || user.displayName || user.email}'s Bookings
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {user.bookings && user.bookings.length > 0 ? (
          <div className="space-y-4">
            {user.bookings.map((booking) => (
              <div key={booking.transactionId} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium dark:text-white">Locker: {booking.lockerNumber || booking.locationId}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location: {booking.locationName || 'Unknown location'}</p>
                  </div>
                  <Badge
                    variant={booking.orderStatus === 'active' ? 'solid' : 'light'}
                    color={
                      booking.orderStatus === 'active' ? 'success' : 
                      booking.orderStatus === 'pending' ? 'warning' : 'info'
                    }
                  >
                    {booking.orderStatus}
                  </Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Transaction ID</p>
                    <p className="font-mono dark:text-white">{booking.transactionId.substring(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Amount</p>
                    <p className="font-medium dark:text-white">Rp {booking.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Booked on</p>
                    <p className="dark:text-white">{booking.createdAt && booking.createdAt.toDate ? 
                      new Date(booking.createdAt.toDate()).toLocaleString() : 
                      'N/A'
                    }</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No active bookings found</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingsModal;
