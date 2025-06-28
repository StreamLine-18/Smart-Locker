// app/users/page.tsx

"use client";

// Metadata halaman
export const metadata = {
  title: 'Users',
  description: 'Halaman pencarian pengguna',
};

// Props komponen input
interface SearchInputProps {
  placeholder: string;
  className?: string;
}

// Komponen utama halaman (harus export default!)
export default function UsersPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Cari Pengguna</h1>
      <SearchInput placeholder="Cari nama pengguna..." className="w-full" />
    </div>
  );
}

// Komponen input pencarian
function SearchInput({ placeholder, className }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <i className="bx bx-search text-gray-400 text-lg"></i>
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
