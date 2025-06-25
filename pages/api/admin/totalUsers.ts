import type { NextApiRequest, NextApiResponse } from "next";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const listUsers = await admin.auth().listUsers();
    res.status(200).json({ count: listUsers.users.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user count" });
  }
}