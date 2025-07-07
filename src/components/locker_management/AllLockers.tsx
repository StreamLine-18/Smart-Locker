"use client";

import { useLockers } from "@/components/ecommerce/hooks/lockerCard.hooks";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function AllLockers() {
  const { lockers, loading, setLockers } = useLockers();
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const [editLocker, setEditLocker] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredLockers = lockers.filter((locker) =>
    selectedLocation ? locker.locationId === selectedLocation : true
  );

  const locations = Array.from(new Set(lockers.map((l) => l.locationId)));

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/lockers?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setLockers((prev: any[]) => prev.filter((l) => l.id !== id));
      setSuccessMsg("Loker berhasil dihapus!");
    }
    setDeleteId(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/lockers?id=${editLocker.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editLocker),
    });
    if (res.ok) {
      const updated = await res.json();
      setLockers((prev: any[]) =>
        prev.map((l) => (l.id === editLocker.id ? updated : l))
      );
      setEditLocker(null);
      setSuccessMsg("Loker berhasil diubah!");
    }
  };

  useEffect(() => {
    if (successMsg) {
      const timeout = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMsg]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Lockers</h2>
        <p className="text-gray-600 dark:text-gray-400">
        Daftar semua loker yang tersedia.
        </p>
      </div>
      <div className="mt-2 md:mt-0">
        <select
        className="border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
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
      </div>
      </div>

      {successMsg && (
      <div className="flex items-center gap-2 p-3 text-green-800 bg-green-100 border border-green-300 rounded-md animate-fade-in">
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-medium">{successMsg}</span>
      </div>
      )}

      {loading ? (
      <p className="text-center text-gray-500 dark:text-gray-400">Loading lockers...</p>
      ) : filteredLockers.length === 0 ? (
      <p className="text-center text-gray-500 dark:text-gray-400">Tidak ada loker ditemukan.</p>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLockers.map((locker) => (
        <div
          key={locker.id}
          className="border border-gray-200 rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700 shadow hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center gap-4 mb-4">
          <Image
            src={locker.image || "/images/icons/image.png"}
            alt="Locker"
            width={50}
            height={50}
            className="rounded w-[50px] h-[50px] object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
            {locker.lockerNumber}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
            Lokasi: {locker.locationId}
            </p>
          </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <p>Status Kunci: <strong>{locker.lockStatus}</strong></p>
          <p>Status Pintu: <strong>{locker.doorStatus}</strong></p>
          <p>Status Booking: <strong>{locker.bookingStatus}</strong></p>
          <p>Harga: Rp{locker.price}</p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
          <button
            className="text-sm bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded transition-transform active:scale-95"
            onClick={() => setEditLocker(locker)}
          >
            Edit
          </button>
          <button
            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-transform active:scale-95"
            onClick={() => setDeleteId(locker.id)}
          >
            Hapus
          </button>
          </div>
        </div>
        ))}
      </div>
      )}

      {/* Modal Edit */}
      {editLocker && (
      <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <form
        onSubmit={handleEdit}
        className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg w-[90%] max-w-md space-y-4 animate-fade-in"
        >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          Edit Locker
        </h3>
        {["lockerNumber", "locationId", "lockStatus", "doorStatus", "bookingStatus", "price"].map((field) => (
          <div key={field}>
          <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
          <input
            className="w-full border px-3 py-2 rounded-md text-sm"
            value={editLocker[field]}
            onChange={(e) =>
            setEditLocker({ ...editLocker, [field]: e.target.value })
            }
            required
          />
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-transform active:scale-95"
          onClick={() => setEditLocker(null)}
          >
          Batal
          </button>
          <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-transform active:scale-95"
          >
          Simpan
          </button>
        </div>
        </form>
      </div>
      )}

      {/* Modal Delete */}
      {deleteId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-sm transition-all duration-300">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg w-[90%] max-w-sm animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center mb-4">
          Hapus Locker Ini?
        </h3>
        <div className="flex justify-center gap-4">
          <button
          onClick={() => setDeleteId(null)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-transform active:scale-95"
          >
          Batal
          </button>
          <button
          onClick={() => handleDelete(deleteId)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-transform active:scale-95"
          >
          Hapus
          </button>
        </div>
        </div>
      </div>
      )}

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
