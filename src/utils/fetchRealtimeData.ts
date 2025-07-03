import { realtimeDb } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export async function fetchRealtimeData(path: string) {
  const dbRef = ref(realtimeDb, path);
  const snapshot = await get(dbRef);
  return snapshot.exists() ? snapshot.val() : null;
}
