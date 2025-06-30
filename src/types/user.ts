// src/types/user.ts
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  role: 'user' | 'admin' | 'moderator';
  isProfileComplete: boolean;
  provider: 'email' | 'google';
  createdAt: Date;
  updatedAt: Date;
  lastSignIn?: Date;

  phone?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface ProfileSetupData {
  displayName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
}