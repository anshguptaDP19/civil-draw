import type { Wall } from "@/types/floor-plan";
import { buildingFootprintFromWalls, toSvgPoint } from "@/lib/geometry";

interface ExteriorDimensionLayerProps {
  walls: Wall[];
  plotHeight: number;
}

function formatFt(n: number) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? `${r}'` : `${r.toFixed(1)}'`;
}

/** Exterior building dimensions only — offset outside the outline, never inside rooms. */
export function ExteriorDimensionLayer({ walls, plotHeight }: ExteriorDimensionLayerProps) {
  const fp = buildingFootprintFromWalls(walls);
  if (!fp) return null;

  const { minX, maxX, minY, maxY } = fp;
  const width = maxX - minX;
  const depth = maxY - minY;
  const offset = 2.6;

  const [leftX] = toSvgPoint([minX, minY], plotHeight);
  const [rightX] = toSvgPoint([maxX, minY], plotHeight);
  const [, topY] = toSvgPoint([minX, maxY], plotHeight);
  const [, botY] = toSvgPoint([minX, minY], plotHeight);

  const dimTopY = topY - offset;
  const dimLeftX = leftX - offset;

  return (
    <g className="exterior-dimensions" opacity={0.7}>
      {/* width — above north edge */}
      <line x1={leftX} y1={dimTopY} x2={rightX} y2={dimTopY} stroke="#b0a090" strokeWidth={0.05} />
      <line x1={leftX} y1={dimTopY - 0.22} x2={leftX} y2={dimTopY + 0.22} stroke="#b0a090" strokeWidth={0.05} />
      <line x1={rightX} y1={dimTopY - 0.22} x2={rightX} y2={dimTopY + 0.22} stroke="#b0a090" strokeWidth={0.05} />
      <text
        x={(leftX + rightX) / 2}
        y={dimTopY - 0.38}
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize={0.68}
        fill="#8a7a68"
      >
        {formatFt(width)}
      </text>

      {/* depth — left of west edge */}
      <line x1={dimLeftX} y1={botY} x2={dimLeftX} y2={topY} stroke="#b0a090" strokeWidth={0.05} />
      <line x1={dimLeftX - 0.22} y1={botY} x2={dimLeftX + 0.22} y2={botY} stroke="#b0a090" strokeWidth={0.05} />
      <line x1={dimLeftX - 0.22} y1={topY} x2={dimLeftX + 0.22} y2={topY} stroke="#b0a090" strokeWidth={0.05} />
      <text
        x={dimLeftX - 0.45}
        y={(botY + topY) / 2}
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize={0.68}
        fill="#8a7a68"
        transform={`rotate(-90, ${dimLeftX - 0.45}, ${(botY + topY) / 2})`}
      >
        {formatFt(depth)}
      </text>
    </g>
  );
}
