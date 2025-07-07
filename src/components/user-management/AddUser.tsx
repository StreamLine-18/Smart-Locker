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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 py-6 px-6 dark:from-blue-700 dark:to-blue-900">
          <h1 className="text-xl font-bold text-white mb-2 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New User
          </h1>
          <p className="text-blue-100">Create a new user account with user role.</p>
        </div>
        
        <div className="p-6">
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
              <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-800/30 mb-2">
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  User Information
                </h2>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter user's full name"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-800/30">
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Account Information
                </h2>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
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
                        className={`block w-full border ${
                          emailExists
                            ? 'border-orange-300 dark:border-orange-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="user@example.com"
                        required
                      />
                      {checkingEmail && (
                        <div className="absolute right-3 top-2">
                          <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {emailExists && (
                      <p className="mt-1 text-xs text-orange-500 flex items-center">
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
                    <input
                      id="emailConfirmation"
                      type="email"
                      value={emailConfirmation}
                      onChange={(e) => setEmailConfirmation(e.target.value)}
                      className={`block w-full border ${
                        emailConfirmation && email !== emailConfirmation
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-gray-300 dark:border-gray-600'
                      } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                      placeholder="Confirm email address"
                      required
                    />
                    {emailConfirmation && email !== emailConfirmation && (
                      <p className="mt-1 text-xs text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Email addresses do not match
                      </p>
                    )}
                  </div>
                </div>

                {/* Password fields with show/hide toggle */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 pr-10 focus:ring-blue-500 focus:border-blue-500 transition-all ${password && password.length < 6 ? 'border-amber-300' : ''}`}
                        placeholder="Create a password (min. 6 characters)"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1} // Skip in tab order
                      >
                        {showPassword ? (
                          // Eye slash icon (password visible)
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          // Eye icon (password hidden)
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

                  {/* New Password Confirmation Field */}
                  <div>
                    <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="passwordConfirmation"
                        type={showPasswordConfirmation ? "text" : "password"}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className={`block w-full border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 pr-10 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          passwordConfirmation && !passwordsMatch 
                            ? 'border-red-300 dark:border-red-600' 
                            : passwordConfirmation && passwordsMatch 
                              ? 'border-green-300 dark:border-green-600'
                              : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Confirm your password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                        tabIndex={-1} // Skip in tab order
                      >
                        {showPasswordConfirmation ? (
                          // Eye slash icon (password visible)
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          // Eye icon (password hidden)
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

                {/* Password strength indicator could go here */}
                <div className="mt-3">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-1 transition-all duration-300 ${
                        !password ? 'w-0' : 
                        password.length < 6 ? 'w-1/4 bg-red-500' : 
                        password.length < 8 ? 'w-2/4 bg-orange-500' : 
                        password.length < 10 ? 'w-3/4 bg-yellow-500' : 
                        'w-full bg-green-500'
                      }`}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {!password ? 'No password entered' : 
                     password.length < 6 ? 'Very weak' : 
                     password.length < 8 ? 'Weak' : 
                     password.length < 10 ? 'Medium' : 
                     'Strong'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Account Settings
                </h2>

                <div className="flex items-center mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                  <div className="flex h-5 items-center">
                    <input
                      id="emailVerified"
                      type="checkbox"
                      checked={emailVerified}
                      onChange={(e) => setEmailVerified(e.target.checked)}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
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
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Role Assignment:
                  </p>
                  <div className="flex items-center space-x-2 bg-white dark:bg-gray-700 p-2 rounded-md border border-gray-100 dark:border-gray-600">
                    <Badge variant="solid" color="primary" size="sm">user</Badge>
                    <span className="text-xs text-gray-500">Default role for all new accounts</span>
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
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Form
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading || (email !== emailConfirmation && emailConfirmation !== '') || (passwordConfirmation && !passwordsMatch) || !firebaseReady}
                className="w-full sm:w-auto order-1 sm:order-2"
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
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
