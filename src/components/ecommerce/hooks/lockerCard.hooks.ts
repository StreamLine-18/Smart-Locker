'use client';

import { useEffect, useState } from "react";

export function useLockers() {
  const [lockers, setLockers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLockers() {
      try {
        const res = await fetch("/api/admin/lockers");
        const data = await res.json();
        setLockers(data);
      } catch {
        setLockers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLockers();
  }, []);

  return { lockers, loading };
}