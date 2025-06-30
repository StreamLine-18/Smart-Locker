import LockerManagementPage from "@/components/locker_management/LockerManagementPage";
import AllLockers from "@/components/locker_management/AllLockers";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Profile | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function Profile() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      
        <div className="space-y-6">
          {/* <AllLockers /> */}

    
          <AllLockers />

        
         
        </div>
      </div>
    </div>
  );
}
