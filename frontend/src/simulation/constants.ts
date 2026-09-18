import type { Direction } from '../types/traffic';

export const CANVAS_SIZE = 700;
export const CENTER = CANVAS_SIZE / 2; // 350

// Road geometry
export const ROAD_WIDTH = 120;
export const HALF_ROAD = ROAD_WIDTH / 2; // 60
export const LANE_WIDTH = HALF_ROAD; // 60

export const INTERSECTION_BOUNDS = {
  minX: CENTER - HALF_ROAD, // 290
  maxX: CENTER + HALF_ROAD, // 410
  minY: CENTER - HALF_ROAD, // 290
  maxY: CENTER + HALF_ROAD, // 410
};

// Stop lines for incoming vehicles
export const STOP_LINES: Record<Direction, number> = {
  NORTH: INTERSECTION_BOUNDS.minY - 10, // y = 280
  SOUTH: INTERSECTION_BOUNDS.maxY + 10, // y = 420
  EAST: INTERSECTION_BOUNDS.maxX + 10,  // x = 420
  WEST: INTERSECTION_BOUNDS.minX - 10,  // x = 280
};

// Lane center coordinates for incoming approach
export const APPROACH_LANES: Record<Direction, { x: number; y: number }> = {
  NORTH: { x: CENTER - LANE_WIDTH / 2, y: 0 },             // x = 320, travels +y
  SOUTH: { x: CENTER + LANE_WIDTH / 2, y: CANVAS_SIZE },   // x = 380, travels -y
  EAST:  { x: CANVAS_SIZE, y: CENTER - LANE_WIDTH / 2 },   // y = 320, travels -x
  WEST:  { x: 0, y: CENTER + LANE_WIDTH / 2 },             // y = 380, travels +x
};

// Vehicle physics parameters
export const VEHICLE_LENGTH = 28;
export const VEHICLE_WIDTH = 15;
export const MIN_GAP = 16; // Standstill bumper-to-bumper gap
export const CRUISE_VELOCITY = 100; // px/sec
export const MAX_ACCELERATION = 90; // px/sec^2
export const COMFORT_DECELERATION = 140; // px/sec^2
export const HARD_BRAKING_DECELERATION = 220; // px/sec^2

// Palette of vehicle colors
export const VEHICLE_PALETTE = [
  '#3b82f6', // Electric Blue
  '#ef4444', // Crimson Red
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Orange
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#e2e8f0', // Slate White
  '#64748b', // Steel Grey
];
