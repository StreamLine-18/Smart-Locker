"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireCompleteProfile?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireCompleteProfile = false,
  redirectTo
}: AuthGuardProps) {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // List rute publik (tanpa auth)
  const publicRoutes = ['/', '/signin', '/signup', '/forgot-password'];

  // Cek rute publik, pastikan pathname tidak undefined
  const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false;

  useEffect(() => {
    // Jangan lanjut kalau auth belum siap atau pathname belum ada
    if (isLoading || !pathname) return;

    const currentPath = pathname;

    // Simpan tujuan yang diminta user sebelum login
    if (requireAuth && !isAuthenticated && !isPublicRoute) {
      sessionStorage.setItem('redirectPath', currentPath);
    }

    // Redirect ke halaman login kalau belum login
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo || '/signin');
      return;
    }

    // Kalau sudah login tapi masih di halaman login/signup, arahkan ke dashboard
    if (isAuthenticated && (currentPath === '/signin' || currentPath === '/signup')) {
      const redirectPath = sessionStorage.getItem('redirectPath');
      sessionStorage.removeItem('redirectPath');
      router.push(redirectPath || '/dashboard');
      return;
    }

    // Cek kelengkapan profil kalau diminta
    if (isAuthenticated && requireCompleteProfile && profile && !profile.isProfileComplete) {
      if (currentPath !== '/profile/setup') {
        router.push('/profile/setup');
        return;
      }
    }

    // Setelah profil lengkap, arahkan ke tujuan sebelumnya
    if (isAuthenticated && profile?.isProfileComplete && currentPath === '/profile/setup') {
      const redirectPath = sessionStorage.getItem('redirectPath');
      sessionStorage.removeItem('redirectPath');
      router.push(redirectPath || '/dashboard');
      return;
    }

  }, [isAuthenticated, profile, isLoading, pathname, router, requireAuth, requireCompleteProfile, redirectTo]);

  // Tampilkan spinner saat auth masih loading
  if (isLoading || !pathname) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Tampilkan konten kalau semua kondisi terpenuhi
  if (!requireAuth || isAuthenticated) {
    if (!requireCompleteProfile || (profile && profile.isProfileComplete)) {
      return <>{children}</>;
    }
  }

  // Kalau tidak memenuhi syarat, tampilkan null saat redirect
  return null;
}
