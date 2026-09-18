import type { Direction, SignalColor, SimulationConfig, TrafficSignalState } from '../types/traffic';

export class TrafficSignalModel {
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: SimulationConfig): void {
    this.config = newConfig;
  }

  /**
   * Computes signal state locally using the exact same formula as the backend algorithm.
   */
  public computeSignals(elapsedSeconds: number): Record<Direction, TrafficSignalState> {
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
      nsColor = 'GREEN';
      ewColor = 'RED';
      nsRemaining = phase1End - cycleElapsed;
      ewRemaining = phase3End - cycleElapsed;
    } else if (cycleElapsed < phase2End) {
      nsColor = 'YELLOW';
      ewColor = 'RED';
      nsRemaining = phase2End - cycleElapsed;
      ewRemaining = phase3End - cycleElapsed;
    } else if (cycleElapsed < phase3End) {
      nsColor = 'RED';
      ewColor = 'RED';
      nsRemaining = totalCycle - cycleElapsed + phase1End;
      ewRemaining = phase3End - cycleElapsed;
    } else if (cycleElapsed < phase4End) {
      nsColor = 'RED';
      ewColor = 'GREEN';
      ewRemaining = phase4End - cycleElapsed;
      nsRemaining = totalCycle - cycleElapsed;
    } else if (cycleElapsed < phase5End) {
      nsColor = 'RED';
      ewColor = 'YELLOW';
      ewRemaining = phase5End - cycleElapsed;
      nsRemaining = totalCycle - cycleElapsed;
    } else {
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
}
