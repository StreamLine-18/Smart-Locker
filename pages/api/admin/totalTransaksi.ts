import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getFirestore(admin.app());
    const snapshot = await db.collection("invoices").count().get(); // 👈 efisien
    const totalTransaksi = snapshot.data().count;

    res.status(200).json({ totalTransaksi });
  } catch (error: any) {
    console.error("🔥 Error fetching invoices:", error.message);
    res.status(500).json({ error: "Failed to fetch total invoices" });
  }
}
