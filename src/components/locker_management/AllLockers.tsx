"use client";

import { useLockers } from "@/components/ecommerce/hooks/lockerCard.hooks";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { CheckCircle2, Plus, Filter, Search } from "lucide-react";
import EditLockerModal from "@/components/ecommerce/EditLockerModal";
import AddLockerModal from "@/components/ecommerce/AddLockerModal";
import { LockerFormData } from "@/components/ecommerce/AddLockerModal";
import { serverTimestamp } from 'firebase/firestore';
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

export default function AllLockers() {
  const { lockers, loading, setLockers, refreshLockers } = useLockers();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // State for edit modal
  const [editId, setEditId] = useState<string | null>(null);
  const [editLockerData, setEditLockerData] = useState<LockerFormData | undefined>();
  
  // State for add modal
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter lockers based on location and search query
  const filteredLockers = lockers.filter((locker) => {
    const matchesLocation = selectedLocation ? locker.locationId === selectedLocation : true;
    const matchesSearch = searchQuery 
      ? locker.lockerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        locker.lockerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locker.locationId?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesLocation && matchesSearch;
  });

  const locations = Array.from(new Set(lockers.map((l) => l.locationId)));

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/lockers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLockers((prev: any[]) => prev.filter((l) => l.id !== id));
        setSuccessMsg("Loker berhasil dihapus!");
      }
    } catch (error) {
      console.error("Error deleting locker:", error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openEdit = (locker: any) => {
    setEditId(locker.id);
    setEditLockerData({
      lockerId: locker.lockerId || "",
      lockerNumber: locker.lockerNumber || "",
      locationId: locker.locationId || "",
      lockStatus: locker.lockStatus || "locked",
      doorStatus: locker.doorStatus || "closed",
      bookingStatus: locker.bookingStatus || "available",
      contentStatus: locker.contentStatus || "empty",
      pricePerHour: locker.pricePerHour?.toString() || "",
      currentOrderId: locker.currentOrderId || null,
      lastUser: locker.lastUser || null
    });
  };

  const handleEditLocker = async (id: string, formData: LockerFormData) => {
    try {
      // Convert price to number and add server timestamp
      const lockerData = {
        ...formData,
        pricePerHour: Number(formData.pricePerHour),
        lastUpdated: serverTimestamp()
      };
      
      const res = await fetch(`/api/admin/lockers?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lockerData)
      });
      
      if (res.ok) {
        const updatedLocker = await res.json();
        setLockers((prev: any[]) => prev.map(l => l.id === id ? updatedLocker : l));
        setEditId(null);
        setSuccessMsg("Loker berhasil diperbarui!");
      }
    } catch (error) {
      console.error("Error updating locker:", error);
    }
  };

  const handleAddLocker = async (formData: LockerFormData) => {
    try {
      // Convert price to number and add server timestamp
      const lockerData = {
        ...formData,
        pricePerHour: Number(formData.pricePerHour),
        lastUpdated: serverTimestamp()
      };
      
      const res = await fetch("/api/admin/lockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lockerData)
      });
      
      if (res.ok) {
        const newLocker = await res.json();
        setLockers((prev: any[]) => [...prev, newLocker]);
        setShowAddModal(false);
        setSuccessMsg("Loker baru berhasil ditambahkan!");
        return newLocker;
      }
      throw new Error("Failed to add locker via API");
    } catch (error) {
      console.error("Error adding locker:", error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'locked':
      case 'closed':
      case 'available':
      case 'empty':
        return 'success';
      case 'unlocked':
      case 'open':
      case 'booked':
      case 'reserved':
        return 'warning';
      case 'maintenance':
      case 'error':
      case 'jammed':
      case 'out-of-service':
      case 'filled':
        return 'error';
      default:
        return 'info';
    }
  };

  useEffect(() => {
    if (successMsg) {
      const timeout = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMsg]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Action Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 transition-all duration-300">
        <div className="flex flex-col gap-5">
          {/* Title and Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              All Lockers
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kelola semua loker yang tersedia dalam sistem Smart Locker
            </p>
          </div>
          
          {/* Search, Filter and Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari loker..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Location Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Semua Lokasi</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Add Locker Button */}
            <Button
              variant="primary"
              className="py-2.5 font-medium w-full justify-center"
              onClick={() => setShowAddModal(true)}
              startIcon={<Plus className="h-4 w-4" />}
            >
              Tambah Locker
            </Button>
            
            {/* View Toggle Buttons */}
            <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                className={`flex-1 flex justify-center items-center px-3 py-1.5 rounded-md text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-white' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="ml-1.5">Grid</span>
              </button>
              <button
                className={`flex-1 flex justify-center items-center px-3 py-1.5 rounded-md text-sm ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-white' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={() => setViewMode('table')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="ml-1.5">Table</span>
              </button>
            </div>
          </div>
          
          {/* Active Filters Display (shows only when filters are active) */}
          {(searchQuery || selectedLocation) && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Search: {searchQuery}
                  <button 
                    className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => setSearchQuery("")}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {selectedLocation && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Location: {selectedLocation}
                  <button 
                    className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => setSelectedLocation("")}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              <button 
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLocation("");
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Success Message Alert */}
      {successMsg && (
        <Alert
          variant="success"
          title="Berhasil"
          message={successMsg}
        />
      )}
      
      {/* Content - Showing Locker Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden transition-all duration-300">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading lockers...</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Please wait while we retrieve the data</p>
          </div>
        ) : filteredLockers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No lockers found</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              {searchQuery || selectedLocation ? 
                "Try adjusting your search or filter criteria" : 
                "Add your first locker to get started"}
            </p>
            {(searchQuery || selectedLocation) && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLocation("");
                }}
                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredLockers.map((locker) => (
              <div
                key={locker.id}
                className="border border-gray-200 rounded-xl p-5 bg-white dark:bg-gray-800/50 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <Image
                      src={locker.image || "/images/icons/image.png"}
                      alt="Locker"
                      width={40}
                      height={40}
                      className="w-[40px] h-[40px] object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {locker.lockerNumber}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {locker.lockerId}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status Kunci</p>
                    <Badge 
                      variant="light" 
                      color={getStatusColor(locker.lockStatus)}
                      size="sm"
                    >
                      {locker.lockStatus}
                    </Badge>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status Pintu</p>
                    <Badge 
                      variant="light" 
                      color={getStatusColor(locker.doorStatus)}
                      size="sm"
                    >
                      {locker.doorStatus}
                    </Badge>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status Booking</p>
                    <Badge 
                      variant="light" 
                      color={getStatusColor(locker.bookingStatus)}
                      size="sm"
                    >
                      {locker.bookingStatus}
                    </Badge>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status Konten</p>
                    <Badge 
                      variant="light" 
                      color={getStatusColor(locker.contentStatus)}
                      size="sm"
                    >
                      {locker.contentStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      Rp {Number(locker.pricePerHour).toLocaleString('id-ID')}/jam
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Lokasi: {locker.locationId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded-lg transition-all dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                      onClick={() => openEdit(locker)}
                      title="Edit Locker"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                      onClick={() => setDeleteId(locker.id)}
                      title="Delete Locker"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 font-medium">Locker</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Location</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Lock Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Door Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Booking Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Content Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Price/Hour</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLockers.map((locker) => (
                  <TableRow key={locker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Image
                            width={40}
                            height={40}
                            src={locker.image || "/images/icons/image.png"}
                            className="h-10 w-10 object-cover"
                            alt={locker.lockerNumber}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                            {locker.lockerNumber}
                          </p>
                          <span className="text-gray-500 text-xs dark:text-gray-400">
                            {locker.lockerId}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">
                      {locker.locationId}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={getStatusColor(locker.lockStatus)}
                        size="sm"
                      >
                        {locker.lockStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={getStatusColor(locker.doorStatus)}
                        size="sm"
                      >
                        {locker.doorStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={getStatusColor(locker.bookingStatus)}
                        size="sm"
                      >
                        {locker.bookingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="light"
                        color={getStatusColor(locker.contentStatus)}
                        size="sm"
                      >
                        {locker.contentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm font-medium">
                      Rp {Number(locker.pricePerHour).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="p-1.5 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded-md transition-all dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                          onClick={() => openEdit(locker)}
                          title="Edit Locker"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-md transition-all dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                          onClick={() => setDeleteId(locker.id)}
                          title="Delete Locker"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-0 shadow-2xl"
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Konfirmasi Hapus</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-medium text-gray-800 dark:text-white">Hapus Locker Ini?</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tindakan ini tidak dapat dibatalkan. Semua data terkait locker ini akan dihapus secara permanen.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={() => setDeleteId(null)}
            disabled={isDeleting}
            className="px-4 py-2 text-sm"
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={() => deleteId && handleDelete(deleteId)}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Menghapus...
              </>
            ) : (
              'Hapus'
            )}
          </Button>
        </div>
      </Modal>

      {/* Add Locker Modal */}
      <AddLockerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddLocker}
      />

      {/* Edit Locker Modal */}
      <EditLockerModal
        isOpen={!!editId}
        onClose={() => setEditId(null)}
        onSubmit={handleEditLocker}
        lockerId={editId}
        lockerData={editLockerData}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
