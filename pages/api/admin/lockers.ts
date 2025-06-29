import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase_admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = getFirestore(admin.app());
  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing locker id" });
    }
    try {
      await db.collection("lockers").doc(id).delete();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete locker" });
    }
  }
  if (req.method === "POST") {
    const { lockerNumber, locationId, lockStatus, doorStatus, bookingStatus, price } = req.body;
    if (!lockerNumber || !locationId || !lockStatus || !doorStatus || !bookingStatus || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const docRef = await db.collection("lockers").add({
        lockerNumber,
        locationId,
        lockStatus,
        doorStatus,
        bookingStatus,
        price
      });
      const newLocker = { id: docRef.id, lockerNumber, locationId, lockStatus, doorStatus, bookingStatus, price };
      return res.status(200).json(newLocker);
    } catch (error) {
      return res.status(500).json({ error: "Failed to add locker" });
    }
  }
  if (req.method === "PUT") {
    const { id } = req.query;
    const { lockerNumber, locationId, lockStatus, doorStatus, bookingStatus, price } = req.body;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing locker id" });
    }
    if (!lockerNumber || !locationId || !lockStatus || !doorStatus || !bookingStatus || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      await db.collection("lockers").doc(id).update({
        lockerNumber,
        locationId,
        lockStatus,
        doorStatus,
        bookingStatus,
        price
      });
      const updatedLocker = { id, lockerNumber, locationId, lockStatus, doorStatus, bookingStatus, price };
      return res.status(200).json(updatedLocker);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update locker" });
    }
  }
  try {
    const snapshot = await db.collection("lockers").get();
    const lockers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(lockers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lockers" });
  }
}