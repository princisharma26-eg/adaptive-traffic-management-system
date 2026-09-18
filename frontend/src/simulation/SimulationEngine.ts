import type { Direction, LiveStats, SimulationConfig, TrafficSignalState, Vehicle } from '../types/traffic';
import { CarFollowingModel } from './CarFollowingModel';
import { CANVAS_SIZE, MIN_GAP, VEHICLE_LENGTH } from './constants';
import { TrafficSignalModel } from './TrafficSignalModel';
import { VehicleFactory } from './VehicleModel';

export class SimulationEngine {
  private vehicles: Vehicle[] = [];
  private simulationTime: number = 0;
  private isRunning: boolean = false;
  private speedMultiplier: number = 1.0;
  private config: SimulationConfig;
  private signalModel: TrafficSignalModel;

  private totalSpawned: number = 0;
  private totalPassed: number = 0;
  private passedByDirection: Record<Direction, number> = {
    NORTH: 0,
    SOUTH: 0,
    EAST: 0,
    WEST: 0,
  };

  // Track spawn timestamps per approach to govern arrival headways
  private nextSpawnTime: Record<Direction, number> = {
    NORTH: 0,
    SOUTH: 0,
    EAST: 0,
    WEST: 0,
  };

  private currentSignals: Record<Direction, TrafficSignalState>;

  constructor(initialConfig: SimulationConfig) {
    this.config = initialConfig;
    this.signalModel = new TrafficSignalModel(initialConfig);
    this.currentSignals = this.signalModel.computeSignals(0);
    this.scheduleNextSpawns(0);
  }

