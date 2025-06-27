import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getFirestore(admin.app());
    const snapshot = await db.collection("payments").get();
    let totalAmount = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.amount === "number") {
        totalAmount += data.amount;
      }
    });
    res.status(200).json({ totalAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch total pendapatan" });
  }
}