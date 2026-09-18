import type { LiveStats } from '../types/traffic';
import { Car, Clock, Gauge, Hourglass, TrendingUp } from 'lucide-react';

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
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
            Live Performance Metrics
          </h2>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
          REAL-TIME TELEMETRY
        </span>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Vehicles Generated */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Spawned</span>
            <Car className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.totalSpawned}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Vehicles initiated</span>
        </div>

        {/* Vehicles Currently Waiting */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
            stats.currentWaiting > 5
              ? 'bg-amber-950/20 border-amber-600/40'
              : 'bg-slate-950/60 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Currently Waiting</span>
            <Hourglass
              className={`w-4 h-4 ${
                stats.currentWaiting > 5 ? 'text-amber-400 animate-pulse' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              stats.currentWaiting > 5 ? 'text-amber-300' : 'text-white'
            }`}
          >
            {stats.currentWaiting}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">In queue at stop line</span>
        </div>

        {/* Vehicles Passed */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Vehicles Cleared</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats.totalPassed}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Throughput: {stats.throughputPerMinute} veh/min</span>
        </div>

        {/* Simulation Time */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Simulation Clock</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatTime(stats.simulationTimeSeconds)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Elapsed runtime</span>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[11px]">Avg Vehicle Wait</span>
          <span className="text-slate-200 font-semibold text-sm">
            {stats.averageWaitTimeSeconds.toFixed(1)}s
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Max Observed Wait</span>
          <span className="text-slate-200 font-semibold text-sm">
            {stats.maxWaitTimeSeconds.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
};
