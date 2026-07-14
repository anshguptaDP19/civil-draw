import type { Wall, Window } from "@/types/floor-plan";
import {
  perpendicular,
  pointOnWall,
  toSvgPoint,
  wallDirection,
} from "@/lib/geometry";

interface WindowsLayerProps {
  windows: Window[];
  walls: Wall[];
  plotHeight: number;
  premium?: boolean;
}

export function WindowsLayer({ windows, walls, plotHeight, premium }: WindowsLayerProps) {
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  return (
    <g className="windows">
      {windows.map((win) => {
        const wall = wallMap.get(win.wall_id);
        if (!wall) return null;

        const dir = wallDirection(wall.start, wall.end);
        const perp = perpendicular(dir);
        const center = pointOnWall(wall.start, wall.end, win.position_on_wall);
        const halfWidth = win.width / 2;

        const start = [
          center[0] - dir[0] * halfWidth,
          center[1] - dir[1] * halfWidth,
        ] as const;
        const end = [
          center[0] + dir[0] * halfWidth,
          center[1] + dir[1] * halfWidth,
        ] as const;

        const [sx, sy] = toSvgPoint(start, plotHeight);
        const [ex, ey] = toSvgPoint(end, plotHeight);

        const offset = wall.thickness * 0.35;
        const line1Start = toSvgPoint(
          [start[0] + perp[0] * offset, start[1] + perp[1] * offset],
          plotHeight,
        );
        const line1End = toSvgPoint(
          [end[0] + perp[0] * offset, end[1] + perp[1] * offset],
          plotHeight,
        );
        const line2Start = toSvgPoint(
          [start[0] - perp[0] * offset, start[1] - perp[1] * offset],
          plotHeight,
        );
        const line2End = toSvgPoint(
          [end[0] - perp[0] * offset, end[1] - perp[1] * offset],
          plotHeight,
        );

        return (
          <g key={win.id}>
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="#ffffff"
              strokeWidth={wall.thickness + 0.1}
              strokeLinecap="butt"
            />
            <line
              x1={line1Start[0]}
              y1={line1Start[1]}
              x2={line1End[0]}
              y2={line1End[1]}
              stroke={premium ? "#7eb0d8" : "#2563eb"}
              strokeWidth={premium ? 0.14 : 0.12}
            />
            <line
              x1={line2Start[0]}
              y1={line2Start[1]}
              x2={line2End[0]}
              y2={line2End[1]}
              stroke={premium ? "#7eb0d8" : "#2563eb"}
              strokeWidth={premium ? 0.14 : 0.12}
            />
          </g>
        );
      })}
    </g>
  );
}
