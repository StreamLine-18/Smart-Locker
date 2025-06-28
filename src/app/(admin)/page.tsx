'use client';

// import type { Metadata } from "next";
import { Monitoring } from "@/components/ecommerce/TotalMonitoring";
import { useLockers } from "@/components/ecommerce/hooks/lockerCard.hooks";
import React from "react";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import TableLoker from "@/components/ecommerce/TableLoker";
// import LockerCard from "@/components/ecommerce/lockerCard";


export default function Ecommerce() {
  const { lockers, loading } = useLockers();
  
  return (
<div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12"> 
        <Monitoring /> 
      </div> 
        <div className="col-span-12">
        <TableLoker />  {/* ini lokerrr */}
      </div> 

      {/* <div className="col-span-12 xl:col-span-7">
        <MonthlySalesChart />
      </div> */}

      {/* <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div> */}

      {/* <div className="col-span-12">
        <StatisticsChart />
      </div> */}

      {/* <div className="col-span-12 xl:col-span-6">
        {loading ? (
          <div>Loading lockers...</div>
        ) : (
          lockers.map(locker => (
            <LockerCard key={locker.id} locker={locker} />
          ))
        )}
      </div> */}
    </div>
  );
}
