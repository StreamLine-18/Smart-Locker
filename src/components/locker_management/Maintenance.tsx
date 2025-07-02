// src/app/(admin)/maintenance/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import  Button  from "@/components/ui/button/Button";

interface MaintenanceLog {
  id: string;
  lockerId: string;
  location: string;
  type: string;
  status: "in-progress" | "done";
  startDate: Timestamp;
  endDate?: Timestamp;
  notes?: string;
  updatedBy: string;
}

export default function Maintenance() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaintenanceLogs = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "maintenance_logs"));
    const data: MaintenanceLog[] = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as MaintenanceLog[];
    setLogs(data);
    setLoading(false);
  };

  const markAsDone = async (id: string) => {
    const ref = doc(db, "maintenance_logs", id);
    await updateDoc(ref, {
      status: "done",
      endDate: Timestamp.now(),
    });
    fetchMaintenanceLogs();
  };

  useEffect(() => {
    fetchMaintenanceLogs();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Maintenance
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Lockers under maintenance will be shown here.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">No lockers under maintenance.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-2 border text-left">Locker ID</th>
                <th className="p-2 border text-left">Location</th>
                <th className="p-2 border text-left">Type</th>
                <th className="p-2 border text-left">Status</th>
                <th className="p-2 border text-left">Start</th>
                <th className="p-2 border text-left">Notes</th>
                <th className="p-2 border text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-2 border">{log.lockerId}</td>
                  <td className="p-2 border">{log.location}</td>
                  <td className="p-2 border">{log.type}</td>
                  <td className="p-2 border text-yellow-600">{log.status}</td>
                  <td className="p-2 border">{log.startDate.toDate().toLocaleDateString()}</td>
                  <td className="p-2 border">{log.notes || "-"}</td>
                  <td className="p-2 border">
                    {log.status === "in-progress" ? (
                      <Button
                        onClick={() => markAsDone(log.id)}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white"
                      >
                        Mark as Done
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-400">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
