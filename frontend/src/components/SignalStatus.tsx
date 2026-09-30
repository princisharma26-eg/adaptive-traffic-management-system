import React from 'react';
import type { Direction, TrafficSignalState } from '../types/traffic';
import { TrafficSignal } from './TrafficSignal';
import { Bike, Bus, Car, ShieldCheck, Truck } from 'lucide-react';

interface SignalStatusProps {
  signals: Record<Direction, TrafficSignalState>;
  waitingByDirection: Record<Direction, number>;
  activeAlgorithm: string;
  activeGreenCorridor: string;
  currentGreenDuration: number;
  dominantDirection?: Direction;
}

export const SignalStatus: React.FC<SignalStatusProps> = ({
  signals,
  waitingByDirection,
  activeAlgorithm,
  activeGreenCorridor,
  currentGreenDuration,
  dominantDirection,
}) => {
  const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
  const isDensityBased = activeAlgorithm === 'DENSITY_BASED';

  const formatCorridor = (corridor: string) => {
    if (corridor === 'NORTH_SOUTH') return 'North & South';
    if (corridor === 'EAST_WEST') return 'East & West';
    return corridor;
  };

  const formatColorName = (color: string) => {
    return color.charAt(0) + color.slice(1).toLowerCase();
  };

  const getSignalDotColor = (color: string) => {
    switch (color) {
      case 'GREEN':
        return 'bg-[#10D98B] shadow-[#10D98B]/50';
      case 'YELLOW':
        return 'bg-[#F5B83D] shadow-[#F5B83D]/50';
      case 'RED':
      default:
        return 'bg-[#EF4444] shadow-[#EF4444]/50';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* SECTION 8: Signal Status / Vehicle Legend Bar */}
      <div className="p-3 rounded-xl bg-[#0D3031] border border-[#1B5655] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs">
        {/* Signal Status: ● N Green  ● S Green  ● E Red  ● W Yellow */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-[#8BAFAC] uppercase font-bold tracking-wider mr-1">
            Signal Status:
          </span>
          {directions.map((dir) => {
            const sig = signals[dir];
            const letter = dir.charAt(0);
            return (
              <span
                key={dir}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#092526] border border-[#1B5655] text-[11px] font-semibold text-[#E8F5F2]"
              >
                <span className={`w-2 h-2 rounded-full shadow-sm ${getSignalDotColor(sig.color)}`} />
                <span>
                  {letter} {formatColorName(sig.color)}
                </span>
              </span>
            );
          })}
        </div>

        {/* Vehicle Legend: Car, Bus, Truck, Bike */}
        <div className="flex items-center gap-3 flex-wrap border-t sm:border-t-0 sm:border-l border-[#1B5655]/70 pt-2 sm:pt-0 sm:pl-3">
          <span className="text-[10px] text-[#8BAFAC] uppercase font-bold tracking-wider mr-1">
            Legend:
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8BAFAC]">
            <Car className="w-3.5 h-3.5 text-[#10D6A0]" />
            <span className="text-[#E8F5F2]">Car</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8BAFAC]">
            <Bus className="w-3.5 h-3.5 text-[#12BFA5]" />
            <span className="text-[#E8F5F2]">Bus</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8BAFAC]">
            <Truck className="w-3.5 h-3.5 text-[#F5B83D]" />
            <span className="text-[#E8F5F2]">Truck</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8BAFAC]">
            <Bike className="w-3.5 h-3.5 text-[#10D98B]" />
            <span className="text-[#E8F5F2]">Bike</span>
          </span>
        </div>
      </div>

      {/* Corridor & Safety Guarantee Sub-banner */}
      <div className="p-3 rounded-xl bg-[#092526] border border-[#1B5655] grid grid-cols-2 gap-3 text-xs font-mono">
        <div>
          <span className="text-[10px] text-[#8BAFAC] uppercase tracking-wider block">
            Active Green Corridor
          </span>
          <span className="text-[#10D6A0] font-bold text-xs md:text-sm flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#10D98B] animate-pulse inline-block" />
            {formatCorridor(activeGreenCorridor)}
          </span>
          {isDensityBased && dominantDirection && (
            <span className="text-[10px] text-[#8BAFAC] block mt-0.5">
              Peak demand: <strong className="text-[#E8F5F2]">{dominantDirection}</strong>
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#8BAFAC] uppercase tracking-wider block">
            {isDensityBased ? 'Dynamic Green Duration' : 'Fixed Green Duration'}
          </span>
          <span className="text-[#E8F5F2] font-bold text-xs md:text-sm font-mono mt-0.5 block">
            {currentGreenDuration.toFixed(1)}s
          </span>
          {isDensityBased ? (
            <span className="text-[10px] text-[#12BFA5] flex items-center justify-end gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-[#10D6A0]" />
              <span>Anti-Starvation Active</span>
            </span>
          ) : (
            <span className="text-[10px] text-[#8BAFAC] block mt-0.5">Static 30.0s / corridor</span>
          )}
        </div>
      </div>

      {/* SECTION 9: TRAFFIC SIGNAL TELEMETRY (Four Compact Directional Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {directions.map((dir) => (
          <TrafficSignal
            key={dir}
            direction={dir}
            signal={signals[dir]}
            waitingCount={waitingByDirection[dir] || 0}
            isPriority={isDensityBased && dominantDirection === dir}
          />
        ))}
      </div>
    </div>
  );
};
