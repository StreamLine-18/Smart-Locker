import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getFirestore(admin.app());
    const snapshot = await db.collection("orders").count().get();
    const count = snapshot.data().count;
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch order count" });
  }
}