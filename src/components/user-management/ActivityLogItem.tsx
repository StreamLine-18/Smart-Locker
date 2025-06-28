import React from 'react';
import Badge from '../ui/badge/Badge';
import { PlusIcon } from '@/icons'; // Ganti jika kamu pakai icon lain

interface ActivityLogItemProps {
  user: string;
  action: string;
  status: 'Success' | 'Failed';
  timestamp: string; // format waktu, misalnya: "2025-06-28 14:30"
}

const ActivityLogItem: React.FC<ActivityLogItemProps> = ({
  user,
  action,
  status,
  timestamp,
}) => {
  return (
    <div className="flex items-start space-x-4 p-4 border-b">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-800 dark:text-white">
            {user} <span className="text-gray-500">melakukan</span> {action}
          </p>
          <Badge
            variant="light"
            color={status === 'Success' ? 'success' : 'error'}
            size="sm"
          >
            {status}
          </Badge>
        </div>
        <div className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <PlusIcon className="w-4 h-4" />
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogItem;