  public updateConfig(newConfig: SimulationConfig): void {
    this.config = newConfig;
    this.signalModel.updateConfig(newConfig);
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.2, Math.min(5.0, multiplier));
  }

  public start(): void {
    this.isRunning = true;
  }

  public pause(): void {
    this.isRunning = false;
  }

  public reset(): void {
    this.isRunning = false;
    this.vehicles = [];
    this.simulationTime = 0;
    this.totalSpawned = 0;
    this.totalPassed = 0;
    this.passedByDirection = { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 };
    this.currentSignals = this.signalModel.computeSignals(0);
    this.scheduleNextSpawns(0);
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public getSimulationTime(): number {
    return this.simulationTime;
  }

  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public getSignals(): Record<Direction, TrafficSignalState> {
    return this.currentSignals;
  }

  /**
   * Primary simulation tick called on every animation frame.
   * dt: delta time in seconds (typically ~0.016s at 60 FPS)
   */
  public tick(dt: number): {
    vehicles: Vehicle[];
    signals: Record<Direction, TrafficSignalState>;
    stats: LiveStats;
  } {
    if (!this.isRunning) {
      return {
        vehicles: this.vehicles,
        signals: this.currentSignals,
        stats: this.calculateLiveStats(),
      };
    }

    // Clamp dt to avoid physics instability on tab switch
    const clampedDt = Math.min(dt, 0.1);
    const effectiveDt = clampedDt * this.speedMultiplier;

    this.simulationTime += effectiveDt;

    // 1. Update signals
    this.currentSignals = this.signalModel.computeSignals(this.simulationTime);

    // 2. Vehicle spawning logic per approach
    this.handleSpawning();

    // 3. Update vehicle kinematics by direction
    this.updateVehiclePhysics(effectiveDt);

    // 4. Remove vehicles that completely cleared the scene
    this.cullExitedVehicles();

    return {
      vehicles: this.vehicles,
      signals: this.currentSignals,
      stats: this.calculateLiveStats(),
    };
  }

  private handleSpawning(): void {
    const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

    for (const dir of directions) {
      if (this.simulationTime >= this.nextSpawnTime[dir]) {
        // Verify entrance area is clear to guarantee no spawn-collisions
        if (this.isEntranceClear(dir)) {
          const newCar = VehicleFactory.createVehicle(dir, this.simulationTime);
          this.vehicles.push(newCar);
          this.totalSpawned++;
        }
        // Schedule next spawn with realistic Poisson-distributed headway
        const avgInterval = 60 / (this.config.spawnRatePerMinute / 4);
        // Headway variance (minimum 2.0 seconds headway)
        const headway = 2.0 + Math.random() * avgInterval * 1.5;
        this.nextSpawnTime[dir] = this.simulationTime + headway;
      }
    }
  }

  /**
   * Ensures the incoming lane entrance has enough clearance before spawning
   */
  private isEntranceClear(direction: Direction): boolean {
    const minClearance = VEHICLE_LENGTH * 2.2 + MIN_GAP;

    for (const v of this.vehicles) {
      if (v.direction !== direction) continue;

      switch (direction) {
        case 'NORTH':
          if (v.y < minClearance) return false;
          break;
        case 'SOUTH':
          if (v.y > CANVAS_SIZE - minClearance) return false;
          break;
        case 'EAST':
          if (v.x > CANVAS_SIZE - minClearance) return false;
          break;
        case 'WEST':
          if (v.x < minClearance) return false;
          break;
      }
    }
    return true;
  }

  private scheduleNextSpawns(baseTime: number): void {
    this.nextSpawnTime = {
      NORTH: baseTime + Math.random() * 1.5,
      SOUTH: baseTime + Math.random() * 2.0,
      EAST:  baseTime + Math.random() * 1.8,
      WEST:  baseTime + Math.random() * 2.2,
    };
  }

  private updateVehiclePhysics(dt: number): void {
    const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

    for (const dir of directions) {
      // Filter vehicles belonging to this approach
      const dirVehicles = this.vehicles.filter((v) => v.direction === dir);

      // Sort vehicles in travel order: index 0 is closest to destination (furthest ahead)
      this.sortVehiclesByTravelOrder(dir, dirVehicles);

      for (let i = 0; i < dirVehicles.length; i++) {
        const vehicle = dirVehicles[i];
        // Lead vehicle is the vehicle directly ahead (i - 1)
        const leadVehicle = i > 0 ? dirVehicles[i - 1] : null;
        const signalColor = this.currentSignals[dir].color;

        // Calculate target acceleration using car following physics
        const { acceleration, isBraking } = CarFollowingModel.calculateAcceleration(
          vehicle,
          leadVehicle,
          signalColor
        );

        vehicle.acceleration = acceleration;
        vehicle.isBraking = isBraking;

        // Update velocity: v = v + a * dt
        vehicle.velocity = Math.max(0, vehicle.velocity + acceleration * dt);

        // Update position: pos = pos + v * dt
        const displacement = vehicle.velocity * dt;
        switch (dir) {
          case 'NORTH':
            vehicle.y += displacement;
            break;
          case 'SOUTH':
            vehicle.y -= displacement;
            break;
          case 'EAST':
            vehicle.x -= displacement;
            break;
          case 'WEST':
            vehicle.x += displacement;
            break;
        }

        // Update state and wait time
        const hasCrossed = CarFollowingModel.hasCrossedStopLine(vehicle);
        if (hasCrossed) {
          vehicle.state = 'CROSSING';
        } else if (vehicle.velocity < 1.0) {
          vehicle.state = 'WAITING';
          vehicle.waitTime += dt;
        } else if (vehicle.isBraking) {
          vehicle.state = 'DECELERATING';
        } else {
          vehicle.state = 'APPROACHING';
        }
      }
    }
  }

  private sortVehiclesByTravelOrder(direction: Direction, list: Vehicle[]): void {
    switch (direction) {
      case 'NORTH': // +y: largest y is further ahead
        list.sort((a, b) => b.y - a.y);
        break;
      case 'SOUTH': // -y: smallest y is further ahead
        list.sort((a, b) => a.y - b.y);
        break;
      case 'EAST': // -x: smallest x is further ahead
        list.sort((a, b) => a.x - b.x);
        break;
      case 'WEST': // +x: largest x is further ahead
        list.sort((a, b) => b.x - a.x);
        break;
    }
  }

  private cullExitedVehicles(): void {
    const remaining: Vehicle[] = [];
    for (const v of this.vehicles) {
      if (VehicleFactory.isOutOfBounds(v)) {
        this.totalPassed++;
        this.passedByDirection[v.direction] = (this.passedByDirection[v.direction] || 0) + 1;
      } else {
        remaining.push(v);
      }
    }
    this.vehicles = remaining;
  }

  /**
   * Computes true live statistics from actual active vehicle objects
   */
  public calculateLiveStats(): LiveStats {
    let currentWaiting = 0;
    const waitingByDirection: Record<Direction, number> = {
      NORTH: 0,
      SOUTH: 0,
      EAST: 0,
      WEST: 0,
    };

    let totalWaitAccrued = 0;
    let maxWait = 0;

    for (const v of this.vehicles) {
      if (v.state === 'WAITING') {
        currentWaiting++;
        waitingByDirection[v.direction] = (waitingByDirection[v.direction] || 0) + 1;
      }
      totalWaitAccrued += v.waitTime;
      if (v.waitTime > maxWait) {
        maxWait = v.waitTime;
      }
    }

    const totalSampleCount = this.vehicles.length + this.totalPassed;
    const avgWait = totalSampleCount > 0 ? totalWaitAccrued / Math.max(1, this.vehicles.length) : 0;

    const simMinutes = this.simulationTime / 60;
    const throughput = simMinutes > 0.05 ? this.totalPassed / simMinutes : 0;

    // Jain's fairness index across 4 directions
    const p = Object.values(this.passedByDirection);
    const sum = p.reduce((a, b) => a + b, 0);
    const sumSq = p.reduce((a, b) => a + b * b, 0);
    const fairness = sumSq > 0 ? (sum * sum) / (4 * sumSq) : 1.0;

    const round1 = (n: number) => Math.round(n * 10) / 10;
    const round2 = (n: number) => Math.round(n * 100) / 100;

    return {
      simulationTimeSeconds: round1(this.simulationTime),
      totalSpawned: this.totalSpawned,
      currentWaiting,
      totalPassed: this.totalPassed,
      waitingByDirection,
      passedByDirection: { ...this.passedByDirection },
      averageWaitTimeSeconds: round1(avgWait),
      maxWaitTimeSeconds: round1(maxWait),
      throughputPerMinute: round2(throughput),
      fairnessIndex: round2(fairness),
    };
  }
}
