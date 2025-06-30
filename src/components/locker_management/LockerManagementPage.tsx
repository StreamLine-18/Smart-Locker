"use client";
import React, { useState } from "react";
import AllLockers from "./AllLockers";
import Maintenance from "./Maintenance";

export default function LockerManagementPage() {
  const [activeTab, setActiveTab] = useState<"all" | "maintenance">("all");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
        Locker Management
      </h1>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "all"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Lockers
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "maintenance"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance
        </button>
      </div>

      <div className="mt-4">
        {activeTab === "all" && <AllLockers />}
        {activeTab === "maintenance" && <Maintenance />}
      </div>
    </div>
  );
}
