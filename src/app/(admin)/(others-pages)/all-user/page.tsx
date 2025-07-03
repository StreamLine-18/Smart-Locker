'use client';

import React from 'react';
import {UserTable} from '@/components/user-management/UserTable';
import {Pagination} from '@/components/ui/pagination';
import SearchInput from '@/components/ui/search-input';
import Button from '@/components/ui/button/Button';
import { PlusIcon } from '@/icons';
 // pastikan file ini ada

export default function AllUsersPage() {
  // Dummy data - nanti bisa diganti dengan API
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    // Tambahkan data sesuai kebutuhan
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button variant="primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <SearchInput/>
          <div className="flex space-x-2">
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        <UserTable users={users} />

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing 1 to 10 of 50 entries
          </div>
          <Pagination
            currentPage={1}
            totalPages={5}
            onPageChange={(page) => console.log('Change page to:', page)}
          />
        </div>
      </div>
    </div>
  );
}


// 