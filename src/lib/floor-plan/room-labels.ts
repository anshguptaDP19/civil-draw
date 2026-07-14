import type { Door, Point, Room, Wall } from "@/types/floor-plan";
import {
  pointInPolygon,
  pointOnWall,
  polygonCentroid,
  polygonInteriorLabelPoint,
  toSvgPoint,
  wallDirection,
} from "@/lib/geometry";
import { polygonBounds, roomDisplayDimensions, roomDisplayName } from "@/lib/room-metrics";

export interface RoomLabelLayout {
  roomId: string;
  /** SVG-space anchor (center of label block) */
  cx: number;
  cy: number;
  name: string;
  dimensions: string;
  nameFontSize: number;
  dimsFontSize: number;
  bgWidth: number;
  bgHeight: number;
}

const LABEL_BG = "rgba(250, 248, 244, 0.92)";
const LABEL_BG_STROKE = "rgba(200, 190, 175, 0.45)";

export { LABEL_BG, LABEL_BG_STROKE };

function estimateTextWidth(text: string, fontSize: number, letterSpacing = 0): number {
  const spacing = letterSpacing * Math.max(0, text.length - 1);
  return text.length * fontSize * 0.58 + spacing;
}

function truncateToWidth(text: string, maxWidth: number, fontSize: number, letterSpacing = 0): string {
  if (estimateTextWidth(text, fontSize, letterSpacing) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && estimateTextWidth(`${t}…`, fontSize, letterSpacing) > maxWidth) {
    t = t.slice(0, -1);
  }
  return t.length < text.length ? `${t}…` : t;
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

function distToPolygonEdge(point: Point, polygon: Point[]): number {
  let min = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    min = Math.min(min, distPointToSegment(point, a, b));
  }
  return min;
}

function doorAffectsRoom(door: Door, walls: Wall[], room: Room): boolean {
  const wall = walls.find((w) => w.id === door.wall_id);
  if (!wall) return false;
  const dir = wallDirection(wall.start, wall.end);
  const center = pointOnWall(wall.start, wall.end, door.position_on_wall);
  const half = door.width / 2;
  const hinge =
    door.swing === "left"
      ? ([center[0] - dir[0] * half, center[1] - dir[1] * half] as Point)
      : ([center[0] + dir[0] * half, center[1] + dir[1] * half] as Point);
  return (
    pointInPolygon(hinge, room.polygon) ||
    distToPolygonEdge(hinge, room.polygon) < 0.6
  );
}

function nudgeFromDoorSwings(
  planPoint: Point,
  room: Room,
  doors: Door[],
  walls: Wall[],
): Point {
  let [px, py] = planPoint;

  for (const door of doors) {
    if (!doorAffectsRoom(door, walls, room)) continue;
    const wall = walls.find((w) => w.id === door.wall_id);
    if (!wall) continue;

    const dir = wallDirection(wall.start, wall.end);
    const center = pointOnWall(wall.start, wall.end, door.position_on_wall);
    const half = door.width / 2;
    const hinge =
      door.swing === "left"
        ? ([center[0] - dir[0] * half, center[1] - dir[1] * half] as Point)
        : ([center[0] + dir[0] * half, center[1] + dir[1] * half] as Point);

    const dx = px - hinge[0];
    const dy = py - hinge[1];
    const dist = Math.hypot(dx, dy);
    const minDist = door.width * 1.15;
    if (dist < minDist && dist > 1e-6) {
      const push = (minDist - dist) * 1.2;
      px += (dx / dist) * push;
      py += (dy / dist) * push;
    }
  }

  if (!pointInPolygon([px, py], room.polygon)) {
    return polygonInteriorLabelPoint(room.polygon);
  }
  return [px, py];
}

