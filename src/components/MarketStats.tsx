import React from 'react';

interface MarketStatsProps {
  stats: {
    marketPrice: number;
    volume24h: string;
    openInterest: {
      value: string;
      longPercentage: number;
      shortPercentage: number;
    };
    availableLiquidity: {
      long: string;
      short: string;
    };
    fundingVelocity: {
      rate: string;
      percentage: string;
    };
  };
}

export function MarketStats({ stats }: MarketStatsProps) {
  return (
    <div className="flex gap-12 text-sm">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">24h Volume</span>
        <span className="text-sm font-medium mt-1">{stats.volume24h}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-gray-400">Open Interest</span>
        <span className="text-sm font-medium mt-1">{stats.openInterest.value}</span>
        <div className="flex gap-3 items-center mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-green-500">{stats.openInterest.longPercentage}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-xs text-red-500">{stats.openInterest.shortPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-gray-400">Funding/Velocity</span>
        <span className="text-sm font-medium mt-1">{stats.fundingVelocity.rate}</span>
        <span className="text-xs text-gray-400 mt-1">{stats.fundingVelocity.percentage}</span>
      </div>
    </div>
  );
}