import type { Direction, TrafficSignalState } from '../types/traffic';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface TrafficSignalProps {
  signal: TrafficSignalState;
  direction: Direction;
  waitingCount: number;
}

export const TrafficSignal: React.FC<TrafficSignalProps> = ({
  signal,
  direction,
  waitingCount,
}) => {
  const getDirectionIcon = (dir: Direction) => {
    switch (dir) {
      case 'NORTH':
        return <ArrowDown className="w-4 h-4" />;
      case 'SOUTH':
        return <ArrowUp className="w-4 h-4" />;
      case 'EAST':
        return <ArrowLeft className="w-4 h-4" />;
      case 'WEST':
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  const isGreen = signal.color === 'GREEN';
  const isYellow = signal.color === 'YELLOW';

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all duration-300 ${
        isGreen
          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : isYellow
          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
          : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-slate-800 text-slate-300">
            {getDirectionIcon(direction)}
          </span>
          <span className="font-mono font-bold text-sm text-slate-200 tracking-wider">
            {direction}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
            isGreen
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : isYellow
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {signal.color}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Time Left
          </span>
          <span className="font-mono text-lg font-bold text-white">
            {signal.remainingSeconds.toFixed(1)}s
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Queue Waiting
          </span>
          <span className="font-mono text-sm font-semibold text-slate-300">
            {waitingCount} {waitingCount === 1 ? 'car' : 'cars'}
          </span>
        </div>
      </div>
    </div>
  );
};
