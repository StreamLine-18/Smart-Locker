"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, GroupIcon } from "@/icons";

export const Monitoring = () => {
  const [totalUser, setTotalUser] = useState<number | null>(null);
  const [totalOrder, setTotalOrder] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]); // state untuk data invoice

  useEffect(() => {
    async function fetchTotalUser() {
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
      setTotalAmount(data.totalAmount);
    }
    async function fetchInvoices() {
      const res = await fetch("/api/admin/totalTransaksiberhasil");
      const data = await res.json();
      setInvoices(data.invoices || []);
    }

    fetchTotalAmount();
    fetchTotalOrder();
    fetchInvoices();
    fetchTotalUser();
  }, []);

const StatCard = ({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}) => (
  <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800">
      {icon}
    </div>
    <div className="mt-auto flex items-end justify-between pt-5">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">
          {value}
        </h4>
      </div>
      {badge}
    </div>
  </div>
);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-6">
      <StatCard
        icon={<GroupIcon className="size-6 text-gray-800 dark:text-white/90" />}
        label="Total Users"
        value={totalUser !== null ? totalUser : "Loading..."}
        badge={
          <Badge color="success">
            <ArrowUpIcon />
          </Badge>
        }
      />
      <StatCard
        icon={<GroupIcon className="size-6 text-gray-800 dark:text-white/90" />}
        label="Jumlah Order"
        value={totalOrder !== null ? totalOrder : "Loading..."}
        badge={
          <Badge color="success">
            <ArrowUpIcon />
          </Badge>
        }
      />
      <StatCard
        icon={<GroupIcon className="size-6 text-gray-800 dark:text-white/90" />}
        label="Transaksi Terbayar"
        value={invoices.length > 0 ? invoices.length : "Loading..."}
        badge={
          <Badge color="success">
            <ArrowUpIcon />
          </Badge>
        }
      />
      <StatCard
        icon={<GroupIcon className="size-6 text-gray-800 dark:text-white/90" />}
        label="Total Pendapatan"
        value={totalAmount !== null ? totalAmount : "Loading..."}
        badge={
          <Badge color="success">
            <ArrowUpIcon />
          </Badge>
        }
      />
    </div>
  );
};