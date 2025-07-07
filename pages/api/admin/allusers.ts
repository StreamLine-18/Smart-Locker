import type { NextApiRequest, NextApiResponse } from "next";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const usersCollection = collection(db, "users");
    const usersQuery = query(usersCollection, where("role", "==", "user"));
    const usersSnapshot = await getDocs(usersQuery);

    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ users });
  } catch (error: any) {
    console.error("🔥 Error fetching all users:", error.message);
    return res.status(500).json({ error: "Failed to fetch all users" });
  }
}