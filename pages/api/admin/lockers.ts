import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getFirestore(admin.app());
    const snapshot = await db.collection("lockers").get();
    const lockers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(lockers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lockers" });
  }
}