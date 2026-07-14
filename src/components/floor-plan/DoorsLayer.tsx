import type { Door, Wall } from "@/types/floor-plan";
import {
  perpendicular,
  pointOnWall,
  toSvgPoint,
  wallDirection,
} from "@/lib/geometry";

interface DoorsLayerProps {
  doors: Door[];
  walls: Wall[];
  plotHeight: number;
  premium?: boolean;
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const sweep = endAngle > startAngle ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
}

export function DoorsLayer({ doors, walls, plotHeight, premium }: DoorsLayerProps) {
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  return (
    <g className="doors">
      {doors.map((door) => {
        const wall = wallMap.get(door.wall_id);
        if (!wall) return null;

        const dir = wallDirection(wall.start, wall.end);
        const perp = perpendicular(dir);

        const center = pointOnWall(wall.start, wall.end, door.position_on_wall);
        const halfWidth = door.width / 2;

        const openingStart = [
          center[0] - dir[0] * halfWidth,
          center[1] - dir[1] * halfWidth,
        ] as const;
        const openingEnd = [
          center[0] + dir[0] * halfWidth,
          center[1] + dir[1] * halfWidth,
        ] as const;

        const [sx, sy] = toSvgPoint(openingStart, plotHeight);
        const [ex, ey] = toSvgPoint(openingEnd, plotHeight);

        const hinge = door.swing === "left" ? openingStart : openingEnd;
        const [hx, hy] = toSvgPoint(hinge, plotHeight);

        const leafEnd = [
          hinge[0] + perp[0] * door.width,
          hinge[1] + perp[1] * door.width,
        ] as const;
        const [lx, ly] = toSvgPoint(leafEnd, plotHeight);

        const svgDir = toSvgPoint(
          [center[0] + dir[0], center[1] + dir[1]],
          plotHeight,
        );
        const svgCenter = toSvgPoint(center, plotHeight);
        const angleDir = Math.atan2(
          svgDir[1] - svgCenter[1],
          svgDir[0] - svgCenter[0],
        );
        const anglePerp = Math.atan2(
          toSvgPoint([center[0] + perp[0], center[1] + perp[1]], plotHeight)[1] -
            svgCenter[1],
          toSvgPoint([center[0] + perp[0], center[1] + perp[1]], plotHeight)[0] -
            svgCenter[0],
        );

        const arcStart = door.swing === "left" ? angleDir : anglePerp;
        const arcEnd = door.swing === "left" ? anglePerp : angleDir;

        return (
          <g key={door.id}>
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="#ffffff"
              strokeWidth={wall.thickness + 0.15}
              strokeLinecap="butt"
            />
            <line
              x1={hx}
              y1={hy}
              x2={lx}
              y2={ly}
              stroke={premium ? "#4a4038" : "#1a1a1a"}
              strokeWidth={premium ? 0.1 : 0.08}
            />
            <path
              d={describeArc(hx, hy, door.width, arcStart, arcEnd)}
              fill="none"
              stroke={premium ? "#a09080" : "#888888"}
              strokeWidth={premium ? 0.05 : 0.045}
              strokeDasharray={premium ? "0.22 0.2" : "0.25 0.22"}
              opacity={0.62}
            />
          </g>
        );
      })}
    </g>
  );
}
