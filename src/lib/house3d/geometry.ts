import type { Point, Wall } from "@/types/floor-plan";

export function wallLen(start: Point, end: Point): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1]);
}

export function wallAngleY(start: Point, end: Point): number {
  return Math.atan2(end[1] - start[1], end[0] - start[0]);
}

export function wallMid(start: Point, end: Point): Point {
  return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
}

export function pointOnWall(start: Point, end: Point, dist: number): Point {
  const len = wallLen(start, end);
  if (len === 0) return [start[0], start[1]];
  const t = dist / len;
  return [
    start[0] + t * (end[0] - start[0]),
    start[1] + t * (end[1] - start[1]),
  ];
}

export function dirAlong(start: Point, end: Point): Point {
  const len = wallLen(start, end);
  if (len === 0) return [1, 0];
  return [(end[0] - start[0]) / len, (end[1] - start[1]) / len];
}

export function bboxOfPolygons(polygons: Point[][]): {
  minX: number;
  minZ: number;
  width: number;
  depth: number;
} | null {
  const pts = polygons.flat();
  if (!pts.length) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of pts) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  return { minX, minZ, width: maxX - minX, depth: maxZ - minZ };
}

export function externalFootprint(walls: Wall[]) {
  const ext = walls.filter((w) => w.type === "external");
  const pts = ext.flatMap((w) => [w.start, w.end]);
  if (!pts.length) return null;
  return bboxOfPolygons([pts]);
}
