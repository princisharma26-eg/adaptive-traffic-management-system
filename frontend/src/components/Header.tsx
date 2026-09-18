import { Activity, Cpu, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  simulationTime: number;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  simulationTime,
  isBackendConnected,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
                Intelligent Adaptive Traffic Management System
              </h1>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Intersection Controller 01</span>
              <span>•</span>
              <span className="text-indigo-300 font-medium">Algorithm: Fixed-Time (30s NS / 30s EW)</span>
            </p>
          </div>
        </div>

        {/* Right: Telemetry & State Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Backend Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono transition-colors ${
              isBackendConnected
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
            }`}
          >
            {isBackendConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>BACKEND ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>STANDALONE MODE</span>
              </>
            )}
          </div>

          {/* Simulation Run State */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono ${
              isRunning
                ? 'bg-blue-950/40 border-blue-700/60 text-blue-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-blue-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span>{isRunning ? 'SIMULATION ACTIVE' : 'SIMULATION PAUSED'}</span>
          </div>

          {/* Digital Simulation Clock */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">T:</span>
            <span className="font-bold tracking-wider text-white text-sm">
              {formatTime(simulationTime)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
