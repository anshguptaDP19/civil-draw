import {
  LABEL_BG,
  LABEL_BG_STROKE,
  type RoomLabelLayout,
} from "@/lib/floor-plan/room-labels";

interface RoomLabelsLayerProps {
  layouts: RoomLabelLayout[];
  premium?: boolean;
}

export function RoomLabelsLayer({ layouts, premium }: RoomLabelsLayerProps) {
  const fontFamily = premium
    ? "Georgia, 'Times New Roman', serif"
    : "Arial, Helvetica, sans-serif";

  return (
    <g className="room-labels">
      {layouts.map((layout) => {
        const { cx, cy, bgWidth, bgHeight, nameFontSize, dimsFontSize } = layout;
        const lineGap = 0.22;
        const nameY = cy - (dimsFontSize + lineGap) / 2;
        const dimsY = cy + (nameFontSize + lineGap) / 2;

        return (
          <g key={layout.roomId}>
            <rect
              x={cx - bgWidth / 2}
              y={cy - bgHeight / 2}
              width={bgWidth}
              height={bgHeight}
              rx={0.22}
              fill={LABEL_BG}
              stroke={LABEL_BG_STROKE}
              strokeWidth={0.04}
            />
            <text
              x={cx}
              y={nameY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={nameFontSize}
              fontFamily={fontFamily}
              fontWeight={700}
              letterSpacing={premium ? "0.12em" : "0"}
              fill={premium ? "#2c2418" : "#1a1a1a"}
            >
              {layout.name}
            </text>
            <text
              x={cx}
              y={dimsY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={dimsFontSize}
              fontFamily={fontFamily}
              fill={premium ? "#6b5d4a" : "#555"}
            >
              {layout.dimensions}
            </text>
          </g>
        );
      })}
    </g>
  );
}
