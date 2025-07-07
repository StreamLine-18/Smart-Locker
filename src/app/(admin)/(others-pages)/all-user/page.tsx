//todo: Add UserTable component import
import { UserTable } from "@/components/user-management/UserTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "All Users | Smart Locker Admin Dashboard",
  description: "View and manage all users in the Smart Locker system",
};

export default function AllUsers() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          All Users
        </h3>
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-white/70">
            This page displays all users registered in the Smart Locker system.
            You can view user details, roles, and other relevant information.
          </p>
          {/* UserTable component would be placed here */}
          <UserTable /> 
                     
        </div>
      </div>
    </div>
  );
}

