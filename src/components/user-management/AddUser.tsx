"use client";

import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, getFirestore, Firestore } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, fetchSignInMethodsForEmail, Auth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import Button from '../ui/button/Button';
import Alert from '../ui/alert/Alert';
import Badge from '../ui/badge/Badge';

// Ensure Firebase is initialized properly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase safely
let db: Firestore | undefined;
let auth: Auth | undefined;

// Only initialize on client side
if (typeof window !== 'undefined') {
  try {
    // Initialize Firebase if it hasn't been initialized yet
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export default function AddUser() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState(''); // New state for password confirmation
  const [emailVerified, setEmailVerified] = useState(false);
  const [role, setRole] = useState('user');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false); // New state for password confirmation visibility
  const [passwordsMatch, setPasswordsMatch] = useState(true); // New state to track if passwords match

  // Check if Firebase is properly initialized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (db && auth) {
        setFirebaseReady(true);
      } else {
        setError("Firebase initialization failed. Please refresh the page and try again.");
      }
    }
  }, []);

  // New effect to check if passwords match
  useEffect(() => {
    if (passwordConfirmation) {
      setPasswordsMatch(password === passwordConfirmation);
    } else {
      setPasswordsMatch(true); // Don't show error when confirmation field is empty
    }
  }, [password, passwordConfirmation]);

  // Check if email exists as user types
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@') || !auth) return;
    
    try {
      setCheckingEmail(true);
      setEmailExists(false);
      
      // Check for existing accounts with the email
      const methods = await fetchSignInMethodsForEmail(auth, email);
      setEmailExists(methods.length > 0);
      
      if (methods.length > 0) {
        // Email exists, set a warning but don't block submission
        console.log("Email already exists in authentication:", email);
      }
    } catch (err) {
      console.error("Error checking email:", err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!db || !auth) {
      setError("Firebase is not initialized. Please refresh the page.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Basic validation
      if (!name.trim() || !email.trim() || !emailConfirmation.trim() || !password.trim() || !passwordConfirmation.trim()) {
        throw new Error('All fields are required');
      }

      // Check if emails match
      if (email !== emailConfirmation) {
        throw new Error('Email addresses do not match');
      }

      // Check if passwords match
      if (password !== passwordConfirmation) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if user already exists in Firestore
      try {
        const userRef = doc(db, 'users', email.toLowerCase());
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          throw new Error(`User with email ${email} already exists`);
        }
      } catch (err: any) {
        // If error is not "document doesn't exist", rethrow
        if (err.message.includes('already exists')) {
          throw err;
        }
        // Otherwise continue - document doesn't exist which is what we want
      }

      // First create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User created successfully in Auth:", user.uid);

      // Then add user data to Firestore
      const userData = {
        uid: user.uid,
        name,
        displayName: name,
        email,
        role,
        emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to users collection with the auth UID as document ID
      await setDoc(doc(db, 'users', user.uid), userData);
      
      console.log("User data saved to Firestore:", user.uid);
      
      // Clear form and show success
      setSuccess(true);
      resetForm();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (err: any) {
      console.error("Error creating user:", err);
      let errorMessage = "Failed to create user. Please try again.";
      
      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered. Please use a different email or try to login.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid. Please enter a valid email.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setEmailConfirmation('');
    setPassword('');
    setPasswordConfirmation(''); // Also reset password confirmation
    setEmailVerified(false);
    setRole('user');
    setEmailExists(false);
  };

  // If Firebase initialization failed, show an error message
  if (!firebaseReady && typeof window !== 'undefined') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <Alert
            variant="error"
            title="Firebase Initialization Error"
            message="Failed to initialize Firebase. Please refresh the page and try again."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Header with improved gradient background and animation */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-8 px-6 dark:from-blue-800 dark:via-blue-700 dark:to-indigo-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-3 flex items-center">
              <span className="bg-white/20 p-2 rounded-lg mr-3 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
              Add New User
            </h1>
            <p className="text-blue-100 ml-14 opacity-90">Create a secure user account with customized access permissions.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 animate-fadeIn">
              <Alert
                variant="error"
                title="Error Creating User"
                message={error}
              />
            </div>
          )}

          {success && (
            <div className="mb-6 animate-fadeIn">
              <Alert
                variant="success"
                title="User Created Successfully"
                message="The user account has been created and can now log in."
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 mb-8">
              {/* User Information Section - Enhanced */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800/30 mb-2 shadow-sm transform transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4 flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-800/40 p-2 rounded-lg mr-3 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  User Information
                </h2>
                
                <div className="mt-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-3 pl-10 pr-3 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      placeholder="Enter user's full name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Account Information Section - Enhanced */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-sm transform transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4 flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-800/40 p-2 rounded-lg mr-3 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Account Information
                </h2>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (e.target.value.includes('@')) {
                            checkEmailExists && checkEmailExists(e.target.value);
                          }
                        }}
                        className={`block w-full border shadow-sm ${
                          emailExists
                            ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        } rounded-lg text-gray-900 dark:text-gray-100 py-3 pl-10 pr-3 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="user@example.com"
                        required
                      />
                      {checkingEmail ? (
                        <div className="absolute right-3 top-3">
                          <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : emailExists ? (
                        <div className="absolute right-3 top-3 text-orange-500">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      ) : email ? (
                        <div className="absolute right-3 top-3 text-gray-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                    {emailExists && (
                      <p className="mt-1 text-xs text-orange-500 flex items-center animate-pulse">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        This email is already registered
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="emailConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Email Address
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <input
                        id="emailConfirmation"
                        type="email"
                        value={emailConfirmation}
                        onChange={(e) => setEmailConfirmation(e.target.value)}
                        className={`block w-full border shadow-sm ${
                          emailConfirmation && email !== emailConfirmation
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                            : emailConfirmation && email === emailConfirmation
                            ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        } rounded-lg text-gray-900 dark:text-gray-100 py-3 pl-10 pr-3 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="Confirm email address"
                        required
                      />
                      {emailConfirmation && email !== emailConfirmation ? (
                        <div className="absolute right-3 top-3 text-red-500">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : emailConfirmation && email === emailConfirmation ? (
                        <div className="absolute right-3 top-3 text-green-500">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                    {emailConfirmation && email !== emailConfirmation && (
                      <p className="mt-1 text-xs text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Email addresses do not match
                      </p>
                    )}
                    {emailConfirmation && email === emailConfirmation && (
                      <p className="mt-1 text-xs text-green-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Email addresses match
                      </p>
                    )}
                  </div>
                </div>

                {/* Password fields with enhanced show/hide toggle */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`block w-full border shadow-sm ${
                          password && password.length < 6 
                            ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' 
                            : password && password.length >= 6
                            ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        } rounded-lg text-gray-900 dark:text-gray-100 py-3 pl-10 pr-10 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="Create a password (min. 6 characters)"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  {/* Password Confirmation Field - Enhanced */}
                  <div>
                    <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </span>
                      <input
                        id="passwordConfirmation"
                        type={showPasswordConfirmation ? "text" : "password"}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className={`block w-full border shadow-sm rounded-lg text-gray-900 dark:text-gray-100 py-3 pl-10 pr-10 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          passwordConfirmation && !passwordsMatch 
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                            : passwordConfirmation && passwordsMatch 
                              ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        }`}
                        placeholder="Confirm your password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                        tabIndex={-1}
                      >
                        {showPasswordConfirmation ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordConfirmation && !passwordsMatch && (
                      <p className="mt-1 text-xs text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Passwords do not match
                      </p>
                    )}
                    {passwordConfirmation && passwordsMatch && (
                      <p className="mt-1 text-xs text-green-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>

                {/* Enhanced Password strength indicator */}
                <div className="mt-5">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Password Strength</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {!password ? 'No password entered' : 
                       password.length < 6 ? 'Very weak' : 
                       password.length < 8 ? 'Weak' : 
                       password.length < 10 ? 'Medium' : 
                       'Strong'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-2 transition-all duration-500 ease-out ${
                        !password ? 'w-0' : 
                        password.length < 6 ? 'w-1/4 bg-red-500' : 
                        password.length < 8 ? 'w-2/4 bg-orange-500' : 
                        password.length < 10 ? 'w-3/4 bg-yellow-500' : 
                        'w-full bg-green-500'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Account Settings Section - Enhanced */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transform transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mr-3 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  Account Settings
                </h2>

                <div className="flex items-center mb-5 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex h-5 items-center">
                    <input
                      id="emailVerified"
                      type="checkbox"
                      checked={emailVerified}
                      onChange={(e) => setEmailVerified(e.target.checked)}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 transition-all duration-200"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="emailVerified" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mark email as verified
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      User won't need to verify their email if checked
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Role Assignment:
                  </p>
                  
                  <div className="space-y-3">
                    <div 
                      className={`bg-gray-50 dark:bg-gray-800 p-3 rounded-md border ${
                        role === 'user' ? 'border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20' : 'border-gray-100 dark:border-gray-600'
                      } flex items-center cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => setRole('user')}
                    >
                      <div className="mr-3">
                        <Badge variant={role === 'user' ? "solid" : "light"} color="primary" size="sm">user</Badge>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Standard User</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Basic access to the platform with limited permissions</p>
                      </div>
                      <div className="ml-2">
                        <div className={`w-5 h-5 rounded-full border-2 ${role === 'user' ? 'border-blue-500 bg-blue-500/20' : 'border-gray-300 dark:border-gray-500'} flex items-center justify-center`}>
                          {role === 'user' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`bg-gray-50 dark:bg-gray-800 p-3 rounded-md border ${
                        role === 'admin' ? 'border-purple-200 dark:border-purple-800 ring-2 ring-purple-500/20' : 'border-gray-100 dark:border-gray-600'
                      } flex items-center cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => setRole('admin')}
                    >
                      <div className="mr-3">
                        <Badge 
                          variant={role === 'admin' ? "solid" : "light"} 
                          color={role === 'admin' ? "primary" : "light"} 
                          size="sm"
                          startIcon={
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          }
                        >
                          admin
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Administrator</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Full access to manage users, content, and system settings</p>
                      </div>
                      <div className="ml-2">
                        <div className={`w-5 h-5 rounded-full border-2 ${role === 'admin' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-300 dark:border-gray-500'} flex items-center justify-center`}>
                          {role === 'admin' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-800/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Selected role: <span className="font-medium">{role}</span> — This will determine the user's access level within the system.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={loading}
                type="button"
                className="w-full sm:w-auto order-2 sm:order-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Form
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || (email !== emailConfirmation && emailConfirmation !== '') || (passwordConfirmation && !passwordsMatch) || !firebaseReady}
                className="w-full sm:w-auto order-1 sm:order-2 transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating User...
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
