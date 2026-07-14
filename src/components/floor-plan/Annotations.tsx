import type { ReactNode } from "react";
import type { PlotMeta } from "@/types/floor-plan";

interface PlotBoundaryProps {
  plot: PlotMeta;
  plotHeight: number;
}

export function PlotBoundary({ plot, plotHeight }: PlotBoundaryProps) {
  return (
    <g className="plot-boundary">
      <rect
        x={0}
        y={0}
        width={plot.width}
        height={plotHeight}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={0.15}
        strokeDasharray="1 0.5"
      />
      <text
        x={plot.width / 2}
        y={-1.5}
        textAnchor="middle"
        fontSize={0.9}
        fontFamily="Arial, sans-serif"
        fill="#64748b"
      >
        PLOT BOUNDARY — {plot.width}&apos; × {plot.height}&apos;
      </text>
    </g>
  );
}

interface NorthIndicatorProps {
  northAngleDeg: number;
  plotWidth: number;
  plotHeight: number;
}

export function NorthIndicator({
  northAngleDeg,
  plotWidth,
  plotHeight,
}: NorthIndicatorProps) {
  const cx = plotWidth - 3;
  const cy = 3;
  const arrowLen = 2;

  return (
    <g
      className="north-indicator"
      transform={`translate(${cx}, ${cy}) rotate(${-northAngleDeg})`}
    >
      <circle cx={0} cy={0} r={1.8} fill="#fff" stroke="#333" strokeWidth={0.1} />
      <line
        x1={0}
        y1={arrowLen * 0.5}
        x2={0}
        y2={-arrowLen * 0.8}
        stroke="#1a1a1a"
        strokeWidth={0.12}
      />
      <polygon
        points={`0,${-arrowLen} -0.4,${-arrowLen * 0.5} 0.4,${-arrowLen * 0.5}`}
        fill="#1a1a1a"
      />
      <text
        x={0}
        y={-arrowLen - 0.6}
        textAnchor="middle"
        fontSize={0.7}
        fontFamily="Arial, sans-serif"
        fontWeight={700}
        fill="#1a1a1a"
      >
        N
      </text>
    </g>
  );
}

interface ScaleBarProps {
  unit: string;
  scale: string;
  plotWidth: number;
  plotHeight: number;
}

export function ScaleBar({ unit, scale, plotWidth, plotHeight }: ScaleBarProps) {
  const barLen = 5;
  const x = 2;
  const y = plotHeight - 2;

  return (
    <g className="scale-bar">
      <line
        x1={x}
        y1={y}
        x2={x + barLen}
        y2={y}
        stroke="#1a1a1a"
        strokeWidth={0.15}
      />
      <line x1={x} y1={y - 0.4} x2={x} y2={y + 0.4} stroke="#1a1a1a" strokeWidth={0.1} />
      <line
        x1={x + barLen}
        y1={y - 0.4}
        x2={x + barLen}
        y2={y + 0.4}
        stroke="#1a1a1a"
        strokeWidth={0.1}
      />
      <text
        x={x + barLen / 2}
        y={y + 1.2}
        textAnchor="middle"
        fontSize={0.7}
        fontFamily="Arial, sans-serif"
        fill="#333"
      >
        {barLen} {unit}
      </text>
      <text
        x={plotWidth / 2}
        y={plotHeight + 2}
        textAnchor="middle"
        fontSize={0.8}
        fontFamily="Arial, sans-serif"
        fill="#555"
      >
        Scale {scale}
      </text>
    </g>
  );
}

interface GridLayerProps {
  plot: PlotMeta;
  plotHeight: number;
  spacing?: number;
}

export function GridLayer({ plot, plotHeight, spacing = 5 }: GridLayerProps) {
  const lines: ReactNode[] = [];

  for (let x = 0; x <= plot.width; x += spacing) {
    lines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={plotHeight}
        stroke="#e2e8f0"
        strokeWidth={0.04}
      />,
    );
  }

  for (let y = 0; y <= plotHeight; y += spacing) {
    lines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={plot.width}
        y2={y}
        stroke="#e2e8f0"
        strokeWidth={0.04}
      />,
    );
  }

  return <g className="grid">{lines}</g>;
}
