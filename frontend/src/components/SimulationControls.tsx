import { Pause, Play, RotateCcw, Settings, Zap } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  speedMultiplier: number;
  spawnRate: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSpawnRateChange: (rate: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  speedMultiplier,
  spawnRate,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
  onSpawnRateChange,
}) => {
  const speeds = [1.0, 2.0, 5.0];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
            Control Console
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">INTERSECTION 01</span>
      </div>

      {/* Primary Action Buttons (Start, Pause, Reset) */}
      <div className="grid grid-cols-3 gap-2.5">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer font-mono"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-600/20 active:scale-95 cursor-pointer font-mono"
          >
            <Pause className="w-4 h-4 fill-white" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wider uppercase transition-all border border-slate-700 active:scale-95 cursor-pointer font-mono"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>{speedMultiplier}x WARP</span>
        </div>
      </div>

      {/* Speed Multiplier Toggles */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Simulation Speed Multiplier</span>
          <span className="text-blue-400 font-bold">{speedMultiplier}x</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`py-1.5 px-3 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                speedMultiplier === s
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {s}x Speed
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Traffic Arrival Rate Slider */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400 uppercase tracking-wider">Traffic Arrival Rate</span>
          <span className="text-emerald-400 font-bold">{spawnRate} vehicles / min</span>
        </div>
        <input
          type="range"
          min="8"
          max="48"
          step="4"
          value={spawnRate}
          onChange={(e) => onSpawnRateChange(Number(e.target.value))}
          className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>Light (8 vpm)</span>
          <span>Moderate (24 vpm)</span>
          <span>Heavy (48 vpm)</span>
        </div>
      </div>
    </div>
  );
};
