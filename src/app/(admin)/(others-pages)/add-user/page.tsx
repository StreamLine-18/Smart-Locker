
import AddUser from '@/components/user-management/AddUser';
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "All Users | Smart Locker Admin Dashboard",
  description: "View and manage all users in the Smart Locker system",
};

export default function AllUsers() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] lg:p-8">
        <div className="mb-6 flex items-center border-b border-gray-100 pb-5 dark:border-gray-800">
          <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-900/20">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-blue-600 dark:text-blue-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="ml-4 text-xl font-bold text-gray-800 dark:text-white/90">
            Add User
          </h3>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
            <p className="flex items-center text-gray-600 dark:text-white/70">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="mr-2 h-5 w-5 text-blue-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This page allows you to add new users to the Smart Locker system.
              Please fill in the details below to create a new user account.
            </p>
          </div>
          
          <div className="transform transition-all duration-200 ease-in-out hover:scale-[1.01]">
            <AddUser />
          </div>
        </div>
      </div>
    </div>
  );
}

