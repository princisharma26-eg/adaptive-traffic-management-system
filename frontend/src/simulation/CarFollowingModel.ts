import type { SignalColor, Vehicle } from '../types/traffic';
import {
  COMFORT_DECELERATION,
  CRUISE_VELOCITY,
  HARD_BRAKING_DECELERATION,
  MAX_ACCELERATION,
  MIN_GAP,
  STOP_LINES,
  VEHICLE_LENGTH,
} from './constants';

export class CarFollowingModel {
  /**
   * Calculates the target acceleration for a vehicle using the Intelligent Driver Model (IDM)
   * factoring both the leading vehicle (if present) and the red light stop line virtual barrier.
   */
  public static calculateAcceleration(
    vehicle: Vehicle,
    leadVehicle: Vehicle | null,
    signalColor: SignalColor
  ): { acceleration: number; isBraking: boolean } {
    const v = Math.max(0, vehicle.velocity);
    const v0 = vehicle.targetVelocity || CRUISE_VELOCITY;
    const a = MAX_ACCELERATION;
    const b = COMFORT_DECELERATION;
    const s0 = MIN_GAP;
    const T = 0.8; // safe time headway in seconds

    // Calculate physical gap to the lead vehicle (bumper-to-bumper)
    let leadGap = Infinity;
    let deltaVLead = 0;

    if (leadVehicle) {
      leadGap = this.getBumperToBumperGap(vehicle, leadVehicle);
      deltaVLead = v - leadVehicle.velocity;
    }

    // Calculate gap to stop line if signal is RED or YELLOW and vehicle has not yet passed stop line
    let stopLineGap = Infinity;
    const hasCrossedStopLine = this.hasCrossedStopLine(vehicle);

    if (!hasCrossedStopLine && (signalColor === 'RED' || signalColor === 'YELLOW')) {
      const distToStop = this.getDistanceToStopLine(vehicle);
      if (distToStop >= -5) {
        // Treat stop line as a stationary obstacle (velocity = 0)
        stopLineGap = Math.max(0, distToStop);
      }
    }

    // Effective gap is the nearest obstacle (lead car or red light)
    const effectiveGap = Math.min(leadGap, stopLineGap);
    const deltaV = effectiveGap === stopLineGap ? v : deltaVLead;

    // Free road acceleration component: a * (1 - (v / v0)^4)
    const freeRoadTerm = 1 - Math.pow(v / v0, 4);

    let interactionTerm = 0;
    if (Number.isFinite(effectiveGap) && effectiveGap > 0.1) {
      // IDM desired minimum gap
      const sStar = s0 + v * T + (v * deltaV) / (2 * Math.sqrt(a * b));
      interactionTerm = Math.pow(Math.max(0, sStar) / effectiveGap, 2);
    } else if (effectiveGap <= 0.1) {
      // Prevent overlapping: emergency stop
      return { acceleration: -HARD_BRAKING_DECELERATION, isBraking: true };
    }

    let targetAccel = a * (freeRoadTerm - interactionTerm);

    // Clamp acceleration boundaries
    targetAccel = Math.max(-HARD_BRAKING_DECELERATION, Math.min(a, targetAccel));

    // Determine brake light status
    const isBraking = targetAccel < -15 || (v < 2 && effectiveGap < 30);

    return { acceleration: targetAccel, isBraking };
  }

  /**
   * Returns bumper-to-bumper distance between following vehicle and lead vehicle
   */
  public static getBumperToBumperGap(follower: Vehicle, leader: Vehicle): number {
    const halfLen = VEHICLE_LENGTH / 2;
    switch (follower.direction) {
      case 'NORTH': // Moving downwards (+y)
        return (leader.y - halfLen) - (follower.y + halfLen);
      case 'SOUTH': // Moving upwards (-y)
        return (follower.y - halfLen) - (leader.y + halfLen);
      case 'EAST': // Moving leftwards (-x)
        return (follower.x - halfLen) - (leader.x + halfLen);
      case 'WEST': // Moving rightwards (+x)
        return (leader.x - halfLen) - (follower.x + halfLen);
    }
  }

  /**
   * Returns distance from vehicle front bumper to the directional stop line
   */
  public static getDistanceToStopLine(vehicle: Vehicle): number {
    const halfLen = VEHICLE_LENGTH / 2;
    const stopCoord = STOP_LINES[vehicle.direction];

    switch (vehicle.direction) {
      case 'NORTH':
        return stopCoord - (vehicle.y + halfLen);
      case 'SOUTH':
        return (vehicle.y - halfLen) - stopCoord;
      case 'EAST':
        return (vehicle.x - halfLen) - stopCoord;
      case 'WEST':
        return stopCoord - (vehicle.x + halfLen);
    }
  }

  /**
   * Checks if vehicle front bumper has crossed the intersection stop line
   */
  public static hasCrossedStopLine(vehicle: Vehicle): boolean {
    return this.getDistanceToStopLine(vehicle) < 0;
  }
}
