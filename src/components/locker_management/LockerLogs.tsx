"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { getDatabase, ref, onValue, query, orderByChild, limitToLast, off } from "firebase/database";
import { collection, getDocs, query as firestoreQuery, where, getFirestore } from 'firebase/firestore';
import { db as firestoreDb } from "@/lib/firebase";
import { initializeApp, getApps, getApp } from 'firebase/app';

// Ensure Firebase is initialized properly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase if it hasn't been initialized yet
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Initialize Realtime Database
const realtimeDb = typeof window !== 'undefined' ? getDatabase(app) : null;
const db = firestoreDb || getFirestore(app);

// Interface for locker log data
interface LockerLog {
  logId: string;
  lockerId: string;
  action: string;
  timestamp: number;
  userId: string;
  userName?: string; // Added after fetching user data
  lockerNumber?: string; // Added after fetching locker data
}

// User data interface
interface UserData {
  [uid: string]: {
    name?: string;
    displayName?: string;
    email: string;
  };
}

// Locker data interface
interface LockerData {
  [lockerId: string]: {
    lockerNumber: string;
    locationId: string;
  };
}

export default function LockerLogs() {
  // State variables
  const [logs, setLogs] = useState<LockerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  const [lockerData, setLockerData] = useState<LockerData>({});
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [lockerFilter, setLockerFilter] = useState<string | null>(null);
  
  // Unique values for filters
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  const [uniqueLockers, setUniqueLockers] = useState<string[]>([]);
  
  // Initialize real-time listener for locker logs
  useEffect(() => {
    if (!realtimeDb) return;
    
    setLoading(true);
    const logsRef = ref(realtimeDb, 'Locker_logs');
    // Use query to order by timestamp and limit to last 500 logs
    const logsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(500));
    
    const unsubscribe = onValue(logsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const logsArray: LockerLog[] = [];
        
        // Convert object to array and sort by timestamp (newest first)
        Object.keys(data).forEach((key) => {
          const log = data[key];
          if (log.timestamp && log.action && log.lockerId) {
            logsArray.push({
              logId: log.logId || key,
              lockerId: log.lockerId,
              action: log.action,
              timestamp: log.timestamp,
              userId: log.userId || 'unknown'
            });
          }
        });
        
        // Sort logs by timestamp (newest first)
        logsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update logs
        setLogs(logsArray);
        
        // Extract unique values for filters
        const actions = Array.from(new Set(logsArray.map(log => log.action)));
        const lockers = Array.from(new Set(logsArray.map(log => log.lockerId)));
        setUniqueActions(actions);
        setUniqueLockers(lockers);
        
        // Fetch additional data
        fetchUsersData(logsArray);
        fetchLockersData(logsArray);
        
        setRealtimeActive(true);
      } else {
        setLogs([]);
        setUniqueActions([]);
        setUniqueLockers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching locker logs:", error);
      setError("Failed to load locker logs. " + error.message);
      setLoading(false);
    });
    
    // Cleanup function to remove listener
    return () => {
      off(logsRef);
    };
  }, [realtimeDb]);
  
  // Fetch user data for the logs
  const fetchUsersData = async (logsArray: LockerLog[]) => {
    try {
      if (!db) return;
      
      // Get unique user IDs from logs
      const userIds = Array.from(new Set(logsArray.filter(log => log.userId).map(log => log.userId)));
      if (!userIds.length) return;
      
      // Batch user data fetching - We need to handle users from Firestore
      const users: UserData = {};
      
      // Use multiple small batches to avoid query limitations
      for (let i = 0; i < userIds.length; i += 10) {
        const batch = userIds.slice(i, i + 10);
        const usersRef = collection(db, 'users');
        const q = firestoreQuery(usersRef, where('uid', 'in', batch));
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          const data = doc.data();
          users[data.uid] = {
            name: data.name || data.displayName,
            displayName: data.displayName,
            email: data.email
          };
        });
      }
      
      setUserData(users);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };
  
  // Fetch locker data for the logs
  const fetchLockersData = async (logsArray: LockerLog[]) => {
    try {
      if (!realtimeDb) return;
      
      // Get unique locker IDs from logs
      const lockerIds = Array.from(new Set(logsArray.map(log => log.lockerId)));
      
      // Fetch locker data from Realtime Database
      const lockersRef = ref(realtimeDb, 'lockers');
      const lockersSnapshot = await onValue(lockersRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const lockers: LockerData = {};
          
          Object.keys(data).forEach(key => {
            if (lockerIds.includes(key)) {
              lockers[key] = {
                lockerNumber: data[key].lockerNumber || 'Unknown',
                locationId: data[key].locationId || 'Unknown'
              };
            }
          });
          
          setLockerData(lockers);
        }
      }, { onlyOnce: true });
      
    } catch (err) {
      console.error("Error fetching locker data:", err);
    }
  };
  
  // Filter logs based on search query, action filter, date range, and locker filter
  const filteredLogs = logs.filter(log => {
    // Search filter (case-insensitive)
    const matchesSearch = !searchQuery || 
      log.lockerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.lockerNumber && log.lockerNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (userData[log.userId]?.name && userData[log.userId].name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (userData[log.userId]?.email && userData[log.userId].email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Action filter
    const matchesAction = !actionFilter || log.action === actionFilter;
    
    // Locker filter
    const matchesLocker = !lockerFilter || log.lockerId === lockerFilter;
    
    // Date range filter
    let matchesDateRange = true;
    const logDate = new Date(log.timestamp);
    
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      matchesDateRange = matchesDateRange && logDate >= startDate;
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      // Add one day to include the end date fully
      endDate.setDate(endDate.getDate() + 1);
      matchesDateRange = matchesDateRange && logDate <= endDate;
    }
    
    return matchesSearch && matchesAction && matchesLocker && matchesDateRange;
  });
  
  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Helper function to get color based on action
  const getActionColor = (action: string) => {
    switch (action) {
      case 'lock':
        return 'success';
      case 'unlock':
        return 'warning';
      case 'open':
        return 'info';
      case 'close':
        return 'primary';
      case 'error':
        return 'error';
      default:
        return 'light';
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setActionFilter(null);
    setDateRange({ start: "", end: "" });
    setLockerFilter(null);
  };

  return (
    <div className="space-y-6">
      {/* Title and real-time indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Locker Activity Logs
        </h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${realtimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {realtimeActive ? 'Real-time updates active' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Filters panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <svg className="w-5 h-5 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Logs
          </h3>
          
          <div className="w-full sm:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
            <select
              className="block w-full border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
              value={actionFilter || ""}
              onChange={(e) => setActionFilter(e.target.value || null)}
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Locker filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Locker</label>
            <select
              className="block w-full border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
              value={lockerFilter || ""}
              onChange={(e) => setLockerFilter(e.target.value || null)}
            >
              <option value="">All Lockers</option>
              {uniqueLockers.map(locker => (
                <option key={locker} value={locker}>
                  {lockerData[locker]?.lockerNumber || locker}
                </option>
              ))}
            </select>
          </div>
          
          {/* Start date filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              className="block w-full border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          
          {/* End date filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              className="block w-full border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
        
        {/* Filter summary and reset button */}
        <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredLogs.length}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{logs.length}</span> logs
          </div>
          
          <div className="flex mt-2 sm:mt-0">
            {(searchQuery || actionFilter || dateRange.start || dateRange.end || lockerFilter) && (
              <button
                onClick={resetFilters}
                className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading && !logs.length ? (
          <div className="p-12 text-center">
            <div className="inline-block p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading locker activity logs...</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Please wait while we retrieve the data</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30">
            <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Logs</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-750">
                  <TableCell isHeader className="px-4 py-3 font-medium">Timestamp</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Locker</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Action</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">User</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Log ID</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No logs found matching your criteria</p>
                        {(searchQuery || actionFilter || dateRange.start || dateRange.end || lockerFilter) && (
                          <button 
                            onClick={resetFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.logId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200 font-medium">
                          {formatTimestamp(log.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toISOString()}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-200">
                            {lockerData[log.lockerId]?.lockerNumber || log.lockerNumber || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {log.lockerId}
                          </span>
                          {lockerData[log.lockerId]?.locationId && (
                            <span className="text-xs text-gray-500">
                              Location: {lockerData[log.lockerId].locationId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="light"
                          color={getActionColor(log.action)}
                          size="sm"
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-200">
                            {userData[log.userId]?.name || userData[log.userId]?.displayName || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {userData[log.userId]?.email || log.userId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {log.logId}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      {/* Mobile info text */}
      <div className="md:hidden text-xs text-center text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
        Swipe horizontally to see all columns
      </div>
    </div>
  );
}