export function computeRoomLabelLayouts(
  rooms: Room[],
  doors: Door[],
  walls: Wall[],
  plotHeight: number,
  premium: boolean,
): RoomLabelLayout[] {
  const letterSpacing = premium ? 0.12 : 0;
  const layouts: RoomLabelLayout[] = [];

  for (const room of rooms) {
    if (room.polygon.length < 3) continue;

    const bounds = polygonBounds(room.polygon);
    const minDim = Math.min(bounds.width, bounds.depth);
    let nameFontSize = Math.min(1.05, Math.max(0.52, minDim * 0.095));
    let dimsFontSize = Math.min(0.82, Math.max(0.45, minDim * 0.075));

    const maxTextWidth = Math.max(1.2, minDim * 0.88);
    let name = roomDisplayName(room);
    let dims = roomDisplayDimensions(room).label;

    name = truncateToWidth(name, maxTextWidth, nameFontSize, letterSpacing);
    dims = truncateToWidth(dims, maxTextWidth, dimsFontSize);

    while (
      nameFontSize > 0.48 &&
      (estimateTextWidth(name, nameFontSize, letterSpacing) > maxTextWidth ||
        estimateTextWidth(dims, dimsFontSize) > maxTextWidth)
    ) {
      nameFontSize *= 0.92;
      dimsFontSize *= 0.92;
      name = truncateToWidth(roomDisplayName(room), maxTextWidth, nameFontSize, letterSpacing);
      dims = truncateToWidth(roomDisplayDimensions(room).label, maxTextWidth, dimsFontSize);
    }

    const nameW = estimateTextWidth(name, nameFontSize, letterSpacing);
    const dimsW = estimateTextWidth(dims, dimsFontSize);
    const padX = 0.38;
    const padY = 0.28;
    const lineGap = 0.22;
    const bgWidth = Math.max(nameW, dimsW) + padX * 2;
    const bgHeight = nameFontSize + dimsFontSize + lineGap + padY * 2;

    let planPoint = polygonInteriorLabelPoint(room.polygon);
    planPoint = nudgeFromDoorSwings(planPoint, room, doors, walls);

    const edgeDist = distToPolygonEdge(planPoint, room.polygon);
    if (edgeDist < bgHeight * 0.35) {
      const c = polygonCentroid(room.polygon);
      const dx = planPoint[0] - c[0];
      const dy = planPoint[1] - c[1];
      const len = Math.hypot(dx, dy) || 1;
      planPoint = [
        planPoint[0] + (dx / len) * 0.6,
        planPoint[1] + (dy / len) * 0.6,
      ];
      if (!pointInPolygon(planPoint, room.polygon)) {
        planPoint = polygonInteriorLabelPoint(room.polygon);
      }
    }

    const [cx, cy] = toSvgPoint(planPoint, plotHeight);

    layouts.push({
      roomId: room.id,
      cx,
      cy,
      name,
      dimensions: dims,
      nameFontSize,
      dimsFontSize,
      bgWidth,
      bgHeight,
    });
  }

  return layouts;
}

const warnedRooms = new Set<string>();
const warnedDeprecatedLabel = new Set<string>();

/** Warn when JSON rooms lack a rendered label or use deprecated `label` field. */
export function validateRoomLabels(rooms: Room[], layouts: RoomLabelLayout[]): void {
  const rendered = new Set(layouts.map((l) => l.roomId));

  for (const room of rooms) {
    if (!rendered.has(room.id) && !warnedRooms.has(room.id)) {
      warnedRooms.add(room.id);
      console.warn(
        `[floor-plan] No label rendered for room "${room.name}" (id: ${room.id}). Check polygon data.`,
      );
    }

    if (
      room.label != null &&
      room.label !== room.name &&
      !warnedDeprecatedLabel.has(room.id)
    ) {
      warnedDeprecatedLabel.add(room.id);
      console.warn(
        `[floor-plan] Room "${room.id}": ignoring deprecated label "${room.label}" — using room.name "${room.name}".`,
      );
    }
  }
}
