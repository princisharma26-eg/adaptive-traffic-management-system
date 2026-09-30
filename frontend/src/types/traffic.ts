export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

export type SignalColor = 'RED' | 'YELLOW' | 'GREEN';

export type VehicleState = 'APPROACHING' | 'DECELERATING' | 'WAITING' | 'CROSSING' | 'PASSED';

export interface TrafficSignalState {
  direction: Direction;
  color: SignalColor;
  remainingSeconds: number;
}

export type SignalMode = 'FIXED_TIME' | 'DENSITY_BASED';

export interface SignalPhaseInfo {
  activePhase: string;
  cycleElapsedSeconds: number;
  totalCycleSeconds: number;
  signals: Record<Direction, TrafficSignalState>;
  activeAlgorithm?: string;
  activeGreenDirection?: string;
  currentGreenDuration?: number;
  dominantDirection?: Direction;
}

export type VehicleType = 'car' | 'bus' | 'truck' | 'bike';

export interface Vehicle {
  id: string;
  type?: VehicleType;
  direction: Direction;
  lane: number;
  x: number;
  y: number;
  length: number;
  width: number;
  velocity: number;
  targetVelocity: number;
  acceleration: number;
  state: VehicleState;
  color: string;
  entryTime: number;
  waitTime: number;
  isBraking: boolean;
}

export interface SimulationConfig {
  northSouthGreenDuration: number;
  eastWestGreenDuration: number;
  yellowDuration: number;
  allRedDuration: number;
  spawnRatePerMinute: number;
  speedMultiplier: number;
  activeAlgorithm: string;
  minGreenDuration?: number;
  maxGreenDuration?: number;
}

export interface LiveStats {
  simulationTimeSeconds: number;
  totalSpawned: number;
  currentWaiting: number;
  totalPassed: number;
  waitingByDirection: Record<Direction, number>;
  passedByDirection: Record<Direction, number>;
  averageWaitTimeSeconds: number;
  maxWaitTimeSeconds: number;
  throughputPerMinute: number;
  fairnessIndex: number;
}
