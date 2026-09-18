import type { Direction, TrafficSignalState } from '../types/traffic';
import { TrafficSignal } from './TrafficSignal';
import { Sliders } from 'lucide-react';

interface SignalStatusProps {
  signals: Record<Direction, TrafficSignalState>;
  waitingByDirection: Record<Direction, number>;
}

export const SignalStatus: React.FC<SignalStatusProps> = ({
  signals,
  waitingByDirection,
}) => {
  const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
            Traffic Signal Telemetry
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
          Cycle: 68.0s Total
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {directions.map((dir) => (
          <TrafficSignal
            key={dir}
            direction={dir}
            signal={signals[dir]}
            waitingCount={waitingByDirection[dir] || 0}
          />
        ))}
      </div>
    </div>
  );
};
