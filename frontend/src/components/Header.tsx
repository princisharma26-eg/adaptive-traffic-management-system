import React from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  simulationTime: number;
  isBackendConnected: boolean;
  activeAlgorithm?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  simulationTime,
  isBackendConnected,
  activeAlgorithm = 'DENSITY_BASED',
}) => {
  const isDensityBased = activeAlgorithm === 'DENSITY_BASED';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <header className="w-full bg-[#092526] border-b border-[#1B5655] px-4 md:px-6 py-3 sticky top-0 z-40 shadow-sm select-none">
      <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Traffic-System Icon & Title Block */}
        <div className="flex items-center gap-3">
          {/* Traffic-System Icon */}
          <div className="p-2 bg-[#0D3031] border border-[#1B5655] rounded-lg shadow-sm flex items-center justify-center shrink-0">
            <div className="w-5 h-5 flex flex-col items-center justify-between py-0.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span className="w-2 h-2 rounded-full bg-[#F5B83D]" />
              <span className="w-2 h-2 rounded-full bg-[#10D98B] animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-sm md:text-base font-bold tracking-tight text-[#E8F5F2] uppercase font-mono">
                Intelligent Adaptive Traffic Management System
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-[#10D6A0]/15 text-[#10D6A0] border border-[#10D6A0]/30 tracking-wide uppercase">
                Phase 2
              </span>
            </div>
            <p className="text-[11px] text-[#8BAFAC] flex items-center gap-2 mt-0.5 font-mono">
              <span className="text-[#E8F5F2] font-medium">Intersection Controller 01</span>
              <span className="text-[#1B5655]">•</span>
              <span className={isDensityBased ? 'text-[#10D6A0] font-medium' : 'text-[#8BAFAC]'}>
                {isDensityBased
                  ? 'Density-Based Adaptive Strategy (Dynamic Green Allocation)'
                  : 'Fixed-Time Baseline Strategy (30.0s Pre-timed)'}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Telemetry & State Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* DENSITY-ACTUATED / FIXED-TIME Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${
              isDensityBased
                ? 'bg-[#123A3A] border-[#10D6A0]/40 text-[#10D6A0]'
                : 'bg-[#0D3031] border-[#1B5655] text-[#8BAFAC]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isDensityBased ? 'bg-[#10D6A0] animate-pulse' : 'bg-[#8BAFAC]'}`}
            />
            <span>{isDensityBased ? 'DENSITY-ACTUATED' : 'FIXED-TIME'}</span>
          </div>

          {/* STANDALONE / BACKEND ONLINE status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
              isBackendConnected
                ? 'bg-[#123A3A] border-[#10D98B]/40 text-[#10D98B]'
                : 'bg-[#0D3031] border-[#1B5655] text-[#8BAFAC]'
            }`}
          >
            {isBackendConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#10D98B] animate-pulse" />
                <span>BACKEND ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-[#8BAFAC]" />
                <span>STANDALONE</span>
              </>
            )}
          </div>

          {/* SIM RUNNING / SIM PAUSED status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${
              isRunning
                ? 'bg-[#123A3A] border-[#10D6A0]/50 text-[#10D6A0]'
                : 'bg-[#0D3031] border-[#1B5655] text-[#8BAFAC]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-[#10D6A0] animate-pulse' : 'bg-[#8BAFAC]'
              }`}
            />
            <span>{isRunning ? 'SIM RUNNING' : 'SIM PAUSED'}</span>
          </div>

          {/* Simulation timer */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#061B1B] border border-[#1B5655] text-[#E8F5F2] text-[11px]">
            <Activity className="w-3.5 h-3.5 text-[#10D6A0]" />
            <span className="text-[#8BAFAC]">T:</span>
            <span className="font-bold tracking-wider text-[#E8F5F2]">
              {formatTime(simulationTime)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
