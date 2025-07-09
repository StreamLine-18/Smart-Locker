"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean; // New prop for admin-only routes
  requireCompleteProfile?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireCompleteProfile = false,
  redirectTo
}: AuthGuardProps) {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // List of public routes (no auth required)
  const publicRoutes = ['/', '/signin', '/signup', '/forgot-password'];

  // Check if current path is a public route
  const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false;

  // Check if user is an admin
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    // Don't proceed if auth is still loading or pathname is undefined
    if (isLoading || !pathname) return;

    const currentPath = pathname;

    // Save requested destination before login
    if (requireAuth && !isAuthenticated && !isPublicRoute) {
      sessionStorage.setItem('redirectPath', currentPath);
    }

    // Redirect to login if authentication is required but user is not logged in
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo || '/signin');
      return;
    }

    // Redirect to dashboard if user is already logged in but trying to access login/signup pages
    if (isAuthenticated && (currentPath === '/signin' || currentPath === '/signup')) {
      const redirectPath = sessionStorage.getItem('redirectPath');
      sessionStorage.removeItem('redirectPath');
      
      // Redirect admins to admin dashboard, regular users to user dashboard
      if (isAdmin) {
        router.push(redirectPath || '/');
      } else {
        router.push(redirectPath || '/');
      }
      return;
    }

    // Check if user has admin privileges when accessing admin-only routes
    if (requireAdmin && isAuthenticated && !isAdmin) {
      // User is logged in but not an admin, redirect to unauthorized page or dashboard
      router.push('/unauthorized');
      return;
    }

    // Check if profile is complete when required
    if (isAuthenticated && requireCompleteProfile && profile && !profile.isProfileComplete) {
      if (currentPath !== '/profile/setup') {
        router.push('/profile/setup');
        return;
      }
    }

    // After profile setup is complete, redirect to saved destination or appropriate dashboard
    if (isAuthenticated && profile?.isProfileComplete && currentPath === '/profile/setup') {
      const redirectPath = sessionStorage.getItem('redirectPath');
      sessionStorage.removeItem('redirectPath');
      
      if (isAdmin) {
        router.push(redirectPath || '/');
      } else {
        router.push(redirectPath || '/');
      }
      return;
    }

  }, [isAuthenticated, profile, isAdmin, isLoading, pathname, router, requireAuth, requireAdmin, requireCompleteProfile, redirectTo]);

  // Show loading spinner while auth is in progress
  if (isLoading || !pathname) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show content if all conditions are met
  if (
    (!requireAuth || isAuthenticated) && 
    (!requireAdmin || isAdmin) && 
    (!requireCompleteProfile || (profile && profile.isProfileComplete))
  ) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
