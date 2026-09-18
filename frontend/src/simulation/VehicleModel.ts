import type { Direction, Vehicle } from '../types/traffic';
import {
  APPROACH_LANES,
  CANVAS_SIZE,
  CRUISE_VELOCITY,
  VEHICLE_LENGTH,
  VEHICLE_PALETTE,
  VEHICLE_WIDTH,
} from './constants';

export class VehicleFactory {
  private static idCounter = 1;

  public static createVehicle(direction: Direction, currentTime: number): Vehicle {
    const lanePos = APPROACH_LANES[direction];
    let initialX = lanePos.x;
    let initialY = lanePos.y;

    // Offset spawn position outside viewport slightly so vehicles smoothly drive in
    const halfLen = VEHICLE_LENGTH / 2;
    switch (direction) {
      case 'NORTH':
        initialY = -halfLen;
        break;
      case 'SOUTH':
        initialY = CANVAS_SIZE + halfLen;
        break;
      case 'EAST':
        initialX = CANVAS_SIZE + halfLen;
        break;
      case 'WEST':
        initialX = -halfLen;
        break;
    }

    const randomColor = VEHICLE_PALETTE[Math.floor(Math.random() * VEHICLE_PALETTE.length)];
    // Slight variation in cruise velocity (90 - 110 px/s) for realistic traffic heterogeneity
    const variation = (Math.random() - 0.5) * 20;
    const targetVelocity = CRUISE_VELOCITY + variation;

    return {
      id: `v-${direction.charAt(0)}-${this.idCounter++}`,
      direction,
      lane: 0,
      x: initialX,
      y: initialY,
      length: VEHICLE_LENGTH,
      width: VEHICLE_WIDTH,
      velocity: targetVelocity * 0.7, // initial entry velocity
      targetVelocity,
      acceleration: 0,
      state: 'APPROACHING',
      color: randomColor,
      entryTime: currentTime,
      waitTime: 0,
      isBraking: false,
    };
  }

  /**
   * Check if vehicle has completely exited the canvas
   */
  public static isOutOfBounds(vehicle: Vehicle): boolean {
    const margin = VEHICLE_LENGTH + 20;
    return (
      vehicle.x < -margin ||
      vehicle.x > CANVAS_SIZE + margin ||
      vehicle.y < -margin ||
      vehicle.y > CANVAS_SIZE + margin
    );
  }
}
