"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon } from "@/icons";

export const Monitoring = () => {
  const [totalUser, setTotalUser] = useState<number | null>(null);
  const [totalOrder, setTotalOrder] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [totalTransaksi, setTotalTransaksi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [usersRes, ordersRes, paymentRes, transaksiRes] = await Promise.all([
          fetch("/api/admin/totalUsers"),
          fetch("/api/admin/totalOrders"),
          fetch("/api/admin/totalPayment"),
          fetch("/api/admin/totalTransaksi")
        ]);

        if (!usersRes.ok || !ordersRes.ok || !paymentRes.ok || !transaksiRes.ok) {
          throw new Error("Failed to fetch monitoring data");
        }

        const [usersData, ordersData, paymentData, transaksiData] = await Promise.all([
          usersRes.json(),
          ordersRes.json(),
          paymentRes.json(),
          transaksiRes.json()
        ]);

        setTotalUser(usersData.count);
        setTotalOrder(ordersData.count);
        setTotalAmount(paymentData.totalAmount);
        setTotalTransaksi(transaksiData.totalTransaksi ?? null);
      } catch (err) {
        console.error("Error fetching monitoring data:", err);
        setError("Failed to load monitoring data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Format currency (IDR)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({
    icon,
    label,
    value,
    loading = false,
    trend,
    trendValue,
    trendLabel,
    gradient
  }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    loading?: boolean;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    trendLabel?: string;
    gradient: string;
  }) => (
    <div className="transform transition-all duration-300 hover:scale-105 group">
      <div className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03] shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Gradient Header */}
        <div className={`h-2 w-full ${gradient}`}></div>
        
        <div className="p-5 flex flex-col h-full">
          {/* Icon and Label */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 shadow-sm dark:bg-gray-800">
                {icon}
              </div>
              <h3 className="ml-3 font-medium text-gray-600 dark:text-gray-300 text-sm">
                {label}
              </h3>
            </div>
          </div>

          {/* Main Value */}
          <div className="mt-1">
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse dark:bg-gray-700"></div>
            ) : (
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                {value}
              </h2>
            )}
          </div>

          {/* Trend */}
          {!loading && trend && (
            <div className="mt-auto pt-4">
              <div className={`flex items-center text-xs font-medium
                ${trend === 'up' ? 'text-green-600 dark:text-green-400' :
                  trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-400'}`}>
                {trend === 'up' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                {trend === 'neutral' && (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                  </svg>
                )}
                <span>{trendValue}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">{trendLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/10 dark:border-red-900/30">
        <svg className="w-12 h-12 mx-auto text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">Failed to Load Data</h3>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Title & Description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Dashboard Overview</h2>
        <p className="text-gray-500 dark:text-gray-400">Key metrics and performance indicators</p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Users Card */}
        <StatCard
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          label="Total Users"
          value={loading ? "..." : totalUser?.toLocaleString() || "N/A"}
          loading={loading}
          trend="up"
          trendValue="12%"
          trendLabel="vs. last month"
          gradient="bg-gradient-to-r from-blue-500 to-blue-700"
        />

        {/* Orders Card */}
        <StatCard
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          label="Jumlah Order"
          value={loading ? "..." : totalOrder?.toLocaleString() || "N/A"}
          loading={loading}
          trend="up"
          trendValue="8.5%"
          trendLabel="vs. last month"
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
        />

        {/* Transactions Card */}
        <StatCard
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          label="Transaksi Terbayar"
          value={loading ? "..." : totalTransaksi?.toLocaleString() || "N/A"}
          loading={loading}
          trend="up"
          trendValue="5.2%"
          trendLabel="vs. last month"
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        />

        {/* Revenue Card */}
        <StatCard
          icon={
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Total Pendapatan"
          value={loading ? "..." : totalAmount ? formatCurrency(totalAmount) : "N/A"}
          loading={loading}
          trend="up"
          trendValue="15.3%"
          trendLabel="vs. last month"
          gradient="bg-gradient-to-r from-amber-500 to-orange-600"
        />
      </div>
      
      {/* Additional section if needed */}
      <div className="mt-8 bg-white dark:bg-gray-800/30 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Data diperbarui setiap 24 jam. Terakhir diperbarui: {new Date().toLocaleDateString('id-ID',
              {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Users</span>
          </div>
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Orders</span>
          </div>
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Transactions</span>
          </div>
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
};