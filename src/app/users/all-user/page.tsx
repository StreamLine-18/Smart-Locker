// src/app/all-user/page.tsx

"use client";

import UserForm from "@/components/user-management/all-user/page";
import {UserTable} from "@/components/user-management/UserTable";

export default function AllUserPage() {
  return (
    <div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
              Profile
            </h3>
            <div className="space-y-6">
          <UserForm />          
            </div>
          </div>
        </div>
    // <div className="p-6">
    //   <h1 className="text-2xl font-bold mb-4">All Users</h1>
    // </div>
  );
}
