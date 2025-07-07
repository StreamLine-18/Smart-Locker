import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { db as importedDb } from '@/lib/firebase';
import { initializeApp, getApps, getApp } from 'firebase/app';
import Badge from '../ui/badge/Badge';
import Alert from '../ui/alert/Alert';

// Ensure Firebase is initialized for this component
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

// Create a fallback db if the imported one is undefined
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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || user.displayName || '');
      setEmail(user.email || '');
      setEmailVerified(user.emailVerified || false);
      setError(null);
      setSuccess(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user?.uid) {
        throw new Error("User ID is missing");
      }

      // Get a direct Firestore instance to ensure it's initialized
      const firestore = getFirestore(app);

      // Create a proper reference to the user document using the local firestore instance
      const userRef = doc(firestore, 'users', user.uid);
      
      // Create update data with serverTimestamp
      const updateData = {
        name,
        email,
        emailVerified,
        displayName: name, // Keep displayName and name in sync
        updatedAt: serverTimestamp()
      };

      // Debug log
      console.log("Updating user:", user.uid, "with data:", updateData);
      
      // Update the document
      await updateDoc(userRef, updateData);
      
      console.log("User updated successfully:", user.uid);
      setSuccess(true);
      onUserUpdated(); // Notify parent component to refresh data
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-300 animate-fadeIn">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-0 w-11/12 max-w-md overflow-hidden animate-scaleIn"
        style={{
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
        }}
      >
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 dark:from-blue-700 dark:to-blue-900">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover transition-transform hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling instanceof HTMLElement) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-xl">
                    {(user?.name?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Edit User
                </h3>
                <p className="text-sm text-blue-100">
                  Update user information
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
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 animate-slideInDown">
              <Alert
                variant="error"
                title="Update Failed"
                message={error}
              />
            </div>
          )}

          {success && (
            <div className="mb-6 animate-slideInDown">
              <Alert
                variant="success"
                title="Update Successful"
                message="User information has been updated successfully."
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="User's name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="flex items-center bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg">
                <input
                  id="emailVerified"
                  type="checkbox"
                  checked={emailVerified}
                  onChange={(e) => setEmailVerified(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailVerified" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Mark email as verified
                </label>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30 mt-2">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  User Information
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center mb-1">
                  <span className="font-semibold mr-1">ID:</span> 
                  <span className="font-mono bg-white/70 dark:bg-gray-700/70 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{user?.uid}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                  <span className="font-semibold mr-1">Role:</span>
                  <Badge variant="light" color="primary" size="sm">{user?.role}</Badge>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
