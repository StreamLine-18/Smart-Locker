// pages/api/admin/totalUsers.ts

import type { NextApiRequest, NextApiResponse } from "next";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await admin.auth().listUsers(1000); // Limit: 1000
    const count = result.users.length;
    return res.status(200).json({ count });
  } catch (error: any) {
    console.error("🔥 Error fetching user count:", error.message);
    return res.status(500).json({ error: "Failed to fetch user count" });
  }
}
