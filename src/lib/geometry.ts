import type { Point, Wall } from "@/types/floor-plan";

export function distance(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function pointOnWall(start: Point, end: Point, position: number): Point {
  const len = distance(start, end);
  if (len === 0) return [start[0], start[1]] as Point;
  const t = position / len;
  return [
    start[0] + t * (end[0] - start[0]),
    start[1] + t * (end[1] - start[1]),
  ];
}

export function wallDirection(start: Point, end: Point): Point {
  const len = distance(start, end);
  if (len === 0) return [1, 0];
  return [(end[0] - start[0]) / len, (end[1] - start[1]) / len];
}

export function perpendicular(dir: Point): Point {
  return [-dir[1], dir[0]];
}

export function polygonCentroid(polygon: Point[]): Point {
  if (polygon.length === 0) return [0, 0];

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < polygon.length; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % polygon.length];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  area *= 0.5;
  if (Math.abs(area) < 1e-9) {
    const sum = polygon.reduce(
      (acc, [x, y]) => [acc[0] + x, acc[1] + y] as Point,
      [0, 0] as Point,
    );
    return [sum[0] / polygon.length, sum[1] / polygon.length];
  }

  return [cx / (6 * area), cy / (6 * area)];
}

export function toSvgPoint(
  point: Point,
  plotHeight: number,
): Point {
  return [point[0], plotHeight - point[1]];
}

export function fromSvgPoint(svgPoint: Point, plotHeight: number): Point {
  return [svgPoint[0], plotHeight - svgPoint[1]];
}

export function clientToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Point {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return [0, 0];
  const transformed = pt.matrixTransform(ctm.inverse());
  return [transformed.x, transformed.y];
}

export function clientToPlanPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  plotHeight: number,
): Point {
  return fromSvgPoint(clientToSvgPoint(svg, clientX, clientY), plotHeight);
}

export function pointsToSvgPath(
  points: Point[],
  plotHeight: number,
  closed = true,
): string {
  if (points.length === 0) return "";
  const mapped = points.map((p) => toSvgPoint(p, plotHeight));
  const [first, ...rest] = mapped;
  const segments = rest.map(([x, y]) => `L ${x} ${y}`).join(" ");
  return closed
    ? `M ${first[0]} ${first[1]} ${segments} Z`
    : `M ${first[0]} ${first[1]} ${segments}`;
}

export function normalizeVector(v: Point): Point {
  const len = Math.hypot(v[0], v[1]);
  if (len === 0) return [0, 1];
  return [v[0] / len, v[1] / len];
}

/** Ray-casting point-in-polygon test */
export function polygonInteriorLabelPoint(polygon: Point[]): Point {
  if (polygon.length < 3) return polygonCentroid(polygon);

  const bounds = polygonBoundsFromPoints(polygon);
  const cell = Math.min(bounds.width, bounds.depth) / 10;
  if (cell < 0.05) return polygonCentroid(polygon);

  let best = polygonCentroid(polygon);
  let bestDist = pointInPolygon(best, polygon) ? distToPolygonEdge(best, polygon) : -1;

  for (let x = bounds.minX; x <= bounds.maxX; x += cell) {
    for (let y = bounds.minY; y <= bounds.maxY; y += cell) {
      const p: Point = [x, y];
      if (!pointInPolygon(p, polygon)) continue;
      const d = distToPolygonEdge(p, polygon);
      if (d > bestDist) {
        bestDist = d;
        best = p;
      }
    }
  }

  if (bestDist < 0) return polygonCentroid(polygon);
  return best;
}

function polygonBoundsFromPoints(polygon: Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, width: maxX - minX, depth: maxY - minY };
}

function distToPolygonEdge(point: Point, polygon: Point[]): number {
  let min = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    min = Math.min(min, distPointToSegment(point, a, b));
  }
  return min;
}

function distPointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function buildingFootprintFromWalls(walls: Wall[]) {
  const pts = walls.filter((w) => w.type === "external").flatMap((w) => [w.start, w.end]);
  if (!pts.length) return null;
  return polygonBoundsFromPoints(pts);
}

/** Ray-casting point-in-polygon test */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}
