import React from 'react';
import AddUser from '@/components/user-management/AddUser';

export const metadata = {
  title: 'Add User | Smart Locker Admin',
  description: 'Create new user accounts for Smart Locker system',
};

export default function AddUserPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold"></h1>
        <p className="text-gray-500 dark:text-gray-400"></p>
      </div>     
      <AddUser />
    </div>
  );
}
