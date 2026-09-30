import React from 'react';
import type { Direction } from '../types/traffic';
import { Activity, Clock, Pause, Play, RotateCcw, Settings, Sparkles, Zap } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  speedMultiplier: number;
  spawnRate: number;
  activeAlgorithm: string;
  minGreenDuration: number;
  maxGreenDuration: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSpawnRateChange: (rate: number) => void;
  onModeChange: (mode: 'FIXED_TIME' | 'DENSITY_BASED') => void;
  onMinGreenChange: (val: number) => void;
  onMaxGreenChange: (val: number) => void;
  onSurgeTraffic: (dir: Direction) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  speedMultiplier,
  spawnRate,
  activeAlgorithm,
  minGreenDuration,
  maxGreenDuration,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
  onSpawnRateChange,
  onModeChange,
  onMinGreenChange,
  onMaxGreenChange,
  onSurgeTraffic,
}) => {
  const speeds = [1.0, 2.0, 5.0];
  const isDensityBased = activeAlgorithm === 'DENSITY_BASED';

  return (
    <div className="bg-[#0D3031] rounded-xl border border-[#1B5655] p-4 shadow-sm flex flex-col gap-3.5">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-[#1B5655]/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#10D6A0]" />
          <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#E8F5F2] font-mono">
            Control Console
          </h2>
        </div>
        <span className="text-[10px] text-[#8BAFAC] font-mono bg-[#092526] px-2 py-0.5 rounded border border-[#1B5655] uppercase font-semibold">
          Intersection 01
        </span>
      </div>

      {/* Signal Control Strategy Mode Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-[#8BAFAC] uppercase tracking-wider flex items-center justify-between">
          <span>Signal Control Strategy</span>
          <span className={isDensityBased ? 'text-[#10D6A0] font-bold' : 'text-[#E8F5F2] font-bold'}>
            {isDensityBased ? 'Density-Based' : 'Fixed-Time'}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#061B1B] rounded-lg border border-[#1B5655]">
          <button
            type="button"
            onClick={() => onModeChange('FIXED_TIME')}
            className={`py-1.5 px-3 rounded text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isDensityBased
                ? 'bg-[#123A3A] text-[#E8F5F2] shadow-sm border border-[#1B5655]'
                : 'text-[#8BAFAC] hover:text-[#E8F5F2] hover:bg-[#0D3031]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#8BAFAC]" />
            <span>Fixed-Time</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('DENSITY_BASED')}
            className={`py-1.5 px-3 rounded text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isDensityBased
                ? 'bg-[#10D6A0] text-[#061B1B] shadow-sm font-bold'
                : 'text-[#8BAFAC] hover:text-[#E8F5F2] hover:bg-[#0D3031]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Density-Based</span>
          </button>
        </div>
      </div>

      {/* Primary Action Buttons (Start, Pause, Reset, Speed Display) */}
      <div className="grid grid-cols-3 gap-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={onStart}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#10D98B] hover:bg-[#10D6A0] text-[#061B1B] font-bold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer font-mono"
          >
            <Play className="w-3.5 h-3.5 fill-[#061B1B]" />
            <span>Start</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#F5B83D] hover:bg-[#E5A82D] text-[#061B1B] font-bold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer font-mono"
          >
            <Pause className="w-3.5 h-3.5 fill-[#061B1B]" />
            <span>Pause</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#092526] hover:bg-[#123A3A] text-[#E8F5F2] font-semibold text-xs tracking-wider uppercase transition-all border border-[#1B5655] active:scale-95 cursor-pointer font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#8BAFAC]" />
          <span>Reset</span>
        </button>

        {/* Speed indicator */}
        <div className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-[#061B1B] border border-[#1B5655] font-mono text-[11px] text-[#8BAFAC]">
          <Zap className="w-3 h-3 text-[#10D6A0]" />
          <span className="font-bold text-[#E8F5F2]">{speedMultiplier}x Speed</span>
        </div>
      </div>

      {/* Simulation Speed Warps */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-[#8BAFAC] uppercase tracking-wider flex items-center justify-between">
          <span>Simulation Speed</span>
          <span className="text-[#10D6A0] font-bold">{speedMultiplier}x</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {speeds.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                speedMultiplier === s
                  ? 'bg-[#123A3A] text-[#10D6A0] border border-[#10D6A0] shadow-sm'
                  : 'bg-[#061B1B] text-[#8BAFAC] hover:bg-[#092526] hover:text-[#E8F5F2] border border-[#1B5655]'
              }`}
            >
              {s}x Warp
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Green Time Bounds (Phase 2 Parameters) */}
      {isDensityBased && (
        <div className="p-3 rounded-lg bg-[#092526] border border-[#1B5655] flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-[#10D6A0] font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#10D6A0]" />
              Dynamic Green Time Bounds
            </span>
            <span className="text-[10px] text-[#8BAFAC] font-normal">Phase 2 Parameters</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
            {/* Min Green */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[#8BAFAC]">
                <span>Min Green</span>
                <span className="text-[#E8F5F2] font-bold">{minGreenDuration}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={minGreenDuration}
                onChange={(e) => onMinGreenChange(Number(e.target.value))}
                className="w-full accent-[#10D6A0] bg-[#061B1B] h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Max Green */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[#8BAFAC]">
                <span>Max Green</span>
                <span className="text-[#E8F5F2] font-bold">{maxGreenDuration}s</span>
              </div>
              <input
                type="range"
                min="25"
                max="60"
                step="5"
                value={maxGreenDuration}
                onChange={(e) => onMaxGreenChange(Number(e.target.value))}
                className="w-full accent-[#10D6A0] bg-[#061B1B] h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Inject Approach Surge (Test Density) */}
      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#1B5655]/80">
        <label className="text-[10px] font-mono text-[#8BAFAC] uppercase tracking-wider flex items-center justify-between">
          <span>Inject Approach Surge (Test Density)</span>
          <span className="text-[#10D6A0] text-[10px] font-semibold">+1 Veh</span>
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
            const letter = dir.slice(0, 1);
            return (
              <button
                type="button"
                key={dir}
                onClick={() => onSurgeTraffic(dir)}
                className="py-1 px-1 rounded-lg bg-[#092526] hover:bg-[#123A3A] border border-[#1B5655] text-[11px] font-mono font-medium text-[#E8F5F2] hover:text-[#10D6A0] transition-all cursor-pointer active:scale-95 text-center"
                title={`Spawn immediate vehicle on ${dir} approach`}
              >
                +{letter} ({letter})
              </button>
            );
          })}
        </div>
      </div>

      {/* Traffic Arrival Rate */}
      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#1B5655]/80">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#8BAFAC] uppercase tracking-wider">Traffic Arrival Rate</span>
          <span className="text-[#10D6A0] font-bold">{spawnRate} veh / min</span>
        </div>
        <input
          type="range"
          min="8"
          max="48"
          step="4"
          value={spawnRate}
          onChange={(e) => onSpawnRateChange(Number(e.target.value))}
          className="w-full accent-[#10D6A0] bg-[#061B1B] h-1.5 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#8BAFAC] font-mono">
          <span>Light</span>
          <span>Moderate</span>
          <span>Heavy</span>
        </div>
      </div>
    </div>
  );
};
