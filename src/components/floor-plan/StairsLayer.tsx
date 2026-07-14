import type { ReactNode } from "react";
import type { Stairs } from "@/types/floor-plan";
import {
  normalizeVector,
  pointsToSvgPath,
  polygonCentroid,
  toSvgPoint,
} from "@/lib/geometry";

interface StairsLayerProps {
  stairs?: Stairs;
  plotHeight: number;
}

export function StairsLayer({ stairs, plotHeight }: StairsLayerProps) {
  if (!stairs) return null;

  const centroid = polygonCentroid(stairs.polygon);
  const up = normalizeVector(stairs.up_direction);
  const [cx, cy] = toSvgPoint(centroid, plotHeight);

  const arrowTip = toSvgPoint(
    [centroid[0] + up[0] * 2, centroid[1] + up[1] * 2],
    plotHeight,
  );
  const arrowBase = toSvgPoint(
    [centroid[0] - up[0] * 1.5, centroid[1] - up[1] * 1.5],
    plotHeight,
  );

  const perp = [-up[1], up[0]] as const;
  const headSize = 0.6;
  const head1 = toSvgPoint(
    [
      centroid[0] + up[0] * 2 - perp[0] * headSize,
      centroid[1] + up[1] * 2 - perp[1] * headSize,
    ],
    plotHeight,
  );
  const head2 = toSvgPoint(
    [
      centroid[0] + up[0] * 2 + perp[0] * headSize,
      centroid[1] + up[1] * 2 + perp[1] * headSize,
    ],
    plotHeight,
  );

  const bounds = stairs.polygon.reduce(
    (acc, p) => {
      const [x, y] = toSvgPoint(p, plotHeight);
      return {
        minX: Math.min(acc.minX, x),
        maxX: Math.max(acc.maxX, x),
        minY: Math.min(acc.minY, y),
        maxY: Math.max(acc.maxY, y),
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );

  const stepLines: ReactNode[] = [];
  const steps = Math.min(stairs.steps, 20);
  const isVertical = Math.abs(up[1]) > Math.abs(up[0]);

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isVertical) {
      const y =
        bounds.minY + (bounds.maxY - bounds.minY) * (up[1] > 0 ? 1 - t : t);
      stepLines.push(
        <line
          key={`step-${i}`}
          x1={bounds.minX}
          y1={y}
          x2={bounds.maxX}
          y2={y}
          stroke="#888"
          strokeWidth={0.06}
        />,
      );
    } else {
      const x =
        bounds.minX + (bounds.maxX - bounds.minX) * (up[0] > 0 ? 1 - t : t);
      stepLines.push(
        <line
          key={`step-${i}`}
          x1={x}
          y1={bounds.minY}
          x2={x}
          y2={bounds.maxY}
          stroke="#888"
          strokeWidth={0.06}
        />,
      );
    }
  }

  return (
    <g className="stairs">
      <path
        d={pointsToSvgPath(stairs.polygon, plotHeight)}
        fill="#e8e8e8"
        stroke="#333"
        strokeWidth={0.1}
      />
      {stepLines}
      <line
        x1={arrowBase[0]}
        y1={arrowBase[1]}
        x2={arrowTip[0]}
        y2={arrowTip[1]}
        stroke="#c2410c"
        strokeWidth={0.15}
        markerEnd="none"
      />
      <polygon
        points={`${arrowTip[0]},${arrowTip[1]} ${head1[0]},${head1[1]} ${head2[0]},${head2[1]}`}
        fill="#c2410c"
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        fontSize={0.8}
        fontFamily="Arial, sans-serif"
        fill="#555"
      >
        UP
      </text>
    </g>
  );
}
