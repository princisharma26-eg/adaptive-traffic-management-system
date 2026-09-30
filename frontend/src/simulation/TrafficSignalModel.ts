import type { Direction, SignalColor, SimulationConfig, TrafficSignalState } from '../types/traffic';

export class TrafficSignalModel {
  private config: SimulationConfig;

  // Density-based state machine variables
  private currentPhase: string = 'NORTH_SOUTH_GREEN';
  private phaseStartTime: number = 0.0;
  private currentPhaseDuration: number = 30.0;
  private lastEvaluatedTime: number = -1.0;

  private nsConsecutiveGreens: number = 0;
  private ewConsecutiveGreens: number = 0;
  private nsStarvationCounter: number = 0;
  private ewStarvationCounter: number = 0;

  private activeGreenCorridor: string = 'NORTH_SOUTH';
  private dominantDirection: Direction = 'NORTH';
  private lastAllocatedGreenDuration: number = 30.0;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: SimulationConfig): void {
    this.config = newConfig;
  }

  public reset(): void {
    this.currentPhase = 'NORTH_SOUTH_GREEN';
    this.phaseStartTime = 0.0;
    this.currentPhaseDuration = 30.0;
    this.lastEvaluatedTime = -1.0;
    this.nsConsecutiveGreens = 0;
    this.ewConsecutiveGreens = 0;
    this.nsStarvationCounter = 0;
    this.ewStarvationCounter = 0;
    this.activeGreenCorridor = 'NORTH_SOUTH';
    this.dominantDirection = 'NORTH';
    this.lastAllocatedGreenDuration = 30.0;
  }

  public getActivePhase(): string {
    return this.currentPhase;
  }

  public getActiveGreenCorridor(): string {
    return this.activeGreenCorridor;
  }

  public getDominantDirection(): Direction {
    return this.dominantDirection;
  }

  public getCurrentGreenDuration(): number {
    return this.lastAllocatedGreenDuration;
  }

  /**
   * Computes dynamic green duration bounded by minGreen and maxGreen.
   */
  public calculateDynamicGreenDuration(queueCount: number): number {
    const minGreen = this.config.minGreenDuration && this.config.minGreenDuration > 0
      ? this.config.minGreenDuration
      : 10.0;
    const maxGreen = this.config.maxGreenDuration && this.config.maxGreenDuration >= minGreen
      ? this.config.maxGreenDuration
      : 40.0;
    const calculated = minGreen + Math.max(0, queueCount) * 2.5;
    return Math.min(maxGreen, Math.max(minGreen, calculated));
  }

  /**
   * Computes signal state locally based on active algorithm mode.
   */
  public computeSignals(
    elapsedSeconds: number,
    waitingCounts?: Record<Direction, number>
  ): Record<Direction, TrafficSignalState> {
    if (this.config.activeAlgorithm === 'DENSITY_BASED') {
      return this.computeDensityBasedSignals(elapsedSeconds, waitingCounts);
    }
    return this.computeFixedTimeSignals(elapsedSeconds);
  }

  /**
   * Fixed-Time Phase 1 algorithm calculation.
   */
  public computeFixedTimeSignals(elapsedSeconds: number): Record<Direction, TrafficSignalState> {
    const nsGreen = this.config.northSouthGreenDuration;
    const yellow = this.config.yellowDuration;
    const allRed = this.config.allRedDuration;
    const ewGreen = this.config.eastWestGreenDuration;

    const phase1End = nsGreen;
    const phase2End = phase1End + yellow;
    const phase3End = phase2End + allRed;
    const phase4End = phase3End + ewGreen;
    const phase5End = phase4End + yellow;
    const totalCycle = phase5End + allRed;

    const cycleElapsed = totalCycle > 0 ? (elapsedSeconds % totalCycle) : 0;

    let nsColor: SignalColor;
    let ewColor: SignalColor;
    let nsRemaining: number;
    let ewRemaining: number;

    if (cycleElapsed < phase1End) {
      this.currentPhase = 'NORTH_SOUTH_GREEN';
      this.activeGreenCorridor = 'NORTH_SOUTH';
      this.lastAllocatedGreenDuration = nsGreen;
      nsColor = 'GREEN';
      ewColor = 'RED';
      nsRemaining = phase1End - cycleElapsed;
      ewRemaining = phase3End - cycleElapsed;
    } else if (cycleElapsed < phase2End) {
      this.currentPhase = 'NORTH_SOUTH_YELLOW';
      nsColor = 'YELLOW';
      ewColor = 'RED';
      nsRemaining = phase2End - cycleElapsed;
      ewRemaining = phase3End - cycleElapsed;
    } else if (cycleElapsed < phase3End) {
      this.currentPhase = 'ALL_RED_1';
      nsColor = 'RED';
      ewColor = 'RED';
      nsRemaining = totalCycle - cycleElapsed + phase1End;
      ewRemaining = phase3End - cycleElapsed;
    } else if (cycleElapsed < phase4End) {
      this.currentPhase = 'EAST_WEST_GREEN';
      this.activeGreenCorridor = 'EAST_WEST';
      this.lastAllocatedGreenDuration = ewGreen;
      nsColor = 'RED';
      ewColor = 'GREEN';
      ewRemaining = phase4End - cycleElapsed;
      nsRemaining = totalCycle - cycleElapsed;
    } else if (cycleElapsed < phase5End) {
      this.currentPhase = 'EAST_WEST_YELLOW';
      nsColor = 'RED';
      ewColor = 'YELLOW';
      ewRemaining = phase5End - cycleElapsed;
      nsRemaining = totalCycle - cycleElapsed;
    } else {
      this.currentPhase = 'ALL_RED_2';
      nsColor = 'RED';
      ewColor = 'RED';
      ewRemaining = phase3End + (totalCycle - cycleElapsed);
      nsRemaining = totalCycle - cycleElapsed;
    }

    const round1 = (val: number) => Math.round(Math.max(0, val) * 10) / 10;

    return {
      NORTH: { direction: 'NORTH', color: nsColor, remainingSeconds: round1(nsRemaining) },
      SOUTH: { direction: 'SOUTH', color: nsColor, remainingSeconds: round1(nsRemaining) },
      EAST:  { direction: 'EAST',  color: ewColor, remainingSeconds: round1(ewRemaining) },
      WEST:  { direction: 'WEST',  color: ewColor, remainingSeconds: round1(ewRemaining) },
    };
  }

  /**
   * Density-Based Phase 2 algorithm calculation.
   */
  public computeDensityBasedSignals(
    elapsedSeconds: number,
    waitingCounts?: Record<Direction, number>
  ): Record<Direction, TrafficSignalState> {
    if (elapsedSeconds < this.lastEvaluatedTime - 1.0) {
      this.reset();
    }

    const counts = waitingCounts || { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 };

    if (this.lastEvaluatedTime < 0) {
      const nsDemand = Math.max(counts.NORTH, counts.SOUTH);
      this.currentPhaseDuration = this.calculateDynamicGreenDuration(nsDemand);
      this.lastAllocatedGreenDuration = this.currentPhaseDuration;
    }
    this.lastEvaluatedTime = elapsedSeconds;

    this.advanceStateMachine(elapsedSeconds, counts);

    const phaseElapsed = Math.max(0.0, elapsedSeconds - this.phaseStartTime);
    const phaseRemaining = Math.max(0.0, this.currentPhaseDuration - phaseElapsed);

    const yellow = this.config.yellowDuration > 0 ? this.config.yellowDuration : 3.0;
    const allRed = this.config.allRedDuration > 0 ? this.config.allRedDuration : 1.0;

    let nsColor: SignalColor;
    let ewColor: SignalColor;
    let nsRemaining: number;
    let ewRemaining: number;

    switch (this.currentPhase) {
      case 'NORTH_SOUTH_GREEN':
        nsColor = 'GREEN';
        ewColor = 'RED';
        nsRemaining = phaseRemaining;
        ewRemaining = phaseRemaining + yellow + allRed;
        break;
      case 'NORTH_SOUTH_YELLOW':
        nsColor = 'YELLOW';
        ewColor = 'RED';
        nsRemaining = phaseRemaining;
        ewRemaining = phaseRemaining + allRed;
        break;
      case 'ALL_RED_1':
        nsColor = 'RED';
        ewColor = 'RED';
        nsRemaining = phaseRemaining + 30.0;
        ewRemaining = phaseRemaining;
        break;
      case 'EAST_WEST_GREEN':
        nsColor = 'RED';
        ewColor = 'GREEN';
        ewRemaining = phaseRemaining;
        nsRemaining = phaseRemaining + yellow + allRed;
        break;
      case 'EAST_WEST_YELLOW':
        nsColor = 'RED';
        ewColor = 'YELLOW';
        ewRemaining = phaseRemaining;
        nsRemaining = phaseRemaining + allRed;
        break;
      case 'ALL_RED_2':
      default:
        nsColor = 'RED';
        ewColor = 'RED';
        ewRemaining = phaseRemaining + 30.0;
        nsRemaining = phaseRemaining;
        break;
    }

    const round1 = (val: number) => Math.round(Math.max(0, val) * 10) / 10;

    return {
      NORTH: { direction: 'NORTH', color: nsColor, remainingSeconds: round1(nsRemaining) },
      SOUTH: { direction: 'SOUTH', color: nsColor, remainingSeconds: round1(nsRemaining) },
      EAST:  { direction: 'EAST',  color: ewColor, remainingSeconds: round1(ewRemaining) },
      WEST:  { direction: 'WEST',  color: ewColor, remainingSeconds: round1(ewRemaining) },
    };
  }

  private advanceStateMachine(targetTime: number, counts: Record<Direction, number>): void {
    const yellow = this.config.yellowDuration > 0 ? this.config.yellowDuration : 3.0;
    const allRed = this.config.allRedDuration > 0 ? this.config.allRedDuration : 1.0;

    let safety = 0;
    while (targetTime >= this.phaseStartTime + this.currentPhaseDuration && safety < 100) {
      safety++;
      const transitionTime = this.phaseStartTime + this.currentPhaseDuration;

      switch (this.currentPhase) {
        case 'NORTH_SOUTH_GREEN':
          this.currentPhase = 'NORTH_SOUTH_YELLOW';
          this.phaseStartTime = transitionTime;
          this.currentPhaseDuration = yellow;
          break;
        case 'NORTH_SOUTH_YELLOW':
          this.currentPhase = 'ALL_RED_1';
          this.phaseStartTime = transitionTime;
          this.currentPhaseDuration = allRed;
          break;
        case 'ALL_RED_1':
          this.transitionToNextGreenCorridor(transitionTime, counts, 'ALL_RED_1');
          break;
        case 'EAST_WEST_GREEN':
          this.currentPhase = 'EAST_WEST_YELLOW';
          this.phaseStartTime = transitionTime;
          this.currentPhaseDuration = yellow;
          break;
        case 'EAST_WEST_YELLOW':
          this.currentPhase = 'ALL_RED_2';
          this.phaseStartTime = transitionTime;
          this.currentPhaseDuration = allRed;
          break;
        case 'ALL_RED_2':
          this.transitionToNextGreenCorridor(transitionTime, counts, 'ALL_RED_2');
          break;
      }
    }
  }

  private transitionToNextGreenCorridor(
    transitionTime: number,
    counts: Record<Direction, number>,
    fromAllRed: string
  ): void {
    const northWaiting = counts.NORTH || 0;
    const southWaiting = counts.SOUTH || 0;
    const eastWaiting = counts.EAST || 0;
    const westWaiting = counts.WEST || 0;

    const nsDemand = Math.max(northWaiting, southWaiting);
    const ewDemand = Math.max(eastWaiting, westWaiting);

    this.dominantDirection = this.findDominant(northWaiting, southWaiting, eastWaiting, westWaiting);

    let chooseNs: boolean;

    // Starvation prevention
    if (this.ewStarvationCounter >= 1 && ewDemand > 0) {
      chooseNs = false;
    } else if (this.nsStarvationCounter >= 1 && nsDemand > 0) {
      chooseNs = true;
    } else if (fromAllRed === 'ALL_RED_1') {
      if (ewDemand > 0) {
        chooseNs = false;
      } else if (nsDemand > 0) {
        chooseNs = true;
      } else {
        chooseNs = false;
      }
    } else {
      if (nsDemand > 0) {
        chooseNs = true;
      } else if (ewDemand > 0) {
        chooseNs = false;
      } else {
        chooseNs = true;
      }
    }

    if (chooseNs && this.nsConsecutiveGreens >= 2 && ewDemand > 0) {
      chooseNs = false;
    } else if (!chooseNs && this.ewConsecutiveGreens >= 2 && nsDemand > 0) {
      chooseNs = true;
    }

    if (chooseNs) {
      this.currentPhase = 'NORTH_SOUTH_GREEN';
      this.activeGreenCorridor = 'NORTH_SOUTH';
      const duration = this.calculateDynamicGreenDuration(nsDemand);
      this.currentPhaseDuration = duration;
      this.lastAllocatedGreenDuration = duration;
      this.phaseStartTime = transitionTime;

      this.nsConsecutiveGreens++;
      this.ewConsecutiveGreens = 0;

      if (ewDemand > 0) {
        this.ewStarvationCounter++;
      } else {
        this.ewStarvationCounter = 0;
      }
      this.nsStarvationCounter = 0;
    } else {
      this.currentPhase = 'EAST_WEST_GREEN';
      this.activeGreenCorridor = 'EAST_WEST';
      const duration = this.calculateDynamicGreenDuration(ewDemand);
      this.currentPhaseDuration = duration;
      this.lastAllocatedGreenDuration = duration;
      this.phaseStartTime = transitionTime;

      this.ewConsecutiveGreens++;
      this.nsConsecutiveGreens = 0;

      if (nsDemand > 0) {
        this.nsStarvationCounter++;
      } else {
        this.nsStarvationCounter = 0;
      }
      this.ewStarvationCounter = 0;
    }
  }

  private findDominant(n: number, s: number, e: number, w: number): Direction {
    let max = n;
    let dom: Direction = 'NORTH';
    if (s > max) {
      max = s;
      dom = 'SOUTH';
    }
    if (e > max) {
      max = e;
      dom = 'EAST';
    }
    if (w > max) {
      dom = 'WEST';
    }
    return dom;
  }
}
