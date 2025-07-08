"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

type UserData = {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  role?: string;
  photoURL?: string;
  uid?: string;
  createdAt?: any;
  updatedAt?: any;
  emailVerified?: boolean;
};

type SelectedUserContextType = {
  selectedUserId: string | null;
  selectedUserProfile: UserData | null;
  setSelectedUserId: (id: string | null) => void;
  loading: boolean;
};

const SelectedUserContext = createContext<SelectedUserContextType | undefined>(undefined);

export function SelectedUserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const user = auth?.user;
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // If no selected user or if selected user ID is changed, set to current user
    if (!selectedUserId && user) {
      setSelectedUserId(user.uid);
    }
  }, [user, selectedUserId]);

  React.useEffect(() => {
    const fetchSelectedUserProfile = async () => {
      if (!selectedUserId) {
        setSelectedUserProfile(null);
        return;
      }

      setLoading(true);
      try {
        const userRef = doc(db, "users", selectedUserId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setSelectedUserProfile({ id: userSnap.id, ...userSnap.data() as Omit<UserData, 'id'> });
        } else {
          setSelectedUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching selected user:", error);
        setSelectedUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedUserProfile();
  }, [selectedUserId]);

  return (
    <SelectedUserContext.Provider
      value={{
        selectedUserId,
        selectedUserProfile,
        setSelectedUserId,
        loading
      }}
    >
      {children}
    </SelectedUserContext.Provider>
  );
}

export function useSelectedUser() {
  const context = useContext(SelectedUserContext);
  if (context === undefined) {
    throw new Error("useSelectedUser must be used within a SelectedUserProvider");
  }
  return context;
}
