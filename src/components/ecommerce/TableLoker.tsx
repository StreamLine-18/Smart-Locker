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

export default function TableLoker() {
  const { lockers, loading, setLockers } = useLockers();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    lockerNumber: "",
    locationId: "",
    lockStatus: "",
    doorStatus: "",
    bookingStatus: "",
    price: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    lockerNumber: "",
    locationId: "",
    lockStatus: "",
    doorStatus: "",
    bookingStatus: "",
    price: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [lockerDurations, setLockerDurations] = useState<{ [lockerId: string]: string }>({});

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

  const handleAddLocker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/lockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) })

      });
      if (res.ok) {
        const newLocker = await res.json();
        setLockers((prev: any[]) => [...prev, newLocker]);
        setShowAdd(false);
        setForm({
          lockerNumber: "",
          locationId: "",
          lockStatus: "",
          doorStatus: "",
          bookingStatus: "",
          price: ""
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const openEdit = (locker: any) => {
    setEditId(locker.id);
    setEditForm({
      lockerNumber: locker.lockerNumber || "",
      locationId: locker.locationId || "",
      lockStatus: locker.lockStatus || "",
      doorStatus: locker.doorStatus || "",
      bookingStatus: locker.bookingStatus || "",
      price: locker.price || ""
    });
  };

  const handleEditLocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setIsEditing(true);
    try {
      const res = await fetch(`/api/admin/lockers?id=${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, price: Number(editForm.price) })

      });
      if (res.ok) {
        const updatedLocker = await res.json();
        setLockers((prev: any[]) => prev.map(l => l.id === editId ? updatedLocker : l));
        setEditId(null);
      }
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Locker List
        </h3>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded flex items-center"
              onClick={() => setFilterOpen((v) => !v)}
              title="Filter Locker"
            >
              <span className="mr-1">🔍</span> Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
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
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded"
            onClick={() => setShowAdd(true)}
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
                Price
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
                Durasi
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell>Loading...</TableCell>
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
                    {locker.price}
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
                    {/* Ambil durasi dari Realtime Database jika ada, fallback ke "-" */}
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
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded mr-4"
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

      {/* Pop up konfirmasi hapus */}
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
      )}

      {/* Pop up tambah locker */}
{showAdd && (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <form onSubmit={handleAddLocker} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-1-1.732l-5-3a2 2 0 00-2 0l-5 3A2 2 0 004 13v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Tambah Locker Baru</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-all duration-200"
            disabled={isAdding}
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-4">
        {/* Locker Number */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Nomor Locker <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              placeholder="Contoh: L001, L002"
              required 
              value={form.lockerNumber} 
              onChange={e => setForm(f => ({...f, lockerNumber: e.target.value}))} 
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Lokasi <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              placeholder="Contoh: Lobby Utama, Lt. 2 Area A"
              required 
              value={form.locationId} 
              onChange={e => setForm(f => ({...f, locationId: e.target.value}))} 
            />
          </div>
        </div>

        {/* Lock Status */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Status Kunci <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-1-1.732l-5-3a2 2 0 00-2 0l-5 3A2 2 0 004 13v6a2 2 0 002 2z" />
            </svg>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
              required 
              value={form.lockStatus} 
              onChange={e => setForm(f => ({...f, lockStatus: e.target.value}))}
            >
              <option value="">Pilih Status Kunci</option>
              <option value="locked">🔒 Terkunci</option>
              <option value="unlocked">🔓 Tidak Terkunci</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="error">⚠️ Error</option>
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Door Status */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Status Pintu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
              required 
              value={form.doorStatus} 
              onChange={e => setForm(f => ({...f, doorStatus: e.target.value}))}
            >
              <option value="">Pilih Status Pintu</option>
              <option value="closed">🚪 Tertutup</option>
              <option value="open">🔓 Terbuka</option>
              <option value="jammed">🚫 Macet</option>
              <option value="maintenance">🔧 Maintenance</option>
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Booking Status */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Status Booking <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
              required 
              value={form.bookingStatus} 
              onChange={e => setForm(f => ({...f, bookingStatus: e.target.value}))}
            >
              <option value="">Pilih Status Booking</option>
              <option value="available">✅ Tersedia</option>
              <option value="booked">📋 Terpesan</option>
              <option value="occupied">🔴 Terisi</option>
              <option value="reserved">⏳ Direservasi</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="out-of-service">❌ Tidak Beroperasi</option>
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Harga Sewa <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold text-sm">
              Rp
            </div>
            <input 
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              placeholder="5000"
              min="0"
              step="1000"
              required 
              value={form.price} 
              onChange={e => setForm(f => ({...f, price: e.target.value}))} 
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              /jam
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {form.price && !isNaN(Number(form.price)) && Number(form.price) > 0 
              ? `Rp ${parseInt(form.price).toLocaleString('id-ID')} per jam` 
              : 'Masukkan harga dalam Rupiah'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
        <button 
          type="button" 
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50" 
          onClick={() => setShowAdd(false)} 
          disabled={isAdding}
        >
          Batal
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Simpan Locker
            </>
          )}
        </button>
      </div>
    </form>
  </div>
)}

      {/* Pop up edit locker */}
      {editId && (
        <div className="fixed inset-0 flex items-center justify-center ">
          <form onSubmit={handleEditLocker} className="bg-white rounded-lg p-6 shadow-lg w-96">
            <p className="mb-4 text-center text-lg font-semibold">Edit Locker</p>
            <div className="mb-2">
              <label className="block mb-1">Locker Number</label>
              <input className="w-full border rounded px-2 py-1" required value={editForm.lockerNumber} onChange={e => setEditForm(f => ({...f, lockerNumber: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Location</label>
              <input className="w-full border rounded px-2 py-1" required value={editForm.locationId} onChange={e => setEditForm(f => ({...f, locationId: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Lock Status</label>
              <input className="w-full border rounded px-2 py-1" required value={editForm.lockStatus} onChange={e => setEditForm(f => ({...f, lockStatus: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Door Status</label>
              <input className="w-full border rounded px-2 py-1" required value={editForm.doorStatus} onChange={e => setEditForm(f => ({...f, doorStatus: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Booking Status</label>
              <input className="w-full border rounded px-2 py-1" required value={editForm.bookingStatus} onChange={e => setEditForm(f => ({...f, bookingStatus: e.target.value}))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Price</label>
              <input className="w-full border rounded px-2 py-1" required value={editForm.price} onChange={e => setEditForm(f => ({...f, price: e.target.value}))} />
            </div>
            <div className="flex justify-between gap-4">
              <button type="button" className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50" onClick={() => setEditId(null)} disabled={isEditing}>
                Batal
              </button>
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" disabled={isEditing}>
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}