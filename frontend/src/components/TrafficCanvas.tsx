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
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface TrafficCanvasProps {
  vehicles: Vehicle[];
  signals: Record<Direction, TrafficSignalState>;
}

// Fast deterministic pseudo-random hash for consistent organic variation per plant without runtime jitter
const treeHash = (x: number, y: number, seed: number = 0): number => {
  const val = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return val - Math.floor(val);
};

// Draw realistic top-down tree with irregular organic canopy, visible radiating branches, and directional lighting
const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.save();

  // Natural variation per tree based on its coordinate position
  const rotOffset = treeHash(x, y, 1) * Math.PI * 2;
  const lobeCount = 8 + Math.floor(treeHash(x, y, 2) * 4); // 8 to 11 irregular lobes
  const shadowOffsetX = r * 0.22;
  const shadowOffsetY = r * 0.26;

  // Precompute canopy lobes: angles, distances, radii, and positions
  interface CanopyLobe {
    lx: number;
    ly: number;
    lr: number;
    angle: number;
    sunDot: number; // dot product with sun direction (-0.707, -0.707)
  }

  const lobes: CanopyLobe[] = [];
  for (let i = 0; i < lobeCount; i++) {
    const baseAngle = rotOffset + (i * Math.PI * 2) / lobeCount;
    const angleJitter = (treeHash(x, y, 10 + i) - 0.5) * 0.35;
    const angle = baseAngle + angleJitter;
    const distRatio = 0.38 + treeHash(x, y, 20 + i) * 0.24; // 0.38 to 0.62 * r
    const lobeDist = r * distRatio;
    const lobeRadius = r * (0.38 + treeHash(x, y, 30 + i) * 0.2); // 0.38 to 0.58 * r
    const lx = x + Math.cos(angle) * lobeDist;
    const ly = y + Math.sin(angle) * lobeDist;
    // Direction vector towards sun (-1, -1) normalized
    const sunDot = -Math.cos(angle) * 0.707 - Math.sin(angle) * 0.707;
    lobes.push({ lx, ly, lr: lobeRadius, angle, sunDot });
  }

  // 1. Natural Organic Cast Shadow (matching irregular canopy shape thrown down-right)
  ctx.fillStyle = 'rgba(2, 14, 11, 0.42)';
  ctx.beginPath();
  // Central base shadow
  ctx.arc(x + shadowOffsetX, y + shadowOffsetY, r * 0.85, 0, Math.PI * 2);
  // Outer lobe shadows
  lobes.forEach((l) => {
    ctx.moveTo(l.lx + shadowOffsetX + l.lr, l.ly + shadowOffsetY);
    ctx.arc(l.lx + shadowOffsetX, l.ly + shadowOffsetY, l.lr, 0, Math.PI * 2);
  });
  ctx.fill();

  // 2. Deep Under-Canopy Ground Occlusion / Shadow Foundation
  ctx.fillStyle = '#062316';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
  lobes.forEach((l) => {
    ctx.moveTo(l.lx + l.lr, l.ly);
    ctx.arc(l.lx, l.ly, l.lr, 0, Math.PI * 2);
  });
  ctx.fill();

  // 3. Sub-Canopy Trunk Apex and Radiating Woody Limbs (visible in canopy crevices)
  const branchCount = 4 + Math.floor(treeHash(x, y, 3) * 3); // 4 to 6 main limbs
  ctx.strokeStyle = '#23150b';
  ctx.lineWidth = Math.max(1.8, r * 0.09);
  ctx.lineCap = 'round';

  for (let b = 0; b < branchCount; b++) {
    const branchAngle = rotOffset + (b * Math.PI * 2) / branchCount + (treeHash(x, y, 40 + b) - 0.5) * 0.4;
    const branchLen = r * (0.45 + treeHash(x, y, 50 + b) * 0.28);
    const endX = x + Math.cos(branchAngle) * branchLen;
    const endY = y + Math.sin(branchAngle) * branchLen;
    const midCurve = (treeHash(x, y, 60 + b) - 0.5) * r * 0.2;
    const midX = (x + endX) / 2 + Math.sin(branchAngle) * midCurve;
    const midY = (y + endY) / 2 - Math.cos(branchAngle) * midCurve;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    // Subtle smaller side twig
    if (treeHash(x, y, 70 + b) > 0.4) {
      const twigAngle = branchAngle + (treeHash(x, y, 80 + b) > 0.5 ? 0.45 : -0.45);
      const twigLen = branchLen * 0.45;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX + Math.cos(twigAngle) * twigLen, midY + Math.sin(twigAngle) * twigLen);
      ctx.strokeStyle = '#321f11';
      ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.stroke();
    }
  }

  // Central Trunk Crown Knot
  ctx.fillStyle = '#1c1008';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2.5, r * 0.12), 0, Math.PI * 2);
  ctx.fill();

  // 4. Main Canopy Foliage Masses (Multi-Tiered Organic Lobes with Sun Lighting)
  lobes.forEach((l) => {
    // Determine tone based on sun alignment (sun from top-left)
    let lobeBaseColor: string;
    let lobeMidColor: string;
    let lobeHighColor: string;

    if (l.sunDot > 0.3) {
      // Strongly sunlit lobe
      lobeBaseColor = '#155d3a';
      lobeMidColor = '#1c774b';
      lobeHighColor = '#279a61';
    } else if (l.sunDot > -0.2) {
      // Neutral / glancing light
      lobeBaseColor = '#10492e';
      lobeMidColor = '#15613c';
      lobeHighColor = '#1e7b4e';
    } else {
      // In shadow (bottom-right side of tree)
      lobeBaseColor = '#0a3520';
      lobeMidColor = '#0e442a';
      lobeHighColor = '#145737';
    }

    // Lobe base disk
    ctx.fillStyle = lobeBaseColor;
    ctx.beginPath();
    ctx.arc(l.lx, l.ly, l.lr, 0, Math.PI * 2);
    ctx.fill();

    // Lobe mid-level foliage puff
    ctx.fillStyle = lobeMidColor;
    ctx.beginPath();
    ctx.arc(l.lx - l.lr * 0.12, l.ly - l.lr * 0.12, l.lr * 0.82, 0, Math.PI * 2);
    ctx.fill();

    // Lobe top highlight crescent / puff (offset toward sun: top-left)
    ctx.fillStyle = lobeHighColor;
    ctx.beginPath();
    ctx.arc(l.lx - l.lr * 0.22, l.ly - l.lr * 0.22, l.lr * 0.55, 0, Math.PI * 2);
    ctx.fill();
  });

  // 5. Raised Crown Apex (Topmost Foliage Dome over Center)
  const crownX = x - r * 0.08;
  const crownY = y - r * 0.08;
  const crownPuffs = [
    { dx: -r * 0.15, dy: -r * 0.15, cr: r * 0.42, col: '#1e7e4e' },
    { dx: r * 0.12, dy: -r * 0.12, cr: r * 0.38, col: '#24905a' },
    { dx: 0, dy: 0, cr: r * 0.44, col: '#2ba468' },
    { dx: -r * 0.1, dy: -r * 0.12, cr: r * 0.32, col: '#38c57e' },
    { dx: -r * 0.08, dy: -r * 0.15, cr: r * 0.2, col: '#4de496' },
  ];

  crownPuffs.forEach((p) => {
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(crownX + p.dx, crownY + p.dy, p.cr, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. Fine Leaf Texture & Stipple Accents (Crisp Organic Foliage Grains)
  const stippleCount = 10 + Math.floor(treeHash(x, y, 4) * 6);
  for (let s = 0; s < stippleCount; s++) {
    const sAngle = treeHash(x, y, 100 + s) * Math.PI * 2;
    const sDist = treeHash(x, y, 110 + s) * r * 0.78;
    const sx = x + Math.cos(sAngle) * sDist;
    const sy = y + Math.sin(sAngle) * sDist;
    const sSunDot = -Math.cos(sAngle) * 0.707 - Math.sin(sAngle) * 0.707;
    const dotRadius = 0.8 + treeHash(x, y, 120 + s) * 0.8;

    ctx.fillStyle = sSunDot > 0.1 ? (treeHash(x, y, 130 + s) > 0.5 ? '#61f0a5' : '#39d587') : '#0c3823';
    ctx.beginPath();
    ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

// Draw realistic compact top-down shrub / bush with irregular natural foliage
const drawBush = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.save();
  const hash = treeHash(x, y, 5);
  const rot = hash * Math.PI * 2;

  // Soft shrub drop shadow
  ctx.fillStyle = 'rgba(2, 14, 11, 0.35)';
  ctx.beginPath();
  ctx.arc(x + 2, y + 2.5, r + 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Dark under-foliage foundation
  ctx.fillStyle = '#0a301e';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Irregular organic shrub puffs (4 distinct lobes around center)
  const puffs = [
    { a: rot, d: r * 0.35, pr: r * 0.52, c: '#125434' },
    { a: rot + 1.5, d: r * 0.32, pr: r * 0.48, c: '#176640' },
    { a: rot + 3.1, d: r * 0.36, pr: r * 0.5, c: '#1c774b' },
    { a: rot + 4.6, d: r * 0.3, pr: r * 0.54, c: '#238d58' },
    { a: rot - 2.2, d: r * 0.15, pr: r * 0.42, c: '#2fad6e' },
  ];

  puffs.forEach((p) => {
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(x + Math.cos(p.a) * p.d, y + Math.sin(p.a) * p.d, p.pr, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top sunlit leaf highlight
  ctx.fillStyle = '#3ee191';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.22, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

// Draw detailed landscaping with grass lawns, sidewalks, paved curbs and trees in all four quadrants
const drawLandscaping = (ctx: CanvasRenderingContext2D) => {
  const sidewalkWidth = 26;
  const leftEdge = 0;
  const topEdge = 0;
  const rightEdge = CANVAS_SIZE;
  const bottomEdge = CANVAS_SIZE;

  const roadMin = CENTER - HALF_ROAD; // 290
  const roadMax = CENTER + HALF_ROAD; // 410

  // 1. Four Quadrant Base Grass Lawns
  const quadrants = [
    { x: leftEdge, y: topEdge, w: roadMin, h: roadMin }, // Top-Left
    { x: roadMax, y: topEdge, w: rightEdge - roadMax, h: roadMin }, // Top-Right
    { x: leftEdge, y: roadMax, w: roadMin, h: bottomEdge - roadMax }, // Bottom-Left
    { x: roadMax, y: roadMax, w: rightEdge - roadMax, h: bottomEdge - roadMax }, // Bottom-Right
  ];

  quadrants.forEach((q) => {
    // Rich lawn fill
    ctx.fillStyle = '#0A251E';
    ctx.fillRect(q.x, q.y, q.w, q.h);

    // Subtle manicured park pattern
    ctx.fillStyle = '#0E3027';
    for (let py = q.y + 10; py < q.y + q.h - 10; py += 32) {
      ctx.fillRect(q.x + 10, py, q.w - 20, 16);
    }

    // Outer quadrant border
    ctx.strokeStyle = '#1B5655';
    ctx.lineWidth = 1;
    ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
  });

  // 2. Concrete/Stone Sidewalks bordering roads
  ctx.fillStyle = '#123835';
  ctx.strokeStyle = '#1B5655';
  ctx.lineWidth = 1.5;

  // Top-Left quadrant sidewalks
  ctx.fillRect(roadMin - sidewalkWidth, 0, sidewalkWidth, roadMin); // along vertical road
  ctx.fillRect(0, roadMin - sidewalkWidth, roadMin, sidewalkWidth); // along horizontal road

  // Top-Right quadrant sidewalks
  ctx.fillRect(roadMax, 0, sidewalkWidth, roadMin);
  ctx.fillRect(roadMax, roadMin - sidewalkWidth, rightEdge - roadMax, sidewalkWidth);

  // Bottom-Left quadrant sidewalks
  ctx.fillRect(roadMin - sidewalkWidth, roadMax, sidewalkWidth, bottomEdge - roadMax);
  ctx.fillRect(0, roadMax, roadMin, sidewalkWidth);

  // Bottom-Right quadrant sidewalks
  ctx.fillRect(roadMax, roadMax, sidewalkWidth, bottomEdge - roadMax);
  ctx.fillRect(roadMax, roadMax, rightEdge - roadMax, sidewalkWidth);

  // Sidewalk curb lines
  ctx.strokeStyle = '#286C6A';
  ctx.lineWidth = 2;

  // Curbs for all 4 corners
  ctx.beginPath();
  // TL
  ctx.moveTo(roadMin, 0);
  ctx.lineTo(roadMin, roadMin);
  ctx.lineTo(0, roadMin);
  // TR
  ctx.moveTo(roadMax, 0);
  ctx.lineTo(roadMax, roadMin);
  ctx.lineTo(rightEdge, roadMin);
  // BL
  ctx.moveTo(0, roadMax);
  ctx.lineTo(roadMin, roadMax);
  ctx.lineTo(roadMin, bottomEdge);
  // BR
  ctx.moveTo(rightEdge, roadMax);
  ctx.lineTo(roadMax, roadMax);
  ctx.lineTo(roadMax, bottomEdge);
  ctx.stroke();

  // Subtle sidewalk paving joints
  ctx.strokeStyle = 'rgba(27, 86, 85, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < roadMin; i += 24) {
    // TL vertical & horizontal
    ctx.moveTo(roadMin - sidewalkWidth, i);
    ctx.lineTo(roadMin, i);
    ctx.moveTo(i, roadMin - sidewalkWidth);
    ctx.lineTo(i, roadMin);

    // TR vertical & horizontal
    ctx.moveTo(roadMax, i);
    ctx.lineTo(roadMax + sidewalkWidth, i);
    ctx.moveTo(roadMax + i, roadMin - sidewalkWidth);
    ctx.lineTo(roadMax + i, roadMin);

    // BL vertical & horizontal
    ctx.moveTo(roadMin - sidewalkWidth, roadMax + i);
    ctx.lineTo(roadMin, roadMax + i);
    ctx.moveTo(i, roadMax);
    ctx.lineTo(i, roadMax + sidewalkWidth);

    // BR vertical & horizontal
    ctx.moveTo(roadMax, roadMax + i);
    ctx.lineTo(roadMax + sidewalkWidth, roadMax + i);
    ctx.moveTo(roadMax + i, roadMax);
    ctx.lineTo(roadMax + i, roadMax + sidewalkWidth);
  }
  ctx.stroke();

  // Tactile amber waiting pads at pedestrian crosswalk entrances
  ctx.fillStyle = '#D97706';
  // North crosswalk entry pads
  ctx.fillRect(roadMin - sidewalkWidth + 4, roadMin - 20, sidewalkWidth - 8, 14);
  ctx.fillRect(roadMax + 4, roadMin - 20, sidewalkWidth - 8, 14);
  // South crosswalk entry pads
  ctx.fillRect(roadMin - sidewalkWidth + 4, roadMax + 6, sidewalkWidth - 8, 14);
  ctx.fillRect(roadMax + 4, roadMax + 6, sidewalkWidth - 8, 14);
  // West crosswalk entry pads
  ctx.fillRect(roadMin - 20, roadMin - sidewalkWidth + 4, 14, sidewalkWidth - 8);
  ctx.fillRect(roadMin - 20, roadMax + 4, 14, sidewalkWidth - 8);
  // East crosswalk entry pads
  ctx.fillRect(roadMax + 6, roadMin - sidewalkWidth + 4, 14, sidewalkWidth - 8);
  ctx.fillRect(roadMax + 6, roadMax + 4, 14, sidewalkWidth - 8);

  // 3. Decorative Shrub Hedges along sidewalks
  const shrubs = [
    // TL
    { x: roadMin - sidewalkWidth - 8, y: 40 },
    { x: roadMin - sidewalkWidth - 8, y: 70 },
    { x: roadMin - sidewalkWidth - 8, y: 100 },
    { x: roadMin - sidewalkWidth - 8, y: 130 },
    { x: 40, y: roadMin - sidewalkWidth - 8 },
    { x: 70, y: roadMin - sidewalkWidth - 8 },
    { x: 100, y: roadMin - sidewalkWidth - 8 },
    { x: 130, y: roadMin - sidewalkWidth - 8 },
    // TR
    { x: roadMax + sidewalkWidth + 8, y: 40 },
    { x: roadMax + sidewalkWidth + 8, y: 70 },
    { x: roadMax + sidewalkWidth + 8, y: 100 },
    { x: roadMax + sidewalkWidth + 8, y: 130 },
    { x: roadMax + 40, y: roadMin - sidewalkWidth - 8 },
    { x: roadMax + 70, y: roadMin - sidewalkWidth - 8 },
    { x: roadMax + 100, y: roadMin - sidewalkWidth - 8 },
    { x: roadMax + 130, y: roadMin - sidewalkWidth - 8 },
    // BL
    { x: roadMin - sidewalkWidth - 8, y: roadMax + 40 },
    { x: roadMin - sidewalkWidth - 8, y: roadMax + 70 },
    { x: roadMin - sidewalkWidth - 8, y: roadMax + 100 },
    { x: roadMin - sidewalkWidth - 8, y: roadMax + 130 },
    { x: 40, y: roadMax + sidewalkWidth + 8 },
    { x: 70, y: roadMax + sidewalkWidth + 8 },
    { x: 100, y: roadMax + sidewalkWidth + 8 },
    { x: 130, y: roadMax + sidewalkWidth + 8 },
    // BR
    { x: roadMax + sidewalkWidth + 8, y: roadMax + 40 },
    { x: roadMax + sidewalkWidth + 8, y: roadMax + 70 },
    { x: roadMax + sidewalkWidth + 8, y: roadMax + 100 },
    { x: roadMax + sidewalkWidth + 8, y: roadMax + 130 },
    { x: roadMax + 40, y: roadMax + sidewalkWidth + 8 },
    { x: roadMax + 70, y: roadMax + sidewalkWidth + 8 },
    { x: roadMax + 100, y: roadMax + sidewalkWidth + 8 },
    { x: roadMax + 130, y: roadMax + sidewalkWidth + 8 },
  ];
  shrubs.forEach((s) => drawBush(ctx, s.x, s.y, 7));

  // 4. Detailed Top-Down Trees in Parks
  const treeList = [
    // Top-Left Quadrant
    { x: 50, y: 55, r: 22 },
    { x: 110, y: 48, r: 18 },
    { x: 175, y: 65, r: 20 },
    { x: 55, y: 125, r: 19 },
    { x: 120, y: 135, r: 24 },
    { x: 185, y: 160, r: 21 },
    { x: 60, y: 195, r: 17 },

    // Top-Right Quadrant
    { x: 505, y: 55, r: 21 },
    { x: 575, y: 45, r: 19 },
    { x: 640, y: 65, r: 22 },
    { x: 495, y: 140, r: 23 },
    { x: 565, y: 125, r: 18 },
    { x: 635, y: 155, r: 20 },
    { x: 515, y: 200, r: 17 },

    // Bottom-Left Quadrant
    { x: 55, y: 485, r: 20 },
    { x: 125, y: 495, r: 24 },
    { x: 190, y: 480, r: 18 },
    { x: 65, y: 555, r: 19 },
    { x: 135, y: 580, r: 22 },
    { x: 195, y: 565, r: 17 },
    { x: 50, y: 635, r: 21 },
    { x: 120, y: 645, r: 19 },

    // Bottom-Right Quadrant
    { x: 495, y: 485, r: 19 },
    { x: 565, y: 500, r: 23 },
    { x: 635, y: 480, r: 21 },
    { x: 505, y: 570, r: 22 },
    { x: 575, y: 585, r: 18 },
    { x: 640, y: 560, r: 20 },
    { x: 520, y: 640, r: 18 },
    { x: 625, y: 635, r: 22 },
  ];
  treeList.forEach((t) => drawTree(ctx, t.x, t.y, t.r));
};

// Draw Roads (Tarmac)
const drawRoads = (ctx: CanvasRenderingContext2D) => {
  // Deep dark command-center asphalt
  ctx.fillStyle = '#091E20';

  // Vertical Road (North - South)
  ctx.fillRect(CENTER - HALF_ROAD, 0, ROAD_WIDTH, CANVAS_SIZE);

  // Horizontal Road (East - West)
  ctx.fillRect(0, CENTER - HALF_ROAD, CANVAS_SIZE, ROAD_WIDTH);

  // Road curb borders
  ctx.strokeStyle = '#1B5655';
  ctx.lineWidth = 2;

  // Top-Left corner curb
  ctx.beginPath();
  ctx.moveTo(0, CENTER - HALF_ROAD);
  ctx.lineTo(CENTER - HALF_ROAD, CENTER - HALF_ROAD);
  ctx.lineTo(CENTER - HALF_ROAD, 0);
  ctx.stroke();

  // Top-Right corner curb
  ctx.beginPath();
  ctx.moveTo(CENTER + HALF_ROAD, 0);
  ctx.lineTo(CENTER + HALF_ROAD, CENTER - HALF_ROAD);
  ctx.lineTo(CANVAS_SIZE, CENTER - HALF_ROAD);
  ctx.stroke();

  // Bottom-Left corner curb
  ctx.beginPath();
  ctx.moveTo(0, CENTER + HALF_ROAD);
  ctx.lineTo(CENTER - HALF_ROAD, CENTER + HALF_ROAD);
  ctx.lineTo(CENTER - HALF_ROAD, CANVAS_SIZE);
  ctx.stroke();

  // Bottom-Right corner curb
  ctx.beginPath();
  ctx.moveTo(CANVAS_SIZE, CENTER + HALF_ROAD);
  ctx.lineTo(CENTER + HALF_ROAD, CENTER + HALF_ROAD);
  ctx.lineTo(CENTER + HALF_ROAD, CANVAS_SIZE);
  ctx.stroke();
};

const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(232, 245, 242, 0.55)';
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

const drawZebraCrosswalk = (ctx: CanvasRenderingContext2D, dir: Direction) => {
  ctx.fillStyle = 'rgba(232, 245, 242, 0.7)';
  const stripeWidth = 6;
  const stripeGap = 6;

  if (dir === 'NORTH') {
    const y = INTERSECTION_BOUNDS.minY - 8;
    for (let x = CENTER - HALF_ROAD + 4; x < CENTER + HALF_ROAD - 4; x += stripeWidth + stripeGap) {
      ctx.fillRect(x, y - 12, stripeWidth, 12);
    }
  } else if (dir === 'SOUTH') {
    const y = INTERSECTION_BOUNDS.maxY + 8;
    for (let x = CENTER - HALF_ROAD + 4; x < CENTER + HALF_ROAD - 4; x += stripeWidth + stripeGap) {
      ctx.fillRect(x, y, stripeWidth, 12);
    }
  } else if (dir === 'WEST') {
    const x = INTERSECTION_BOUNDS.minX - 8;
    for (let y = CENTER - HALF_ROAD + 4; y < CENTER + HALF_ROAD - 4; y += stripeWidth + stripeGap) {
      ctx.fillRect(x - 12, y, 12, stripeWidth);
    }
  } else if (dir === 'EAST') {
    const x = INTERSECTION_BOUNDS.maxX + 8;
    for (let y = CENTER - HALF_ROAD + 4; y < CENTER + HALF_ROAD - 4; y += stripeWidth + stripeGap) {
      ctx.fillRect(x, y, 12, stripeWidth);
    }
  }
};

const drawLaneArrows = (ctx: CanvasRenderingContext2D) => {
  // North approach arrow (heading downwards)
  drawArrow(ctx, CENTER - LANE_WIDTH / 2, STOP_LINES.NORTH - 45, Math.PI);

  // South approach arrow (heading upwards)
  drawArrow(ctx, CENTER + LANE_WIDTH / 2, STOP_LINES.SOUTH + 45, 0);

  // East approach arrow (heading leftwards)
  drawArrow(ctx, STOP_LINES.EAST + 45, CENTER - LANE_WIDTH / 2, -Math.PI / 2);

  // West approach arrow (heading rightwards)
  drawArrow(ctx, STOP_LINES.WEST - 45, CENTER + LANE_WIDTH / 2, Math.PI / 2);
};

const drawRoadMarkings = (ctx: CanvasRenderingContext2D) => {
  // Yellow double dashed center dividers
  ctx.strokeStyle = '#F5B83D';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([12, 10]);

  // North center line
  ctx.beginPath();
  ctx.moveTo(CENTER - 2, 0);
  ctx.lineTo(CENTER - 2, INTERSECTION_BOUNDS.minY - 26);
  ctx.moveTo(CENTER + 2, 0);
  ctx.lineTo(CENTER + 2, INTERSECTION_BOUNDS.minY - 26);
  ctx.stroke();

  // South center line
  ctx.beginPath();
  ctx.moveTo(CENTER - 2, INTERSECTION_BOUNDS.maxY + 26);
  ctx.lineTo(CENTER - 2, CANVAS_SIZE);
  ctx.moveTo(CENTER + 2, INTERSECTION_BOUNDS.maxY + 26);
  ctx.lineTo(CENTER + 2, CANVAS_SIZE);
  ctx.stroke();

  // West center line
  ctx.beginPath();
  ctx.moveTo(0, CENTER - 2);
  ctx.lineTo(INTERSECTION_BOUNDS.minX - 26, CENTER - 2);
  ctx.moveTo(0, CENTER + 2);
  ctx.lineTo(INTERSECTION_BOUNDS.minX - 26, CENTER + 2);
  ctx.stroke();

  // East center line
  ctx.beginPath();
  ctx.moveTo(INTERSECTION_BOUNDS.maxX + 26, CENTER - 2);
  ctx.lineTo(CANVAS_SIZE, CENTER - 2);
  ctx.moveTo(INTERSECTION_BOUNDS.maxX + 26, CENTER + 2);
  ctx.lineTo(CANVAS_SIZE, CENTER + 2);
  ctx.stroke();

  // Reset dash
  ctx.setLineDash([]);

  // Solid White Stop Lines
  ctx.strokeStyle = '#E8F5F2';
  ctx.lineWidth = 4;

  // North Stop Line
  ctx.beginPath();
  ctx.moveTo(CENTER - HALF_ROAD, STOP_LINES.NORTH);
  ctx.lineTo(CENTER, STOP_LINES.NORTH);
  ctx.stroke();

  // South Stop Line
  ctx.beginPath();
  ctx.moveTo(CENTER, STOP_LINES.SOUTH);
  ctx.lineTo(CENTER + HALF_ROAD, STOP_LINES.SOUTH);
  ctx.stroke();

  // East Stop Line
  ctx.beginPath();
  ctx.moveTo(STOP_LINES.EAST, CENTER - HALF_ROAD);
  ctx.lineTo(STOP_LINES.EAST, CENTER);
  ctx.stroke();

  // West Stop Line
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

  // Compass orientation markers on roadway edge
  ctx.fillStyle = '#8BAFAC';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▲ NORTH', CENTER, 12);
  ctx.fillText('▼ SOUTH', CENTER, CANVAS_SIZE - 12);
  ctx.fillText('◀ WEST', 28, CENTER);
  ctx.fillText('EAST ▶', CANVAS_SIZE - 28, CENTER);
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
  ctx.fillStyle = '#092526';
  ctx.strokeStyle = '#1B5655';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-12, -26, 24, 52, 5);
  ctx.fill();
  ctx.stroke();

  // Three lenses: Red (top), Yellow (mid), Green (bottom)
  const lamps = [
    { c: 'RED', y: -16, activeColor: '#EF4444', dimColor: '#3B1010' },
    { c: 'YELLOW', y: 0, activeColor: '#F5B83D', dimColor: '#362308' },
    { c: 'GREEN', y: 16, activeColor: '#10D98B', dimColor: '#093623' },
  ];

  lamps.forEach((lamp) => {
    const isActive = lamp.c === color;
    ctx.beginPath();
    ctx.arc(0, lamp.y, 6, 0, Math.PI * 2);

    if (isActive) {
      ctx.shadowColor = lamp.activeColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = lamp.activeColor;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    } else {
      ctx.fillStyle = lamp.dimColor;
      ctx.fill();
    }
    ctx.strokeStyle = '#061B1B';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Direction label & countdown badge
  ctx.fillStyle = '#8BAFAC';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${label.charAt(0)}: ${remaining.toFixed(0)}s`, 0, 36);

  ctx.restore();
};

const drawTrafficSignals = (
  ctx: CanvasRenderingContext2D,
  currentSignals: Record<Direction, TrafficSignalState>
) => {
  const signalPositions: Record<Direction, { x: number; y: number; angle: number }> = {
    NORTH: { x: CENTER - HALF_ROAD - 18, y: STOP_LINES.NORTH + 5, angle: 0 },
    SOUTH: { x: CENTER + HALF_ROAD + 18, y: STOP_LINES.SOUTH - 5, angle: Math.PI },
    EAST:  { x: STOP_LINES.EAST - 5, y: CENTER - HALF_ROAD - 18, angle: Math.PI / 2 },
    WEST:  { x: STOP_LINES.WEST + 5, y: CENTER + HALF_ROAD + 18, angle: -Math.PI / 2 },
  };

  (Object.keys(currentSignals) as Direction[]).forEach((dir) => {
    const pos = signalPositions[dir];
    const sig = currentSignals[dir];
    drawSignalHead(ctx, pos.x, pos.y, sig.color, sig.remainingSeconds, dir);
  });
};

const drawVehicles = (ctx: CanvasRenderingContext2D, vehicleList: Vehicle[]) => {
  vehicleList.forEach((vehicle) => {
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

    const vType = vehicle.type || 'car';
    const vLen = vehicle.length || VEHICLE_LENGTH;
    const vWid = vehicle.width || VEHICLE_WIDTH;
    const halfW = vWid / 2;
    const halfL = vLen / 2;

    // Drop shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 1, -halfL + 2, vWid, vLen, 3);
    ctx.fill();

    if (vType === 'car') {
      // Sleek Passenger Car
      ctx.fillStyle = vehicle.color;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfL, vWid, vLen, 4);
      ctx.fill();

      // Front & rear windshields
      ctx.fillStyle = '#061B1B';
      ctx.fillRect(-halfW + 2, -halfL + 6, vWid - 4, 4);
      ctx.fillRect(-halfW + 2, halfL - 8, vWid - 4, 3);

      // Roof contour
      ctx.fillStyle = 'rgba(232, 245, 242, 0.22)';
      ctx.fillRect(-halfW + 2, -halfL + 11, vWid - 4, 5);

      // Headlights
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-halfW + 3, -halfL + 1, 2, 0, Math.PI * 2);
      ctx.arc(halfW - 3, -halfL + 1, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (vType === 'bus') {
      // City Transit Bus
      ctx.fillStyle = vehicle.color;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfL, vWid, vLen, 3);
      ctx.fill();

      // Electronic route destination sign at front
      ctx.fillStyle = '#F5B83D';
      ctx.fillRect(-halfW + 2, -halfL + 2, vWid - 4, 2);

      // Driver windshield
      ctx.fillStyle = '#061B1B';
      ctx.fillRect(-halfW + 2, -halfL + 5, vWid - 4, 5);

      // Side passenger windows
      for (let wy = -halfL + 12; wy < halfL - 6; wy += 6) {
        ctx.fillRect(-halfW + 1, wy, 2, 4);
        ctx.fillRect(halfW - 3, wy, 2, 4);
      }

      // Roof air-conditioning pods
      ctx.fillStyle = 'rgba(232, 245, 242, 0.3)';
      ctx.fillRect(-halfW + 4, -halfL + 14, vWid - 8, 8);
      ctx.fillRect(-halfW + 4, halfL - 14, vWid - 8, 7);

      // Headlights
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-halfW + 2, -halfL, 3, 2);
      ctx.fillRect(halfW - 5, -halfL, 3, 2);
    } else if (vType === 'truck') {
      // Commercial Logistics Truck (Cab + Cargo Box)
      // Front Cab
      ctx.fillStyle = vehicle.color;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfL, vWid, 12, 3);
      ctx.fill();

      // Cab Windshield
      ctx.fillStyle = '#061B1B';
      ctx.fillRect(-halfW + 2, -halfL + 3, vWid - 4, 4);

      // Coupler / Hitch gap
      ctx.fillStyle = '#1B5655';
      ctx.fillRect(-3, -halfL + 12, 6, 3);

      // Rear Cargo Box
      ctx.fillStyle = '#1B4A48';
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfL + 15, vWid, vLen - 15, 2);
      ctx.fill();

      // Cargo door ribbing
      ctx.strokeStyle = '#286C6A';
      ctx.lineWidth = 1;
      ctx.strokeRect(-halfW + 1, -halfL + 16, vWid - 2, vLen - 17);

      // Headlights
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-halfW + 1, -halfL, 3, 2);
      ctx.fillRect(halfW - 4, -halfL, 3, 2);
    } else {
      // Bike / Motorcycle
      ctx.fillStyle = '#1B5655';
      ctx.fillRect(-2, -halfL, 4, vLen);

      // Handlebars
      ctx.fillStyle = '#8BAFAC';
      ctx.fillRect(-halfW + 1, -halfL + 4, vWid - 2, 2);

      // Rider body & helmet
      ctx.fillStyle = vehicle.color;
      ctx.beginPath();
      ctx.arc(0, -halfL + 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Headlight
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(0, -halfL + 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brake lights for all vehicles
    if (vehicle.isBraking || vehicle.state === 'WAITING') {
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-halfW + 1, halfL - 2, 3, 2);
      ctx.fillRect(halfW - 4, halfL - 2, 3, 2);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(-halfW + 1, halfL - 2, 3, 2);
      ctx.fillRect(halfW - 4, halfL - 2, 3, 2);
    }

    ctx.restore();
  });
};

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

    // 1. Clear background
    ctx.fillStyle = '#061B1B';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Draw Landscaping (Grass Lawns, Sidewalks, Hedges, Trees in all 4 quadrants)
    drawLandscaping(ctx);

    // 3. Draw Roads (Asphalt)
    drawRoads(ctx);

    // 4. Draw Road Markings (Double yellow center, dashed lane lines, stop lines, zebra crossings, arrows)
    drawRoadMarkings(ctx);

    // 5. Draw Traffic Signals at intersection corners
    drawTrafficSignals(ctx, signals);

    // 6. Draw Moving Vehicles
    drawVehicles(ctx, vehicles);
  }, [vehicles, signals]);

  const getSignalBadgeColor = (color: 'GREEN' | 'YELLOW' | 'RED') => {
    switch (color) {
      case 'GREEN':
        return 'text-[#10D98B] border-[#10D98B]/50 bg-[#123A3A]';
      case 'YELLOW':
        return 'text-[#F5B83D] border-[#F5B83D]/50 bg-[#1B2925]';
      case 'RED':
        return 'text-[#EF4444] border-[#EF4444]/50 bg-[#1A2223]';
    }
  };

  const getSignalDot = (color: 'GREEN' | 'YELLOW' | 'RED') => {
    switch (color) {
      case 'GREEN':
        return 'bg-[#10D98B]';
      case 'YELLOW':
        return 'bg-[#F5B83D]';
      case 'RED':
        return 'bg-[#EF4444]';
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-md border border-[#1B5655] bg-[#092526] p-2.5 flex flex-col items-center justify-center select-none">
      {/* Directional Signal Overlay: NORTH (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-md bg-[#092526]/90 backdrop-blur-md border border-[#1B5655] shadow-lg font-mono text-xs">
        <ArrowDown className="w-3.5 h-3.5 text-[#8BAFAC]" />
        <span className="font-bold text-[#E8F5F2]">NORTH</span>
        <span
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getSignalBadgeColor(
            signals.NORTH.color
          )}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getSignalDot(signals.NORTH.color)}`} />
          {signals.NORTH.color}
        </span>
        <span className="font-bold text-[#E8F5F2]">{signals.NORTH.remainingSeconds.toFixed(1)}s</span>
      </div>

      {/* Directional Signal Overlay: SOUTH (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-md bg-[#092526]/90 backdrop-blur-md border border-[#1B5655] shadow-lg font-mono text-xs">
        <ArrowUp className="w-3.5 h-3.5 text-[#8BAFAC]" />
        <span className="font-bold text-[#E8F5F2]">SOUTH</span>
        <span
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getSignalBadgeColor(
            signals.SOUTH.color
          )}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getSignalDot(signals.SOUTH.color)}`} />
          {signals.SOUTH.color}
        </span>
        <span className="font-bold text-[#E8F5F2]">{signals.SOUTH.remainingSeconds.toFixed(1)}s</span>
      </div>

      {/* Directional Signal Overlay: WEST (Left Center) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#092526]/90 backdrop-blur-md border border-[#1B5655] shadow-lg font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-[#8BAFAC]" />
          <span className="font-bold text-[#E8F5F2]">WEST</span>
        </div>
        <span
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getSignalBadgeColor(
            signals.WEST.color
          )}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getSignalDot(signals.WEST.color)}`} />
          {signals.WEST.color}
        </span>
        <span className="font-bold text-[#E8F5F2] text-[11px]">
          {signals.WEST.remainingSeconds.toFixed(1)}s
        </span>
      </div>

      {/* Directional Signal Overlay: EAST (Right Center) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#092526]/90 backdrop-blur-md border border-[#1B5655] shadow-lg font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5 text-[#8BAFAC]" />
          <span className="font-bold text-[#E8F5F2]">EAST</span>
        </div>
        <span
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getSignalBadgeColor(
            signals.EAST.color
          )}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getSignalDot(signals.EAST.color)}`} />
          {signals.EAST.color}
        </span>
        <span className="font-bold text-[#E8F5F2] text-[11px]">
          {signals.EAST.remainingSeconds.toFixed(1)}s
        </span>
      </div>

      {/* HTML Canvas Simulation */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: '620px', aspectRatio: '1/1' }}
        className="rounded-lg block bg-[#061B1B] shadow-inner ring-1 ring-[#1B5655]/60"
      />
    </div>
  );
};
