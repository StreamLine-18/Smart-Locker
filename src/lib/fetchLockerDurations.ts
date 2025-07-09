import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export async function fetchLockerDurations() {
  const dbRef = ref(database, "lockerDurations");
  const snapshot = await get(dbRef);
  return snapshot.exists() ? snapshot.val() : {};
}
