import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "@/context/AuthContext";

type UserData = {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  role?: string;
  photoURL?: string;
};

export function useAdminUsers() {
  const auth = useAuth();
  const { profile, user } = auth;
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const fetchUsers = async () => {
      // If not an admin or no user, don't fetch users
      if (!isAdmin || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const usersRef = collection(db, "users");
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        const usersData: UserData[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() as Omit<UserData, 'id'> });
        });
        
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, isAdmin]);

  return { users, loading, error, isAdmin };
}
export default useAdminUsers;
