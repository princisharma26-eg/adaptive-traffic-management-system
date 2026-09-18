import React, { useEffect, useRef, useState } from 'react';
import { SimulationApiClient } from '../api/simulationApi';
import { SimulationEngine } from '../simulation/SimulationEngine';
import type { Direction, LiveStats, SimulationConfig, TrafficSignalState, Vehicle } from '../types/traffic';
import { Header } from './Header';
import { SignalStatus } from './SignalStatus';
import { SimulationControls } from './SimulationControls';
import { TrafficCanvas } from './TrafficCanvas';
import { TrafficStats } from './TrafficStats';
import { Info } from 'lucide-react';

const DEFAULT_CONFIG: SimulationConfig = {
  northSouthGreenDuration: 30,
  eastWestGreenDuration: 30,
  yellowDuration: 3,
  allRedDuration: 1,
  spawnRatePerMinute: 20,
  speedMultiplier: 1.0,
  activeAlgorithm: 'FIXED_TIME',
};

export const Dashboard: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [spawnRate, setSpawnRate] = useState<number>(20);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  const engineRef = useRef<SimulationEngine | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTelemetrySyncRef = useRef<number>(0);

  // Live state synchronized with React render cycle
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [signals, setSignals] = useState<Record<Direction, TrafficSignalState>>({
    NORTH: { direction: 'NORTH', color: 'GREEN', remainingSeconds: 30 },
    SOUTH: { direction: 'SOUTH', color: 'GREEN', remainingSeconds: 30 },
    EAST:  { direction: 'EAST',  color: 'RED',   remainingSeconds: 34 },
    WEST:  { direction: 'WEST',  color: 'RED',   remainingSeconds: 34 },
  });
  const [stats, setStats] = useState<LiveStats>({
    simulationTimeSeconds: 0,
    totalSpawned: 0,
    currentWaiting: 0,
    totalPassed: 0,
    waitingByDirection: { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 },
    passedByDirection: { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 },
    averageWaitTimeSeconds: 0,
    maxWaitTimeSeconds: 0,
    throughputPerMinute: 0,
    fairnessIndex: 1.0,
  });

  // Initialize simulation engine
  useEffect(() => {
    const engine = new SimulationEngine(DEFAULT_CONFIG);
    engineRef.current = engine;

    // Check backend connectivity and fetch server config
    SimulationApiClient.fetchConfig().then((serverConfig) => {
      if (serverConfig) {
        setIsBackendConnected(true);
        setConfig(serverConfig);
        engine.updateConfig(serverConfig);
      } else {
        setIsBackendConnected(false);
      }
    });

    // Start requestAnimationFrame loop
    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (engineRef.current) {
        const { vehicles: updatedVehicles, signals: updatedSignals, stats: updatedStats } =
          engineRef.current.tick(dt);

        setVehicles([...updatedVehicles]);
        setSignals({ ...updatedSignals });
        setStats({ ...updatedStats });

        // Periodically sync telemetry with backend (every 1.5s while running)
        if (
          engineRef.current.getIsRunning() &&
          currentTime - lastTelemetrySyncRef.current > 1500
        ) {
          lastTelemetrySyncRef.current = currentTime;
          SimulationApiClient.sendTelemetry(updatedStats).then((success) => {
            setIsBackendConnected(success);
          });
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setIsRunning(true);
      SimulationApiClient.sendControl('START', speedMultiplier);
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsRunning(false);
      SimulationApiClient.sendControl('PAUSE');
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setIsRunning(false);
      setVehicles([]);
      SimulationApiClient.sendControl('RESET');
    }
  };

  const handleSpeedChange = (speed: number) => {
    setSpeedMultiplier(speed);
    if (engineRef.current) {
      engineRef.current.setSpeedMultiplier(speed);
      SimulationApiClient.sendControl('SET_SPEED', speed);
    }
  };

  const handleSpawnRateChange = (rate: number) => {
    setSpawnRate(rate);
    const updated = { ...config, spawnRatePerMinute: rate };
    setConfig(updated);
    if (engineRef.current) {
      engineRef.current.updateConfig(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        isRunning={isRunning}
        simulationTime={stats.simulationTimeSeconds}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Engineering Notice Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Phase 1 Operating Mode:</strong> Fixed-Time signal controller running 30.0s
              North/South green and 30.0s East/West green with 3.0s yellow &amp; 1.0s all-red clearance.
            </span>
          </div>
          <span className="font-mono text-[11px] text-blue-400 font-semibold hidden sm:inline">
            ALGORITHM: FIXED_TIME
          </span>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Canvas Viewport (7 of 12 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <TrafficCanvas vehicles={vehicles} signals={signals} />

            {/* Canvas Legend / Orientation Guide */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Green: Go
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Yellow: Clear
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  Red: Stop
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Active Vehicles in Scene: <strong>{vehicles.length}</strong>
              </span>
            </div>
          </div>

          {/* Right Column: Telemetry & Controls (5 of 12 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Simulation Controls */}
            <SimulationControls
              isRunning={isRunning}
              speedMultiplier={speedMultiplier}
              spawnRate={spawnRate}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onSpeedChange={handleSpeedChange}
              onSpawnRateChange={handleSpawnRateChange}
            />

            {/* Signal Status Cards */}
            <SignalStatus
              signals={signals}
              waitingByDirection={stats.waitingByDirection}
            />

            {/* Live Statistics */}
            <TrafficStats stats={stats} />
          </div>
        </div>
      </main>
    </div>
  );
};
