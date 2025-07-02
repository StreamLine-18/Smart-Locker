import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase_admin";

const db = getFirestore(admin.app());

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "DELETE": {
        const { id } = req.query;
        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Missing locker ID" });
        }
        await db.collection("lockers").doc(id).delete();
        return res.status(200).json({ success: true, message: "Locker deleted successfully" });
      }

      case "POST": {
        const { lockerNumber, locationId, lockStatus, doorStatus, bookingStatus, price } = req.body;
        if (
          !lockerNumber ||
          !locationId ||
          !lockStatus ||
          !doorStatus ||
          !bookingStatus ||
          typeof price !== "number"
        ) {
          return res.status(400).json({ error: "Missing or invalid required fields" });
        }
        const docRef = await db.collection("lockers").add({
          lockerNumber,
          locationId,
          lockStatus,
          doorStatus,
          bookingStatus,
          price,
        });
        return res.status(201).json({
          id: docRef.id,
          lockerNumber,
          locationId,
          lockStatus,
          doorStatus,
          bookingStatus,
          price,
        });
      }

      case "PUT": {
        const { id } = req.query;
        const { lockerNumber, locationId, lockStatus, doorStatus, bookingStatus, price } = req.body;
        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Missing locker ID" });
        }
        if (
          !lockerNumber ||
          !locationId ||
          !lockStatus ||
          !doorStatus ||
          !bookingStatus ||
          typeof price !== "number"
        ) {
          return res.status(400).json({ error: "Missing or invalid required fields" });
        }
        await db.collection("lockers").doc(id).update({
          lockerNumber,
          locationId,
          lockStatus,
          doorStatus,
          bookingStatus,
          price,
        });
        return res.status(200).json({
          id,
          lockerNumber,
          locationId,
          lockStatus,
          doorStatus,
          bookingStatus,
          price,
          message: "Locker updated successfully",
        });
      }

      case "GET": {
        const snapshot = await db.collection("lockers").get();
        const lockers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return res.status(200).json(lockers);
      }

      default:
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    console.error("🔥 API /lockers error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
