import React, { useEffect, useRef, useState } from 'react';
import { SimulationApiClient } from '../api/simulationApi';
import { SimulationEngine } from '../simulation/SimulationEngine';
import type { Direction, LiveStats, SimulationConfig, TrafficSignalState, Vehicle } from '../types/traffic';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SignalStatus } from './SignalStatus';
import { SimulationControls } from './SimulationControls';
import { TrafficCanvas } from './TrafficCanvas';
import { TrafficStats } from './TrafficStats';
import { Activity, CheckCircle2, Clock, Cpu, Radio, ShieldCheck } from 'lucide-react';

const DEFAULT_CONFIG: SimulationConfig = {
  northSouthGreenDuration: 30,
  eastWestGreenDuration: 30,
  yellowDuration: 3,
  allRedDuration: 1,
  spawnRatePerMinute: 20,
  speedMultiplier: 1.0,
  activeAlgorithm: 'DENSITY_BASED',
  minGreenDuration: 10,
  maxGreenDuration: 40,
};

export const Dashboard: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [spawnRate, setSpawnRate] = useState<number>(20);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const engineRef = useRef<SimulationEngine | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTelemetrySyncRef = useRef<number>(0);

  // Live state synchronized with React render cycle
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [signals, setSignals] = useState<Record<Direction, TrafficSignalState>>({
    NORTH: { direction: 'NORTH', color: 'GREEN', remainingSeconds: 10 },
    SOUTH: { direction: 'SOUTH', color: 'GREEN', remainingSeconds: 10 },
    EAST:  { direction: 'EAST',  color: 'RED',   remainingSeconds: 14 },
    WEST:  { direction: 'WEST',  color: 'RED',   remainingSeconds: 14 },
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

  // Signal model telemetry
  const [activeGreenCorridor, setActiveGreenCorridor] = useState<string>('NORTH_SOUTH');
  const [currentGreenDuration, setCurrentGreenDuration] = useState<number>(10);
  const [dominantDirection, setDominantDirection] = useState<Direction>('NORTH');

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
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (engineRef.current) {
        const { vehicles: updatedVehicles, signals: updatedSignals, stats: updatedStats } =
          engineRef.current.tick(dt);

        setVehicles([...updatedVehicles]);
        setSignals({ ...updatedSignals });
        setStats({ ...updatedStats });

        const signalModel = engineRef.current.getSignalModel();
        setActiveGreenCorridor(signalModel.getActiveGreenCorridor());
        setCurrentGreenDuration(signalModel.getCurrentGreenDuration());
        setDominantDirection(signalModel.getDominantDirection());

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
      const sigModel = engineRef.current.getSignalModel();
      setActiveGreenCorridor(sigModel.getActiveGreenCorridor());
      setCurrentGreenDuration(sigModel.getCurrentGreenDuration());
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
    SimulationApiClient.updateConfig(updated);
  };

  const handleModeChange = (mode: 'FIXED_TIME' | 'DENSITY_BASED') => {
    const updated = { ...config, activeAlgorithm: mode };
    setConfig(updated);
    if (engineRef.current) {
      engineRef.current.updateConfig(updated);
    }
    SimulationApiClient.updateConfig(updated);
  };

  const handleMinGreenChange = (val: number) => {
    const updated = { ...config, minGreenDuration: val };
    setConfig(updated);
    if (engineRef.current) {
      engineRef.current.updateConfig(updated);
    }
    SimulationApiClient.updateConfig(updated);
  };

  const handleMaxGreenChange = (val: number) => {
    const updated = { ...config, maxGreenDuration: val };
    setConfig(updated);
    if (engineRef.current) {
      engineRef.current.updateConfig(updated);
    }
    SimulationApiClient.updateConfig(updated);
  };

  const handleSurgeTraffic = (dir: Direction) => {
    if (engineRef.current) {
      engineRef.current.surgeTraffic(dir);
    }
  };

  const isDensityBased = config.activeAlgorithm === 'DENSITY_BASED';

  return (
    <div className="min-h-screen bg-[#061B1B] text-[#E8F5F2] flex flex-col selection:bg-[#10D6A0] selection:text-[#061B1B]">
      {/* Top Header (Section 2) */}
      <Header
        isRunning={isRunning}
        simulationTime={stats.simulationTimeSeconds}
        isBackendConnected={isBackendConnected}
        activeAlgorithm={config.activeAlgorithm}
      />

      {/* Main Layout Container with Sidebar (Section 3) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeAlgorithm={config.activeAlgorithm}
        />

        {/* Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto p-3.5 md:p-5 flex flex-col gap-3.5 max-w-[1680px] w-full mx-auto">
          {/* SECTION 4: Phase 2 Information Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-[#0D3031] border border-[#1B5655] shadow-sm gap-3">
            <div className="flex items-start sm:items-center gap-3">
              {isDensityBased ? (
                <div className="p-2 rounded-lg bg-[#123A3A] border border-[#10D6A0]/40 shrink-0">
                  <Activity className="w-4 h-4 text-[#10D6A0] animate-pulse" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-[#092526] border border-[#1B5655] shrink-0">
                  <Clock className="w-4 h-4 text-[#8BAFAC]" />
                </div>
              )}
              <div className="leading-snug">
                {isDensityBased ? (
                  <>
                    <h3 className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-[#10D6A0]">
                      PHASE 2 ACTIVE (DENSITY-ACTUATED MODE)
                    </h3>
                    <p className="text-[11px] md:text-xs text-[#E8F5F2] font-mono mt-0.5">
                      Real-time queue detection automatically allocates green duration between{' '}
                      <strong className="text-[#10D6A0] font-bold">{config.minGreenDuration || 10}s</strong> and{' '}
                      <strong className="text-[#10D6A0] font-bold">{config.maxGreenDuration || 40}s</strong>.
                    </p>
                    <p className="text-[10px] md:text-[11px] text-[#8BAFAC] font-mono mt-0.5">
                      Anti-starvation safety guarantee &amp; dual-clearance intervals active.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-[#8BAFAC]">
                      PHASE 1 ACTIVE (FIXED-TIME BASELINE)
                    </h3>
                    <p className="text-[11px] md:text-xs text-[#E8F5F2] font-mono mt-0.5">
                      Deterministic cyclical operation allocating static 30.0s North/South green and 30.0s East/West green.
                    </p>
                    <p className="text-[10px] md:text-[11px] text-[#8BAFAC] font-mono mt-0.5">
                      Standard 3.0s yellow &amp; 1.0s all-red safety clearance.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <span className="font-mono text-xs text-[#10D6A0] font-bold px-3 py-1.5 rounded-lg bg-[#092526] border border-[#1B5655] block text-center uppercase tracking-wider">
                STRATEGY: {config.activeAlgorithm}
              </span>
            </div>
          </div>

          {/* SECTION 11: Balanced 2-Column Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column (Intersection Canvas + Signal Status & Legend + Telemetry Cards) */}
            <div className="lg:col-span-7 flex flex-col gap-3.5">
              {/* SECTION 5 & 6: Main Intersection Canvas with trees, landscaping & signal overlays */}
              <TrafficCanvas vehicles={vehicles} signals={signals} />

              {/* SECTION 8 & 9: Signal Status, Vehicle Legend & Directional Telemetry Cards */}
              <SignalStatus
                signals={signals}
                waitingByDirection={stats.waitingByDirection}
                activeAlgorithm={config.activeAlgorithm}
                activeGreenCorridor={activeGreenCorridor}
                currentGreenDuration={currentGreenDuration}
                dominantDirection={dominantDirection}
              />
            </div>

            {/* Right Column (Control Console + Performance Metrics + Architecture Info) */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              {/* SECTION 7: Control Console */}
              <SimulationControls
                isRunning={isRunning}
                speedMultiplier={speedMultiplier}
                spawnRate={spawnRate}
                activeAlgorithm={config.activeAlgorithm}
                minGreenDuration={config.minGreenDuration || 10}
                maxGreenDuration={config.maxGreenDuration || 40}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onSpeedChange={handleSpeedChange}
                onSpawnRateChange={handleSpawnRateChange}
                onModeChange={handleModeChange}
                onMinGreenChange={handleMinGreenChange}
                onMaxGreenChange={handleMaxGreenChange}
                onSurgeTraffic={handleSurgeTraffic}
              />

              {/* SECTION 10: Live Performance Metrics */}
              <TrafficStats stats={stats} />

              {/* Compact System Specifications Card */}
              <div className="p-3.5 rounded-xl bg-[#0D3031] border border-[#1B5655] flex flex-col gap-2 text-xs font-mono shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1B5655]/80 pb-2">
                  <div className="flex items-center gap-1.5 text-[#E8F5F2] font-semibold">
                    <Cpu className="w-3.5 h-3.5 text-[#10D6A0]" />
                    <span className="uppercase text-[11px] tracking-wider">System Specifications</span>
                  </div>
                  <span className="text-[10px] text-[#10D6A0] font-bold flex items-center gap-1 bg-[#092526] px-2 py-0.5 rounded border border-[#1B5655]">
                    <CheckCircle2 className="w-3 h-3 text-[#10D6A0]" />
                    ACTIVE INTERLOCK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8BAFAC] pt-1">
                  <div>
                    <span>Car-Following:</span>{' '}
                    <strong className="text-[#E8F5F2]">IDM Kinematics</strong>
                  </div>
                  <div>
                    <span>Clearance Intervals:</span>{' '}
                    <strong className="text-[#E8F5F2]">3.0s Y / 1.0s AR</strong>
                  </div>
                  <div>
                    <span>Headway Discharge:</span>{' '}
                    <strong className="text-[#E8F5F2]">2.5s / vehicle</strong>
                  </div>
                  <div>
                    <span>Starvation Interlock:</span>{' '}
                    <strong className="text-[#10D6A0]">Guaranteed Next</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1B5655]/60 flex items-center justify-between text-[10px] text-[#8BAFAC]">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#12BFA5]" />
                    REST Ingestion: 1.5s Interval
                  </span>
                  <span className="flex items-center gap-1 text-[#10D6A0]">
                    <ShieldCheck className="w-3 h-3 text-[#10D6A0]" />
                    Zero Conflict Guarantee
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
