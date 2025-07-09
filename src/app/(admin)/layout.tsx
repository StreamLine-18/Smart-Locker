// src/app/(admin)/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { AuthProvider } from "@/context/AuthContext";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Ensure Firebase is initialized properly at the layout level
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if Firebase is already initialized
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
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        // Test auth by setting up a simple listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log("Auth state initialized and ready", user ? "User authenticated" : "No user");
          setIsInitialized(true);
        });
        
        // Clean up the listener when component unmounts
        return () => unsubscribe();
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setInitError("Failed to initialize authentication services");
      }
    };

    initializeFirebase();
  }, []);

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // Show loading state while Firebase initializes
  if (!isInitialized && !initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            Initializing admin services...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-red-600 dark:text-red-400">
            Authentication Error
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            {initError}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please try refreshing the page. If the problem persists, contact support.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-6 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen xl:flex">
        {/* Sidebar */}
        <AppSidebar />
        <Backdrop />

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <div className="p-4 mx-auto max-w-7xl md:p-6">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
