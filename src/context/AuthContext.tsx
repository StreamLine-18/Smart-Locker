// src/context/AuthContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { AuthState, AuthUser, UserProfile, ProfileSetupData } from '@/types/user';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileSetupData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Convert Firebase User to AuthUser
  const convertFirebaseUser = (user: User): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  });

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastSignIn: data.lastSignIn?.toDate(),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (user: User, additionalData: Partial<UserProfile> = {}): Promise<UserProfile> => {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || additionalData.displayName || '',
      firstName: additionalData.firstName || '',
      lastName: additionalData.lastName || '',
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      role: 'user',
      isProfileComplete: false,
      provider: additionalData.provider || 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignIn: new Date(),
      ...additionalData,
    };

    // Check if profile is complete
    userProfile.isProfileComplete = !!(
      userProfile.displayName &&
      userProfile.email
    );

    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignIn: new Date(),
    });

    return userProfile;
  };

  // Update last sign in
  const updateLastSignIn = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastSignIn: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating last sign in:', error);
    }
  };

  // Auth state change handler
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (firebaseUser) {
        try {
          const authUser = convertFirebaseUser(firebaseUser);
          let profile = await fetchUserProfile(firebaseUser.uid);

          // Create profile if doesn't exist
          if (!profile) {
            const provider = firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email';
            profile = await createUserProfile(firebaseUser, { provider });
          } else {
            // Update last sign in
            await updateLastSignIn(firebaseUser.uid);
          }

          setState({
            user: authUser,
            profile,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } catch (error) {
          console.error('Error in auth state change:', error);
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            error: 'Failed to load user data',
          });
        }
      } else {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile
      await updateFirebaseProfile(user, { displayName });
      
      // Send email verification
      await sendEmailVerification(user);
      
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (data: ProfileSetupData) => {
    if (!state.user) throw new Error('No authenticated user');

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Update Firebase profile if displayName changed
      if (data.displayName !== state.user.displayName) {
        await updateFirebaseProfile(auth.currentUser!, { displayName: data.displayName });
      }

      // Update Firestore profile
      const updatedData = {
        ...data,
        isProfileComplete: !!(data.displayName && state.profile?.email),
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', state.user.uid), updatedData);

      // Refresh profile
      await refreshProfile();
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (!state.user) return;

    try {
      const profile = await fetchUserProfile(state.user.uid);
      setState(prev => ({ ...prev, profile, isLoading: false }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
    }
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};