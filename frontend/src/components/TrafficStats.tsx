import React from 'react';
import type { LiveStats } from '../types/traffic';
import { Car, Clock, Gauge, Hourglass, Scale, Timer, TrendingUp } from 'lucide-react';

interface TrafficStatsProps {
  stats: LiveStats;
}

export const TrafficStats: React.FC<TrafficStatsProps> = ({ stats }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="bg-[#0D3031] rounded-xl border border-[#1B5655] p-4 shadow-sm flex flex-col gap-3">
      {/* Header: LIVE PERFORMANCE METRICS | REAL-TIME TELEMETRY */}
      <div className="flex items-center justify-between border-b border-[#1B5655]/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#10D6A0]" />
          <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#E8F5F2] font-mono">
            Live Performance Metrics
          </h2>
        </div>
        <span className="text-[10px] text-[#10D6A0] font-mono bg-[#092526] border border-[#1B5655] px-2 py-0.5 rounded font-semibold uppercase">
          Real-Time Telemetry
        </span>
      </div>

      {/* Main Metric Cards Grid (Total Spawned, Currently Waiting, Avg. Travel Time, Vehicles Cleared) */}
      <div className="grid grid-cols-2 gap-2.5 font-mono">
        {/* Total Spawned */}
        <div className="p-3 rounded-lg bg-[#092526] border border-[#1B5655] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8BAFAC] mb-1">
            <span className="text-xs font-medium">Total Spawned</span>
            <Car className="w-3.5 h-3.5 text-[#10D6A0]" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-[#E8F5F2]">
            {stats.totalSpawned}
          </div>
          <span className="text-[10px] text-[#8BAFAC] mt-0.5">Vehicles initiated</span>
        </div>

        {/* Currently Waiting */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
            stats.currentWaiting > 5
              ? 'bg-[#092526] border-[#F5B83D]'
              : 'bg-[#092526] border-[#1B5655]'
          }`}
        >
          <div className="flex items-center justify-between text-[#8BAFAC] mb-1">
            <span className="text-xs font-medium">Currently Waiting</span>
            <Hourglass
              className={`w-3.5 h-3.5 ${
                stats.currentWaiting > 5 ? 'text-[#F5B83D] animate-pulse' : 'text-[#8BAFAC]'
              }`}
            />
          </div>
          <div
            className={`text-xl md:text-2xl font-bold ${
              stats.currentWaiting > 5 ? 'text-[#F5B83D]' : 'text-[#E8F5F2]'
            }`}
          >
            {stats.currentWaiting}
          </div>
          <span className="text-[10px] text-[#8BAFAC] mt-0.5">In queue at stop lines</span>
        </div>

        {/* Avg. Travel Time (Average Queue/Vehicle Wait Time) */}
        <div className="p-3 rounded-lg bg-[#092526] border border-[#1B5655] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8BAFAC] mb-1">
            <span className="text-xs font-medium">Avg. Travel Time</span>
            <Timer className="w-3.5 h-3.5 text-[#12BFA5]" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-[#10D6A0]">
            {stats.averageWaitTimeSeconds.toFixed(1)}s
          </div>
          <span className="text-[10px] text-[#8BAFAC] mt-0.5">Average delay/wait</span>
        </div>

        {/* Vehicles Cleared */}
        <div className="p-3 rounded-lg bg-[#092526] border border-[#1B5655] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8BAFAC] mb-1">
            <span className="text-xs font-medium">Vehicles Cleared</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#10D98B]" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-[#10D98B]">
            {stats.totalPassed}
          </div>
          <span className="text-[10px] text-[#8BAFAC] mt-0.5">
            Rate: {stats.throughputPerMinute} veh/min
          </span>
        </div>
      </div>

      {/* Secondary Metrics Bar (Simulation Clock, Max Wait, Fairness Index) */}
      <div className="p-2.5 rounded-lg bg-[#092526] border border-[#1B5655] grid grid-cols-3 gap-2 text-xs font-mono">
        <div>
          <span className="text-[#8BAFAC] block text-[9px] uppercase">Clock</span>
          <span className="text-[#E8F5F2] font-bold text-xs flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#10D6A0]" />
            {formatTime(stats.simulationTimeSeconds)}
          </span>
        </div>
        <div>
          <span className="text-[#8BAFAC] block text-[9px] uppercase">Max Wait</span>
          <span className="text-[#E8F5F2] font-bold text-xs">
            {stats.maxWaitTimeSeconds.toFixed(1)}s
          </span>
        </div>
        <div>
          <span className="text-[#8BAFAC] block text-[9px] uppercase flex items-center gap-1">
            <Scale className="w-2.5 h-2.5 text-[#10D6A0]" />
            Fairness
          </span>
          <span className="text-[#10D6A0] font-bold text-xs">
            {stats.fairnessIndex.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
