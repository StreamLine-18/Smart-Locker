"use client";

import React from 'react';
import LockerLogs from '@/components/locker_management/LockerLogs';
import type { Metadata } from 'next';

// Move metadata to a separate export that can be used by the parent layout
export const dynamic = 'force-dynamic';

export default function LockerLogsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Locker Activity Logs</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitor all locker activities in real-time including locks, unlocks, and access events
        </p>
      </div>
      
      <LockerLogs />
    </div>
  );
}

