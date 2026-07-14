import type { Wall } from "@/types/floor-plan";
import {
  perpendicular,
  pointsToSvgPath,
  toSvgPoint,
  wallDirection,
} from "@/lib/geometry";

interface WallsLayerProps {
  walls: Wall[];
  plotHeight: number;
  premium?: boolean;
}

function wallPolygon(
  start: readonly [number, number],
  end: readonly [number, number],
  thickness: number,
) {
  const dir = wallDirection(start, end);
  const perp = perpendicular(dir);
  const half = thickness / 2;
  return [
    [start[0] + perp[0] * half, start[1] + perp[1] * half],
    [end[0] + perp[0] * half, end[1] + perp[1] * half],
    [end[0] - perp[0] * half, end[1] - perp[1] * half],
    [start[0] - perp[0] * half, start[1] - perp[1] * half],
  ] as const;
}

export function WallsLayer({ walls, plotHeight, premium }: WallsLayerProps) {
  if (!premium) {
    return (
      <g className="walls">
        {walls.map((wall) => {
          const [x1, y1] = toSvgPoint(wall.start, plotHeight);
          const [x2, y2] = toSvgPoint(wall.end, plotHeight);
          const isExternal = wall.type === "external";
          return (
            <line
              key={wall.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isExternal ? "#0d0d0d" : "#2a2a2a"}
              strokeWidth={wall.thickness}
              strokeLinecap="square"
            />
          );
        })}
      </g>
    );
  }

  return (
    <g className="walls" filter="url(#soft-shadow)">
      {walls.map((wall) => {
        const poly = wallPolygon(wall.start, wall.end, wall.thickness);
        const isExternal = wall.type === "external";
        return (
          <path
            key={wall.id}
            d={pointsToSvgPath([...poly], plotHeight)}
            fill={isExternal ? "url(#wall-external)" : "url(#wall-internal)"}
            stroke="#1a1510"
            strokeWidth={0.04}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}
