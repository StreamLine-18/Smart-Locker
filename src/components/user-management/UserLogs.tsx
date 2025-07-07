"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter, where, Timestamp, getFirestore, Firestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { Table, TableHeader, TableRow, TableCell, TableBody } from '../ui/table';
import Badge from '../ui/badge/Badge';
import Button from '../ui/button/Button';
import Alert from '../ui/alert/Alert';

// Ensure Firebase is initialized properly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase if it hasn't been initialized yet
let app;
let db: Firestore | undefined;

try {
  if (typeof window !== 'undefined') { // Only run on client side
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

interface UserLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: Timestamp;
  ipAddress?: string;
  device?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}

export default function UserLogs() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredLogs, setFilteredLogs] = useState<UserLog[]>([]);
  
  // Fetch initial logs
  useEffect(() => {
    fetchLogs();
  }, []);
  
  // Filter logs when search or filters change
  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, actionFilter, dateRange]);
  
  const fetchLogs = async (loadMore = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we're on client side and Firebase is initialized
      if (typeof window === 'undefined') {
        throw new Error('This component can only be used client-side');
      }

      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      // Create the query
      let logsQuery;
      const logsRef = collection(db, 'userLogs');
      
      if (loadMore && lastVisible) {
        logsQuery = query(
          logsRef,
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(20)
        );
      } else {
        logsQuery = query(
          logsRef,
          orderBy('timestamp', 'desc'),
          limit(20)
        );
      }
      
      const snapshot = await getDocs(logsQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
        if (!loadMore) {
          setLogs([]);
        }
        return;
      }
      
      // Get the last visible document
      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserLog[];
      
      if (loadMore) {
        setLogs(prevLogs => [...prevLogs, ...newLogs]);
      } else {
        setLogs(newLogs);
      }
      
    } catch (err: any) {
      console.error('Error fetching user logs:', err);
      setError(err.message || 'Failed to load user logs');
    } finally {
      setLoading(false);
    }
  };
  
  const loadMoreLogs = () => {
    fetchLogs(true);
  };
  
  const filterLogs = () => {
    let result = [...logs];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        (log.userName || '').toLowerCase().includes(query) ||
        (log.userEmail || '').toLowerCase().includes(query) ||
        (log.details || '').toLowerCase().includes(query)
      );
    }
    
    // Apply action filter
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }
    
    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter(log => new Date(log.timestamp.toDate()) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      // Add one day to include the end date fully
      endDate.setDate(endDate.getDate() + 1);
      result = result.filter(log => new Date(log.timestamp.toDate()) <= endDate);
    }
    
    setFilteredLogs(result);
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setDateRange({ start: '', end: '' });
  };
  
  // Get list of unique actions for the filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  
  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Get appropriate badge color for status
  const getStatusColor = (status?: string): "success" | "error" | "warning" | "info" => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };
  
  // Get a friendly action name
  const getActionName = (action: string) => {
    switch (action) {
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      case 'createAccount': return 'Account Created';
      case 'updateProfile': return 'Profile Updated';
      case 'passwordChange': return 'Password Changed';
      case 'bookLocker': return 'Locker Booked';
      case 'releaseLocker': return 'Locker Released';
      case 'paymentSuccess': return 'Payment Success';
      case 'paymentFailed': return 'Payment Failed';
      default: return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };
  
  if (error && !logs.length) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 p-4 bg-red-50 dark:bg-red-900/20 rounded-full mb-6 animate-pulse">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading User Logs</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
        <Button 
          variant="primary"
          onClick={() => fetchLogs()} 
          className="shadow-sm mx-auto"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Loading
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Filters - Enhanced with better UI */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            Filter Activity Logs
          </h2>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center text-sm"
            size="sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </Button>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search users or details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="actionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity Type
            </label>
            <div className="relative">
              <select
                id="actionFilter"
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 pl-3 pr-10 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All Activities</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {getActionName(action)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
        
        {/* Summary display */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-2 sm:mb-0">
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Showing </span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{filteredLogs.length}</span>
              <span className="text-gray-600 dark:text-gray-400"> of </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{logs.length}</span>
              <span className="text-gray-600 dark:text-gray-400"> logs</span>
              {(searchQuery || actionFilter !== 'all' || dateRange.start || dateRange.end) && 
                <span className="text-gray-600 dark:text-gray-400"> with applied filters</span>
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(searchQuery || actionFilter !== 'all' || dateRange.start || dateRange.end) && (
              <div className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                Filters applied
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Logs Table - Enhanced with better UI */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        {loading && !logs.length ? (
          <div className="p-16 text-center">
            <div className="inline-block p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading activity logs...</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700/50">
                    <TableCell isHeader className="px-6 py-3 font-medium text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">Timestamp</TableCell>
                    <TableCell isHeader className="px-6 py-3 font-medium text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">User</TableCell>
                    <TableCell isHeader className="px-6 py-3 font-medium text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">Action</TableCell>
                    <TableCell isHeader className="px-6 py-3 font-medium text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">Details</TableCell>
                    <TableCell isHeader className="px-6 py-3 font-medium text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-12 text-center">
                        <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No logs match your current filters</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="mt-4 mx-auto"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset All Filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                        <TableCell className="whitespace-nowrap px-6 py-4 text-sm">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900 dark:text-white">{formatDate(log.timestamp).split(',')[0]}</div>
                            <div className="text-xs text-gray-500">{formatDate(log.timestamp).split(',')[1]}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.userName || 'Unknown User'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{log.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="light"
                            color={log.action.includes('error') || log.action.includes('fail') ? 'error' : 
                                  log.action.includes('login') || log.action.includes('create') ? 'success' : 'primary'}
                            size="sm"
                          >
                            {getActionName(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{log.details}</p>
                            {log.device && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center flex-wrap">
                                <div className="flex items-center mr-2 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {log.device}
                                </div>
                                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                  </svg>
                                  {log.ipAddress || 'Unknown'}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            variant={log.status === 'error' ? 'solid' : 'light'}
                            color={getStatusColor(log.status)}
                            size="sm"
                          >
                            {log.status || 'Info'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {hasMore && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <Button
                  variant="outline"
                  onClick={loadMoreLogs}
                  disabled={loading}
                  className="w-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading more logs...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Load More Logs
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Mobile Responsive Info */}
      <div className="md:hidden text-xs text-center text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
        Swipe right/left to see all columns in the table
      </div>
    </div>
  );
}