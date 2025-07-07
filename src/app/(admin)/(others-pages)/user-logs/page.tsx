// "use client";

// import React from 'react';
// import UserLogs from '@/components/user-management/UserLogs';

// export const metadata = {
//   title: 'User Activity Logs | Smart Locker Admin',
//   description: 'View and analyze user activity logs for the Smart Locker system',
// };

// export default function UserLogsPage() {
//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Activity Logs</h1>
//         <p className="text-gray-500 dark:text-gray-400">
//           View and monitor user activities and system events
//         </p>
//       </div>
      
//       <UserLogs />
//     </div>
//   );
// }
import React from 'react';
import UserLogs from '@/components/user-management/UserLogs';

export const metadata = {
  title: 'Add User | Smart Locker Admin',
  description: 'Create new user accounts for Smart Locker system',
};

export default function AddUserPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New User</h1>
        <p className="text-gray-500 dark:text-gray-400">Create and manage user accounts for the Smart Locker system</p>
      </div>
      
        <UserLogs />
    </div>
  );
}
