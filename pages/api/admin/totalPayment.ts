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

    const totalAmount = snapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      const amount = typeof data.amount === "number" ? data.amount : 0;
      return sum + amount;
    }, 0);

    return res.status(200).json({ totalAmount });
  } catch (error: any) {
    console.error("🔥 Error in /totalPayment:", error.message);
    return res.status(500).json({ error: "Failed to fetch total pendapatan" });
  }
}
