import React, { useEffect, useRef } from 'react';
import {
  CANVAS_SIZE,
  CENTER,
  HALF_ROAD,
  INTERSECTION_BOUNDS,
  LANE_WIDTH,
  ROAD_WIDTH,
  STOP_LINES,
  VEHICLE_LENGTH,
  VEHICLE_WIDTH,
} from '../simulation/constants';
import type { Direction, TrafficSignalState, Vehicle } from '../types/traffic';

interface TrafficCanvasProps {
  vehicles: Vehicle[];
  signals: Record<Direction, TrafficSignalState>;
}

export const TrafficCanvas: React.FC<TrafficCanvasProps> = ({ vehicles, signals }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays for crisp vector rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    renderScene(ctx);
  }, [vehicles, signals]);

  const renderScene = (ctx: CanvasRenderingContext2D) => {
    // 1. Clear background (Terrain / grass / city block background)
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Decorative grid pattern for city blocks
    drawCityBlocks(ctx);

    // 2. Draw Roads (Asphalt)
    drawRoads(ctx);

    // 3. Draw Road Markings (Crosswalks, Stop Lines, Lane Dividers, Arrows)
    drawRoadMarkings(ctx);

    // 4. Draw Traffic Signals at intersection corners
    drawTrafficSignals(ctx);

    // 5. Draw Vehicles
    drawVehicles(ctx);
  };

  const drawCityBlocks = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0f172a';
    // Top-Left block
    ctx.fillRect(10, 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);
    // Top-Right block
    ctx.fillRect(CENTER + HALF_ROAD + 10, 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);
    // Bottom-Left block
    ctx.fillRect(10, CENTER + HALF_ROAD + 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);
    // Bottom-Right block
    ctx.fillRect(CENTER + HALF_ROAD + 10, CENTER + HALF_ROAD + 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);

    // Subtle sidewalks
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);
    ctx.strokeRect(CENTER + HALF_ROAD + 10, 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);
    ctx.strokeRect(10, CENTER + HALF_ROAD + 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);
    ctx.strokeRect(CENTER + HALF_ROAD + 10, CENTER + HALF_ROAD + 10, CENTER - HALF_ROAD - 20, CENTER - HALF_ROAD - 20);
  };

  const drawRoads = (ctx: CanvasRenderingContext2D) => {
    // Asphalt color
    ctx.fillStyle = '#1e293b';

    // Vertical Road (North - South)
    ctx.fillRect(CENTER - HALF_ROAD, 0, ROAD_WIDTH, CANVAS_SIZE);

    // Horizontal Road (East - West)
    ctx.fillRect(0, CENTER - HALF_ROAD, CANVAS_SIZE, ROAD_WIDTH);

    // Road curb borders
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    // Top-Left corners
    ctx.beginPath();
    ctx.moveTo(0, CENTER - HALF_ROAD);
    ctx.lineTo(CENTER - HALF_ROAD, CENTER - HALF_ROAD);
    ctx.lineTo(CENTER - HALF_ROAD, 0);
    ctx.stroke();

    // Top-Right corners
    ctx.beginPath();
    ctx.moveTo(CENTER + HALF_ROAD, 0);
    ctx.lineTo(CENTER + HALF_ROAD, CENTER - HALF_ROAD);
    ctx.lineTo(CANVAS_SIZE, CENTER - HALF_ROAD);
    ctx.stroke();

    // Bottom-Left corners
    ctx.beginPath();
    ctx.moveTo(0, CENTER + HALF_ROAD);
    ctx.lineTo(CENTER - HALF_ROAD, CENTER + HALF_ROAD);
    ctx.lineTo(CENTER - HALF_ROAD, CANVAS_SIZE);
    ctx.stroke();

    // Bottom-Right corners
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE, CENTER + HALF_ROAD);
    ctx.lineTo(CENTER + HALF_ROAD, CENTER + HALF_ROAD);
    ctx.lineTo(CENTER + HALF_ROAD, CANVAS_SIZE);
    ctx.stroke();
  };

  const drawRoadMarkings = (ctx: CanvasRenderingContext2D) => {
    // Yellow dashed center dividers
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);

    // North approach center line
    ctx.beginPath();
    ctx.moveTo(CENTER, 0);
    ctx.lineTo(CENTER, INTERSECTION_BOUNDS.minY - 25);
    ctx.stroke();

    // South approach center line
    ctx.beginPath();
    ctx.moveTo(CENTER, INTERSECTION_BOUNDS.maxY + 25);
    ctx.lineTo(CENTER, CANVAS_SIZE);
    ctx.stroke();

    // West approach center line
    ctx.beginPath();
    ctx.moveTo(0, CENTER);
    ctx.lineTo(INTERSECTION_BOUNDS.minX - 25, CENTER);
    ctx.stroke();

    // East approach center line
    ctx.beginPath();
    ctx.moveTo(INTERSECTION_BOUNDS.maxX + 25, CENTER);
    ctx.lineTo(CANVAS_SIZE, CENTER);
    ctx.stroke();

    // Reset dash
    ctx.setLineDash([]);

    // Solid White Stop Lines
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;

    // North Stop Line (across incoming lane x: 290 to 350)
    ctx.beginPath();
    ctx.moveTo(CENTER - HALF_ROAD, STOP_LINES.NORTH);
    ctx.lineTo(CENTER, STOP_LINES.NORTH);
    ctx.stroke();

    // South Stop Line (across incoming lane x: 350 to 410)
    ctx.beginPath();
    ctx.moveTo(CENTER, STOP_LINES.SOUTH);
    ctx.lineTo(CENTER + HALF_ROAD, STOP_LINES.SOUTH);
    ctx.stroke();

    // East Stop Line (across incoming lane y: 290 to 350)
    ctx.beginPath();
    ctx.moveTo(STOP_LINES.EAST, CENTER - HALF_ROAD);
    ctx.lineTo(STOP_LINES.EAST, CENTER);
    ctx.stroke();

    // West Stop Line (across incoming lane y: 350 to 410)
    ctx.beginPath();
    ctx.moveTo(STOP_LINES.WEST, CENTER);
    ctx.lineTo(STOP_LINES.WEST, CENTER + HALF_ROAD);
    ctx.stroke();

    // Zebra Crosswalks
    drawZebraCrosswalk(ctx, 'NORTH');
    drawZebraCrosswalk(ctx, 'SOUTH');
    drawZebraCrosswalk(ctx, 'EAST');
    drawZebraCrosswalk(ctx, 'WEST');

    // Directional Lane Arrows
    drawLaneArrows(ctx);
  };

  const drawZebraCrosswalk = (ctx: CanvasRenderingContext2D, dir: Direction) => {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.35)';
    const stripeWidth = 6;
    const stripeGap = 6;

    if (dir === 'NORTH') {
      const y = INTERSECTION_BOUNDS.minY - 8;
      for (let x = CENTER - HALF_ROAD + 4; x < CENTER + HALF_ROAD - 4; x += stripeWidth + stripeGap) {
        ctx.fillRect(x, y - 10, stripeWidth, 10);
      }
    } else if (dir === 'SOUTH') {
      const y = INTERSECTION_BOUNDS.maxY + 8;
      for (let x = CENTER - HALF_ROAD + 4; x < CENTER + HALF_ROAD - 4; x += stripeWidth + stripeGap) {
        ctx.fillRect(x, y, stripeWidth, 10);
      }
    } else if (dir === 'WEST') {
      const x = INTERSECTION_BOUNDS.minX - 8;
      for (let y = CENTER - HALF_ROAD + 4; y < CENTER + HALF_ROAD - 4; y += stripeWidth + stripeGap) {
        ctx.fillRect(x - 10, y, 10, stripeWidth);
      }
    } else if (dir === 'EAST') {
      const x = INTERSECTION_BOUNDS.maxX + 8;
      for (let y = CENTER - HALF_ROAD + 4; y < CENTER + HALF_ROAD - 4; y += stripeWidth + stripeGap) {
        ctx.fillRect(x, y, 10, stripeWidth);
      }
    }
  };

  const drawLaneArrows = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

    // North approach arrow (pointing downwards)
    drawArrow(ctx, CENTER - LANE_WIDTH / 2, STOP_LINES.NORTH - 45, Math.PI);

    // South approach arrow (pointing upwards)
    drawArrow(ctx, CENTER + LANE_WIDTH / 2, STOP_LINES.SOUTH + 45, 0);

    // East approach arrow (pointing leftwards)
    drawArrow(ctx, STOP_LINES.EAST + 45, CENTER - LANE_WIDTH / 2, -Math.PI / 2);

    // West approach arrow (pointing rightwards)
    drawArrow(ctx, STOP_LINES.WEST - 45, CENTER + LANE_WIDTH / 2, Math.PI / 2);
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(6, -2);
    ctx.lineTo(2, -2);
    ctx.lineTo(2, 12);
    ctx.lineTo(-2, 12);
    ctx.lineTo(-2, -2);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawTrafficSignals = (ctx: CanvasRenderingContext2D) => {
    // 4 Traffic signal head housings situated at corner curbs
    const signalPositions: Record<Direction, { x: number; y: number; angle: number }> = {
      NORTH: { x: CENTER - HALF_ROAD - 18, y: STOP_LINES.NORTH + 5, angle: 0 },
      SOUTH: { x: CENTER + HALF_ROAD + 18, y: STOP_LINES.SOUTH - 5, angle: Math.PI },
      EAST:  { x: STOP_LINES.EAST - 5, y: CENTER - HALF_ROAD - 18, angle: Math.PI / 2 },
      WEST:  { x: STOP_LINES.WEST + 5, y: CENTER + HALF_ROAD + 18, angle: -Math.PI / 2 },
    };

    (Object.keys(signals) as Direction[]).forEach((dir) => {
      const pos = signalPositions[dir];
      const sig = signals[dir];
      drawSignalHead(ctx, pos.x, pos.y, sig.color, sig.remainingSeconds, dir);
    });
  };

  const drawSignalHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: 'RED' | 'YELLOW' | 'GREEN',
    remaining: number,
    label: string
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Housing background
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-12, -26, 24, 52, 6);
    ctx.fill();
    ctx.stroke();

    // Three lenses: Red (top), Yellow (mid), Green (bottom)
    const lamps = [
      { c: 'RED', y: -16, activeColor: '#ef4444', dimColor: '#450a0a' },
      { c: 'YELLOW', y: 0, activeColor: '#eab308', dimColor: '#422006' },
      { c: 'GREEN', y: 16, activeColor: '#22c55e', dimColor: '#052e16' },
    ];

    lamps.forEach((lamp) => {
      const isActive = lamp.c === color;
      ctx.beginPath();
      ctx.arc(0, lamp.y, 6, 0, Math.PI * 2);

      if (isActive) {
        // Glowing bloom
        ctx.shadowColor = lamp.activeColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = lamp.activeColor;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      } else {
        ctx.fillStyle = lamp.dimColor;
        ctx.fill();
      }
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Direction label & countdown badge
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${label.charAt(0)}: ${remaining.toFixed(0)}s`, 0, 36);

    ctx.restore();
  };

  const drawVehicles = (ctx: CanvasRenderingContext2D) => {
    vehicles.forEach((vehicle) => {
      ctx.save();
      ctx.translate(vehicle.x, vehicle.y);

      // Rotate canvas according to travel direction
      let rotation = 0;
      switch (vehicle.direction) {
        case 'NORTH':
          rotation = Math.PI; // Heading downwards (+y)
          break;
        case 'SOUTH':
          rotation = 0; // Heading upwards (-y)
          break;
        case 'EAST':
          rotation = -Math.PI / 2; // Heading leftwards (-x)
          break;
        case 'WEST':
          rotation = Math.PI / 2; // Heading rightwards (+x)
          break;
      }
      ctx.rotate(rotation);

      const halfW = VEHICLE_WIDTH / 2;
      const halfL = VEHICLE_LENGTH / 2;

      // Drop shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(-halfW + 1, -halfL + 2, VEHICLE_WIDTH, VEHICLE_LENGTH, 4);
      ctx.fill();

      // Main car body
      ctx.fillStyle = vehicle.color;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfL, VEHICLE_WIDTH, VEHICLE_LENGTH, 4);
      ctx.fill();

      // Windshield & windows
      ctx.fillStyle = '#0f172a';
      // Front windshield (closer to front, which is -halfL in local rotated coordinates)
      ctx.fillRect(-halfW + 2, -halfL + 6, VEHICLE_WIDTH - 4, 4);
      // Rear window
      ctx.fillRect(-halfW + 2, halfL - 8, VEHICLE_WIDTH - 4, 3);
      // Roof contour
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(-halfW + 2, -halfL + 11, VEHICLE_WIDTH - 4, 5);

      // Headlights (Front is -halfL)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-halfW + 3, -halfL + 1, 2, 0, Math.PI * 2);
      ctx.arc(halfW - 3, -halfL + 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // Brake lights (Rear is +halfL)
      if (vehicle.isBraking || vehicle.state === 'WAITING') {
        // Bright glowing brake lights
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-halfW + 1, halfL - 2, 3, 2);
        ctx.fillRect(halfW - 4, halfL - 2, 3, 2);
        ctx.shadowBlur = 0;
      } else {
        // Normal dim taillights
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-halfW + 1, halfL - 2, 3, 2);
        ctx.fillRect(halfW - 4, halfL - 2, 3, 2);
      }

      ctx.restore();
    });
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-950 flex items-center justify-center p-3">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        className="rounded-xl block bg-slate-950 shadow-inner"
      />
    </div>
  );
};
