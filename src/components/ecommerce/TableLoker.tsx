"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";
import { useLockers } from "./hooks/lockerCard.hooks";
import React, { useState, useEffect } from "react";
import { fetchLockerDurations } from "@/lib/fetchLockerDurations";
import AddLockerModal, { LockerFormData } from "./AddLockerModal";
import EditLockerModal from "./EditLockerModal";
import { serverTimestamp } from 'firebase/firestore';


export default function TableLoker() {
  const { lockers, loading, setLockers } = useLockers();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // States for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLockerData, setEditLockerData] = useState<LockerFormData | undefined>();
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [lockerDurations, setLockerDurations] = useState<{ [lockerId: string]: string }>({});

  // Update the form state to match the collection schema
  const [form, setForm] = useState<LockerFormData>({
    lockerId: "",
    lockerNumber: "",
    locationId: "",
    lockStatus: "locked",
    doorStatus: "closed",
    bookingStatus: "available",
    contentStatus: "empty",
    pricePerHour: "",
    currentOrderId: null,
    lastUser: null
  });

  // Update the edit form state
  const [editForm, setEditForm] = useState<LockerFormData>({
    lockerId: "",
    lockerNumber: "",
    locationId: "",
    lockStatus: "locked",
    doorStatus: "closed",
    bookingStatus: "available",
    contentStatus: "empty",
    pricePerHour: "",
    currentOrderId: null,
    lastUser: null
  });

  useEffect(() => {
    fetchLockerDurations().then(setLockerDurations);
  }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/lockers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLockers((prev: any[]) => prev.filter((locker) => locker.id !== id));
      }
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleAddLocker = async (formData: LockerFormData) => {
    try {
      // Convert price to number and add server timestamp
      const lockerData = {
        ...formData,
        pricePerHour: Number(formData.pricePerHour),
        lastUpdated: serverTimestamp() // Add this import if not already imported
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
        return newLocker; // Return the new locker data
      }
      throw new Error("Failed to add locker via API");
    } catch (error) {
      console.error("Error adding locker:", error);
      throw error;
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
        lastUpdated: serverTimestamp() // Add this import if not already imported
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
      }
    } catch (error) {
      console.error("Error updating locker:", error);
      throw error;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Locker List
        </h3>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded flex items-center shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => setFilterOpen((v) => !v)}
              title="Filter Locker"
            >
              <span className="mr-1">🔍</span> Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${filter === "A" ? "bg-gray-100 font-bold" : ""}`}
                  onClick={() => { setFilter("A"); setFilterOpen(false); }}
                >
                  A
                </button>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${filter === "B" ? "bg-gray-100 font-bold" : ""}`}
                  onClick={() => { setFilter("B"); setFilterOpen(false); }}
                >
                  B
                </button>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${filter === null ? "bg-gray-100 font-bold" : ""}`}
                  onClick={() => { setFilter(null); setFilterOpen(false); }}
                >
                  Semua
                </button>
              </div>
            )}
          </div>
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => setShowAddModal(true)}
          >
            Tambah Locker
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-hidden">
        <div className="overflow-y-auto max-w-full max-h-[400px]">

        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Products
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Lock Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Price/Hour
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Door Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Booking Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Content Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Durasi
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                    <p>Memuat data locker...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : lockers.filter(locker => {
                if (!filter) return true;
                return (locker.lockerNumber || "").toUpperCase().startsWith(filter);
              }).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-gray-500">Tidak ada locker yang ditemukan</p>
                </TableCell>
              </TableRow>
            ) : (
              lockers
                .filter(locker => {
                  if (!filter) return true;
                  return (locker.lockerNumber || "").toUpperCase().startsWith(filter);
                })
                .map((locker) => (
                <TableRow key={locker.id} className="">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                        <Image
                          width={50}
                          height={50}
                          src={locker.image || "/images/icons/image.png"}
                          className="h-[50px] w-[50px]"
                          alt={locker.lockerNumber}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {locker.lockerNumber}
                        </p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                          {locker.locationId}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {locker.lockStatus}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {locker.pricePerHour}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={
                        locker.doorStatus === "booking"
                          ? "warning"
                          : "success"
                      }
                    >
                      {locker.doorStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {locker.bookingStatus}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {locker.contentStatus === 'empty' ? 'Kosong' : 'Terisi'}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {lockerDurations[locker.id] || "-"}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <button
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                      onClick={() => openEdit(locker)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => setDeleteId(locker.id)}
                    >
                      Hapus
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Confirmation delete dialog */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-80">
            <p className="mb-4 text-center text-lg font-semibold">Hapus Locker Ini</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
              >
                Iya
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )
      }

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
    </div>
  );
}