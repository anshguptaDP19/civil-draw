import type { Point, Room } from "@/types/floor-plan";

export function polygonBounds(polygon: Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, width: maxX - minX, depth: maxY - minY };
}

export function roomDisplayDimensions(room: Room) {
  const w = room.width_ft ?? polygonBounds(room.polygon).width;
  const d = room.depth_ft ?? polygonBounds(room.polygon).depth;
  const rw = Math.round(w * 10) / 10;
  const rd = Math.round(d * 10) / 10;
  return { width: rw, depth: rd, label: `${formatDim(rw)} x ${formatDim(rd)}` };
}

function formatDim(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function roomDisplayName(room: Room): string {
  return room.name.toUpperCase();
}

export function roomLabel(room: Room): string {
  return roomDisplayName(room);
}
