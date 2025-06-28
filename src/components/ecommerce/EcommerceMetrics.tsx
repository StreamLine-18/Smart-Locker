"use client";
import React, {useState, useEffect} from "react";
// import adminService from "@/service/adminService";
import Badge from "../ui/badge/Badge";
import {  ArrowUpIcon, GroupIcon } from "@/icons";

export const EcommerceMetrics = () => {
  const [totalUser, setTotalUser] = useState<number | null>(null);
  const [totalOrder, setTotalOrder] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null); // jumlah   total pendapatan1

  useEffect(() => {
    async function fecthTotalUser() {
      const res = await fetch("/api/admin/totalUsers");
      const data = await res.json();
      setTotalUser(data.count);
    }
    async function fetchTotalOrder() {
      const res = await fetch("/api/admin/totalOrders");
      const data = await res.json();
      setTotalOrder(data.count);
    }
    async function fetchTotalAmount() {
      const res = await fetch("/api/admin/totalPayment");
      const data = await res.json();
      setTotalAmount(data.totalAmount); // ambil totalAmount dari API
    }

    fetchTotalAmount();
    fetchTotalOrder();
    fecthTotalUser();
  }, []);
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
      <GroupIcon className="size-6 text-gray-800 dark:text-white/90" />
        </div>
    <div className="mt-auto flex items-end justify-between pt-5">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total Users Login
        </span>
        <h4 className="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">
          {totalUser !== null ? totalUser : "Loading..."}
        </h4>
      </div>
      <Badge color="success">
        <ArrowUpIcon />
        11.01%
      </Badge>
    </div>
  </div>

  <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
      <GroupIcon className="size-6 text-gray-800 dark:text-white/90" />
    </div>
    <div className="mt-auto flex items-end justify-between pt-5">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Jumlah Order
        </span>
        <h4 className="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">
          {totalOrder !== null ? totalOrder : "Loading..."}
        </h4>
      </div>
      <Badge color="success">
        <ArrowUpIcon />
        11.01%
      </Badge>
    </div>
  </div>

  <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
      <GroupIcon className="size-6 text-gray-800 dark:text-white/90" />
    </div>

    <div className="mt-auto flex items-end justify-between pt-5">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total Pendapatan
        </span>
        <h4 className="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">
          {totalAmount !== null ? totalAmount : "Loading..."}
        </h4>
      </div>
      <Badge color="success">
        <ArrowUpIcon />
        11.01%
      </Badge>
    </div>
  </div>
  </div>
  );
};
