// src/app/users/activity-logs/page.tsx

"use client";

import ActivityLogItem from "@/components/user-management/ActivityLogItem";

export default function ActivityLogsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Activity Logs</h1>
      <ActivityLogItem />
    </div>
  );
}
