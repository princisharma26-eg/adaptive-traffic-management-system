import React from 'react';
import type { Direction, TrafficSignalState } from '../types/traffic';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';

interface TrafficSignalProps {
  signal: TrafficSignalState;
  direction: Direction;
  waitingCount: number;
  isPriority?: boolean;
}

export const TrafficSignal: React.FC<TrafficSignalProps> = ({
  signal,
  direction,
  waitingCount,
  isPriority = false,
}) => {
  const getDirectionIcon = (dir: Direction) => {
    switch (dir) {
      case 'NORTH':
        return <ArrowDown className="w-3 h-3" />;
      case 'SOUTH':
        return <ArrowUp className="w-3 h-3" />;
      case 'EAST':
        return <ArrowLeft className="w-3 h-3" />;
      case 'WEST':
        return <ArrowRight className="w-3 h-3" />;
    }
  };

  const isGreen = signal.color === 'GREEN';
  const isYellow = signal.color === 'YELLOW';

  // Queue Density computation
  const getDensityLevel = (count: number) => {
    if (count === 0) return { label: 'EMPTY', color: 'bg-[#1B5655]', text: 'text-[#8BAFAC]', width: '6%' };
    if (count <= 2) return { label: 'LOW', color: 'bg-[#10D98B]', text: 'text-[#10D98B]', width: '32%' };
    if (count <= 5) return { label: 'MEDIUM', color: 'bg-[#F5B83D]', text: 'text-[#F5B83D]', width: '65%' };
    return { label: 'HIGH', color: 'bg-[#EF4444]', text: 'text-[#EF4444]', width: '100%' };
  };

  const density = getDensityLevel(waitingCount);
  const dirShort = direction.charAt(0);

  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
        isGreen
          ? 'bg-[#0D3031] border-[#10D98B] ring-1 ring-[#10D98B]/30 shadow-sm'
          : isYellow
          ? 'bg-[#0D3031] border-[#F5B83D] ring-1 ring-[#F5B83D]/30 shadow-sm'
          : 'bg-[#0D3031] border-[#EF4444] ring-1 ring-[#EF4444]/25 shadow-sm'
      }`}
    >
      {/* Priority Ribbon */}
      {isPriority && waitingCount > 0 && (
        <div className="absolute top-0 right-0 bg-[#10D6A0] text-[#061B1B] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-bl flex items-center gap-0.5 shadow-sm">
          <Zap className="w-2.5 h-2.5 fill-[#061B1B]" />
          PRIORITY
        </div>
      )}

      {/* Header: Direction label NORTH (N) + Signal State Pill */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded bg-[#092526] border border-[#1B5655] text-[#8BAFAC]">
            {getDirectionIcon(direction)}
          </span>
          <span className="font-mono font-bold text-xs md:text-sm text-[#E8F5F2] tracking-wider">
            {direction} ({dirShort})
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
            isGreen
              ? 'bg-[#10D98B]/20 text-[#10D98B] border border-[#10D98B]/40'
              : isYellow
              ? 'bg-[#F5B83D]/20 text-[#F5B83D] border border-[#F5B83D]/40'
              : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
          }`}
        >
          {signal.color}
        </span>
      </div>

      {/* Queue Density bar & label */}
      <div className="my-1.5 p-2 rounded-lg bg-[#092526] border border-[#1B5655]/60">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
          <span className="text-[#8BAFAC]">Queue Density</span>
          <span className={`${density.text} font-bold`}>{density.label}</span>
        </div>
        <div className="w-full bg-[#061B1B] h-1.5 rounded-full overflow-hidden border border-[#1B5655]/60">
          <div
            className={`h-full ${density.color} transition-all duration-300`}
            style={{ width: density.width }}
          />
        </div>
      </div>

      {/* Time Left & Queue Waiting */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1B5655]/60 font-mono">
        <div>
          <span className="text-[9px] uppercase font-semibold text-[#8BAFAC] block">
            Time Left
          </span>
          <span
            className={`text-sm md:text-base font-bold ${
              isGreen ? 'text-[#10D98B]' : isYellow ? 'text-[#F5B83D]' : 'text-[#E8F5F2]'
            }`}
          >
            {signal.remainingSeconds.toFixed(1)}s
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-semibold text-[#8BAFAC] block">
            Queue Waiting
          </span>
          <span className="text-xs md:text-sm font-semibold text-[#E8F5F2]">
            {waitingCount} {waitingCount === 1 ? 'veh' : 'vehs'}
          </span>
        </div>
      </div>
    </div>
  );
};
