import React, { useState, useEffect } from 'react';
import { LockerFormData } from './AddLockerModal';
import Button from '../ui/button/Button';
import Badge from '../ui/badge/Badge';
import Alert from '../ui/alert/Alert';

interface EditLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, lockerData: LockerFormData) => Promise<void>;
  lockerId: string | null;
  lockerData?: {
    lockerId: string;
    lockerNumber: string;
    locationId: string;
    lockStatus: string;
    doorStatus: string;
    bookingStatus: string;
    contentStatus: string;
    pricePerHour: string | number;
    currentOrderId: null;
    lastUser: null;
  };
}

export default function EditLockerModal({ isOpen, onClose, onSubmit, lockerId, lockerData }: EditLockerModalProps) {
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
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update form when locker data changes
  useEffect(() => {
    if (lockerData) {
      setForm({
        lockerId: lockerData.lockerId || "",
        lockerNumber: lockerData.lockerNumber || "",
        locationId: lockerData.locationId || "",
        lockStatus: lockerData.lockStatus || "locked",
        doorStatus: lockerData.doorStatus || "closed",
        bookingStatus: lockerData.bookingStatus || "available",
        contentStatus: lockerData.contentStatus || "empty",
        pricePerHour: String(lockerData.pricePerHour) || "",
        currentOrderId: lockerData.currentOrderId,
        lastUser: lockerData.lastUser
      });
      setError(null);
      setSuccess(false);
    }
  }, [lockerData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockerId) return;
    
    setIsEditing(true);
    setError(null);
    
    try {
      await onSubmit(lockerId, form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update locker. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  if (!isOpen || !lockerId) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white bg-opacity-20 rounded-lg p-1.5">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Edit Locker</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-1.5 transition-all duration-200"
              disabled={isEditing}
            >
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            {error && (
              <div className="mb-3">
                <Alert variant="error" title="Error" message={error} />
              </div>
            )}
            
            {success && (
              <div className="mb-3">
                <Alert variant="success" title="Success" message="Locker has been successfully updated!" />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg mb-2">
                <h3 className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Informasi Locker
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                  Edit informasi locker dengan ID: <span className="font-mono font-medium">{form.lockerId}</span>
                </p>
              </div>

              {/* First Column */}
              <div className="space-y-3">
                {/* Locker ID - Read Only */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    ID Locker <span className="text-gray-500">(tidak dapat diubah)</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed text-gray-700 text-sm"
                    value={form.lockerId}
                    disabled
                  />
                </div>
                
                {/* Location */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Lokasi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" 
                      placeholder="Contoh: loc1, loc2"
                      required 
                      value={form.locationId} 
                      onChange={e => setForm(f => ({...f, locationId: e.target.value}))} 
                    />
                  </div>
                </div>
                
                {/* Lock Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Status Kunci <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-1-1.732l-5-3a2 2 0 00-2 0l-5 3A2 2 0 004 13v6a2 2 0 002 2z" />
                    </svg>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                      required 
                      value={form.lockStatus} 
                      onChange={e => setForm(f => ({...f, lockStatus: e.target.value}))}
                    >
                      <option value="locked">🔒 Terkunci</option>
                      <option value="unlocked">🔓 Tidak Terkunci</option>
                      <option value="maintenance">🔧 Maintenance</option>
                      <option value="error">⚠️ Error</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Content Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Status Konten <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                      required 
                      value={form.contentStatus} 
                      onChange={e => setForm(f => ({...f, contentStatus: e.target.value}))}
                    >
                      <option value="empty">📭 Kosong</option>
                      <option value="filled">📦 Terisi</option>
                      <option value="unknown">❓ Tidak Diketahui</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Second Column */}
              <div className="space-y-3">
                {/* Locker Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Nomor Locker <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" 
                      placeholder="Contoh: A1, B2"
                      required 
                      value={form.lockerNumber} 
                      onChange={e => setForm(f => ({...f, lockerNumber: e.target.value}))} 
                    />
                  </div>
                </div>
                
                {/* Door Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Status Pintu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                      required 
                      value={form.doorStatus} 
                      onChange={e => setForm(f => ({...f, doorStatus: e.target.value}))}
                    >
                      <option value="closed">🚪 Tertutup</option>
                      <option value="open">🔓 Terbuka</option>
                      <option value="jammed">🚫 Macet</option>
                      <option value="maintenance">🔧 Maintenance</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Booking Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Status Booking <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                      required 
                      value={form.bookingStatus} 
                      onChange={e => setForm(f => ({...f, bookingStatus: e.target.value}))}
                    >
                      <option value="available">✅ Tersedia</option>
                      <option value="booked">📋 Terpesan</option>
                      <option value="occupied">🔴 Terisi</option>
                      <option value="reserved">⏳ Direservasi</option>
                      <option value="maintenance">🔧 Maintenance</option>
                      <option value="out-of-service">❌ Tidak Beroperasi</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Price */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Harga Sewa Per Jam <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold text-xs">
                      Rp
                    </div>
                    <input 
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" 
                      placeholder="5000"
                      min="0"
                      step="1000"
                      required 
                      value={form.pricePerHour} 
                      onChange={e => setForm(f => ({...f, pricePerHour: e.target.value}))} 
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                      /jam
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {form.pricePerHour && !isNaN(Number(form.pricePerHour)) && Number(form.pricePerHour) > 0 
                        ? `Rp ${parseInt(form.pricePerHour).toLocaleString('id-ID')} per jam` 
                        : 'Masukkan harga dalam Rupiah'}
                    </p>
                    
                    {form.pricePerHour && !isNaN(Number(form.pricePerHour)) && Number(form.pricePerHour) > 0 && (
                      <div className="ml-2">
                        <Badge 
                          variant="light" 
                          color="success" 
                          size="sm"
                        >
                          Valid
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Section - Preview of changes */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="light" color="warning" size="sm">
                    Preview Perubahan
                  </Badge>
                  <span className="ml-2 text-xs text-gray-600">
                    Informasi locker setelah diperbarui
                  </span>
                </div>
              </div>
              
              <div className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">ID:</p>
                    <p className="text-xs font-medium">{form.lockerId || "Belum diisi"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nomor:</p>
                    <p className="text-xs font-medium">{form.lockerNumber || "Belum diisi"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lokasi:</p>
                    <p className="text-xs font-medium">{form.locationId || "Belum diisi"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status Kunci:</p>
                    <Badge 
                      variant="light" 
                      color={form.lockStatus === "locked" ? "success" : form.lockStatus === "unlocked" ? "warning" : "error"} 
                      size="sm"
                    >
                      {form.lockStatus === "locked" ? "Terkunci" : 
                       form.lockStatus === "unlocked" ? "Tidak Terkunci" : 
                       form.lockStatus === "maintenance" ? "Maintenance" : "Error"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status Pintu:</p>
                    <Badge 
                      variant="light" 
                      color={form.doorStatus === "closed" ? "success" : form.doorStatus === "open" ? "warning" : "error"} 
                      size="sm"
                    >
                      {form.doorStatus === "closed" ? "Tertutup" : 
                       form.doorStatus === "open" ? "Terbuka" : 
                       form.doorStatus === "jammed" ? "Macet" : "Maintenance"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Harga/Jam:</p>
                    <p className="text-xs font-medium">
                      {form.pricePerHour ? `Rp ${parseInt(form.pricePerHour).toLocaleString('id-ID')}` : "Belum diisi"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 rounded-b-2xl flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={onClose}
              disabled={isEditing}
              className="px-4 py-1.5 text-sm" 
            >
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal
            </Button>
            
            <Button 
              variant="primary"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isEditing) {
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              disabled={isEditing}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
            >
              {isEditing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Perbarui Locker
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
