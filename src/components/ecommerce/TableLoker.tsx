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
import React, { useState } from "react";

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
        body: JSON.stringify(form)
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
        body: JSON.stringify(editForm)
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handleAddLocker} className="bg-white rounded-lg p-6 shadow-lg w-96">
            <p className="mb-4 text-center text-lg font-semibold">Tambah Locker</p>
            <div className="mb-2">
              <label className="block mb-1">Locker Number</label>
              <input className="w-full border rounded px-2 py-1" required value={form.lockerNumber} onChange={e => setForm(f => ({...f, lockerNumber: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Location</label>
              <input className="w-full border rounded px-2 py-1" required value={form.locationId} onChange={e => setForm(f => ({...f, locationId: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Lock Status</label>
              <input className="w-full border rounded px-2 py-1" required value={form.lockStatus} onChange={e => setForm(f => ({...f, lockStatus: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Door Status</label>
              <input className="w-full border rounded px-2 py-1" required value={form.doorStatus} onChange={e => setForm(f => ({...f, doorStatus: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Booking Status</label>
              <input className="w-full border rounded px-2 py-1" required value={form.bookingStatus} onChange={e => setForm(f => ({...f, bookingStatus: e.target.value}))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Price</label>
              <input className="w-full border rounded px-2 py-1" required value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
            </div>
            <div className="flex justify-center gap-4">
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" disabled={isAdding}>
                Simpan
              </button>
              <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded" onClick={() => setShowAdd(false)} disabled={isAdding}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pop up edit locker */}
      {editId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
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