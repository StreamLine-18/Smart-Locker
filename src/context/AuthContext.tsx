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
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { AuthState, AuthUser, UserProfile, ProfileSetupData } from '@/types/user';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileSetupData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure to wrap your components with <AuthProvider> in your root layout.'
    );
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

  const convertFirebaseUser = (user: User): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  });

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

    userProfile.isProfileComplete = !!(
      userProfile.displayName &&
      userProfile.email
    );

    await setDoc(doc(db, 'users', user.uid), userProfile);
    return userProfile;
  };

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

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 onAuthStateChanged triggered", firebaseUser);

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (firebaseUser) {
        try {
          const authUser = convertFirebaseUser(firebaseUser);
          let profile = await fetchUserProfile(firebaseUser.uid);

          if (!profile) {
            const provider = firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email';
            profile = await createUserProfile(firebaseUser, { provider });
          } else {
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
          console.error('🔥 Error in auth state change:', error);
          const authUser = convertFirebaseUser(firebaseUser);
          setState({
            user: authUser,
            profile: null,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        }
      } else {
        console.log("👋 User logged out or not signed in");
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign up function that returns the created user
  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Ensure auth is initialized
      if (!auth) {
        throw new Error("Authentication is not initialized. Please refresh the page and try again.");
      }
      
      // Create user account
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (user) {
        await updateFirebaseProfile(user, { displayName });
        await sendEmailVerification(user);
        
        // Create the initial user profile in Firestore
        await createUserProfile(user, { displayName, provider: 'email' });
        
        // Return the user
        return user;
      }
      
      throw new Error("User creation failed");
    } catch (error: any) {
      console.error("Sign up error in AuthContext:", error);
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Ensure auth is initialized
      if (!auth) {
        throw new Error("Authentication is not initialized. Please refresh the page and try again.");
      }
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Ensure auth is initialized
      if (!auth) {
        throw new Error("Authentication is not initialized. Please refresh the page and try again.");
      }
      
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (!auth) {
        throw new Error("Authentication is not initialized");
      }
      
      await signOut(auth);
      
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!auth) {
        throw new Error("Authentication is not initialized");
      }
      
      await sendPasswordResetEmail(auth, email);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  const updateProfile = async (data: ProfileSetupData) => {
    if (!state.user) throw new Error('No authenticated user');

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (data.displayName !== state.user.displayName) {
        await updateFirebaseProfile(auth!.currentUser!, { displayName: data.displayName });
      }

      const updatedData = {
        ...data,
        isProfileComplete: !!(data.displayName && state.profile?.email),
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', state.user.uid), updatedData);
      await refreshProfile();
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));
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
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
