import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = getFirestore(admin.app());
    // Ambil semua data dari koleksi 'invoices'
    const invoicesSnapshot = await db.collection("invoices").get();
    const invoices = invoicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      invoices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch invoices data",
    });
  }
}