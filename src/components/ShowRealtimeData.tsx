import React, { useEffect, useState } from "react";
import { fetchRealtimeData } from "@/utils/fetchRealtimeData";

export default function ShowRealtimeData() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchRealtimeData("users/user1").then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;
  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
}
