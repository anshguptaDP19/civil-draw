import type { Point, Wall } from "@/types/floor-plan";

export const WALL_HEIGHT = 9;
export const DOOR_HEIGHT = 7;
export const WINDOW_HEIGHT = 4;
export const WINDOW_SILL_DEFAULT = 2.5;
export const FLOOR_THICKNESS = 0.25;
export const FLOOR_STACK_GAP = 0.5;
export const SLAB_THICKNESS = 0.35;
export const ROOF_THICKNESS = 0.4;
export const BASE_BEAM_HEIGHT = 0.55;
export const COLUMN_SIZE = 0.5;
export const COLUMN_EXTENSION = 3;

/** Higharc-inspired material palette */
export const MAT = {
  column: { color: "#8e8e8e", roughness: 0.82, metalness: 0.05 },
  slab: { color: "#a8a8a8", roughness: 0.88, metalness: 0.02 },
  wallExt: { color: "#c8c4be", roughness: 0.92, metalness: 0.01 },
  wallInt: { color: "#d8d4ce", roughness: 0.9, metalness: 0.01 },
  glass: { color: "#a8d4f0", roughness: 0.05, metalness: 0.15, opacity: 0.35 },
  frame: { color: "#2a2a2a", roughness: 0.6, metalness: 0.2 },
  door: { color: "#6b4a2a", roughness: 0.65, metalness: 0.08 },
  ground: { color: "#1c1c1e", roughness: 0.95, metalness: 0 },
  floorWood: { color: "#d4c4a8", roughness: 0.75, metalness: 0.02 },
  floorCarpet: { color: "#c8beb0", roughness: 0.95, metalness: 0 },
  floorTile: { color: "#e0dcd4", roughness: 0.55, metalness: 0.05 },
} as const;

/** Plan (x, y) → Three.js (x, elevation, z) */
export function planTo3D(point: Point, elevation = 0): [number, number, number] {
  return [point[0], elevation, point[1]];
}

export function wallLength(start: Point, end: Point): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1]);
}

export function wallAngle(start: Point, end: Point): number {
  return Math.atan2(end[1] - start[1], end[0] - start[0]);
}

export interface WallSegment {
  start: Point;
  end: Point;
}

export function splitWallAtOpenings(
  wallStart: Point,
  wallEnd: Point,
  openings: { position: number; width: number }[],
): WallSegment[] {
  const totalLen = wallLength(wallStart, wallEnd);
  if (totalLen === 0) return [];

  const sorted = [...openings].sort((a, b) => a.position - b.position);
  const segments: WallSegment[] = [];
  let cursor = 0;

  for (const opening of sorted) {
    const gapStart = Math.max(0, opening.position - opening.width / 2);
    const gapEnd = Math.min(totalLen, opening.position + opening.width / 2);

    if (gapStart > cursor + 0.05) {
      segments.push({
        start: interpolateWall(wallStart, wallEnd, cursor),
        end: interpolateWall(wallStart, wallEnd, gapStart),
      });
    }
    cursor = Math.max(cursor, gapEnd);
  }

  if (cursor < totalLen - 0.05) {
    segments.push({
      start: interpolateWall(wallStart, wallEnd, cursor),
      end: interpolateWall(wallStart, wallEnd, totalLen),
    });
  }

  return segments.length > 0 ? segments : [{ start: wallStart, end: wallEnd }];
}

function interpolateWall(start: Point, end: Point, distance: number): Point {
  const len = wallLength(start, end);
  if (len === 0) return start;
  const t = distance / len;
  return [
    start[0] + t * (end[0] - start[0]),
    start[1] + t * (end[1] - start[1]),
  ];
}

const FLOOR_COLORS: Record<string, string> = {
  wood: MAT.floorWood.color,
  carpet: MAT.floorCarpet.color,
  tile: MAT.floorTile.color,
  concrete: "#b0aca4",
  stone: "#c0bab0",
};

export function roomFloorColor(finish?: string, index = 0): string {
  if (finish && FLOOR_COLORS[finish]) return FLOOR_COLORS[finish];
  const palette = ["#e8e4dc", "#ece8e0", "#e4e0d8", "#f0ece4"];
  return palette[index % palette.length];
}

/** Deduplicate column positions along external walls. */
export function collectColumnPositions(
  walls: Wall[],
  spacing = 11,
): Point[] {
  const external = walls.filter((w) => w.type === "external");
  const raw: Point[] = [];

  for (const w of external) {
    raw.push(w.start, w.end);
    const len = wallLength(w.start, w.end);
    if (len > spacing) {
      const steps = Math.floor(len / spacing);
      for (let i = 1; i < steps; i++) {
        raw.push(interpolateWall(w.start, w.end, i * (len / steps)));
      }
    }
  }

  const result: Point[] = [];
  for (const p of raw) {
    const dup = result.find(
      (q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < COLUMN_SIZE * 0.8,
    );
    if (!dup) result.push(p);
  }
  return result;
}

export function levelOffset(): number {
  return WALL_HEIGHT + SLAB_THICKNESS + FLOOR_STACK_GAP;
}

export interface BuildingFootprint {
  minX: number;
  minY: number;
  width: number;
  depth: number;
}

/** Bounding box of external walls — house footprint only (not full plot). */
export function buildingFootprint(walls: Wall[]): BuildingFootprint | null {
  const external = walls.filter((w) => w.type === "external");
  if (!external.length) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const w of external) {
    for (const p of [w.start, w.end]) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
  }

  return { minX, minY, width: maxX - minX, depth: maxY - minY };
}
