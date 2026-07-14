import type { Floor, FloorPlanMeta } from "@/types/floor-plan";
import {
  computeRoomLabelLayouts,
  validateRoomLabels,
} from "@/lib/floor-plan/room-labels";

import { NorthIndicator, ScaleBar } from "@/components/floor-plan/Annotations";
import { DoorsLayer } from "@/components/floor-plan/DoorsLayer";
import { ExteriorDimensionLayer } from "@/components/floor-plan/ExteriorDimensionLayer";
import { FurnitureLayer } from "@/components/floor-plan/FurnitureLayer";
import { PremiumDefs } from "@/components/floor-plan/PremiumDefs";
import { RoomLabelsLayer } from "@/components/floor-plan/RoomLabelsLayer";
import { RoomLayer } from "@/components/floor-plan/RoomLayer";
import { StairsLayer } from "@/components/floor-plan/StairsLayer";
import { WallsLayer } from "@/components/floor-plan/WallsLayer";
import { WindowsLayer } from "@/components/floor-plan/WindowsLayer";

export interface RenderFloorPlanInput {
  floor: Floor;
  meta: FloorPlanMeta;
  title?: string;
}

/**
 * Single entry point for 2D floor-plan SVG content.
 * Z-order: fills → furniture → walls → openings → exterior dims → room labels → annotations.
 */
export function renderFloorPlan({ floor, meta, title }: RenderFloorPlanInput) {
  const plotHeight = meta.plot.height;
  const premium = meta.style === "premium";
  const padding = premium ? 5 : 4;
  const viewWidth = meta.plot.width + padding * 2;
  const viewHeight = plotHeight + padding * 2 + (premium ? 4 : 3);

  const labelLayouts = computeRoomLabelLayouts(
    floor.rooms,
    floor.doors,
    floor.walls,
    plotHeight,
    premium,
  );
  validateRoomLabels(floor.rooms, labelLayouts);

  return {
    viewBox: `${-padding} ${-padding - 2} ${viewWidth} ${viewHeight}`,
    padding,
    plotHeight,
    premium,
    content: (
      <>
        <PremiumDefs />

        <rect
          x={-padding}
          y={-padding - 2}
          width={viewWidth}
          height={viewHeight}
          fill={premium ? "#faf8f4" : "#ffffff"}
          rx={premium ? 0.3 : 0}
        />

        {title && (
          <text
            x={meta.plot.width / 2}
            y={-padding - 0.5}
            textAnchor="middle"
            fontSize={premium ? 1.6 : 1.4}
            fontWeight={700}
            fill="#2c2418"
            letterSpacing={premium ? "0.08em" : "0"}
          >
            {title}
          </text>
        )}

        {/* 1. Room floor fills */}
        <RoomLayer rooms={floor.rooms} plotHeight={plotHeight} premium={premium} />
        <StairsLayer stairs={floor.stairs} plotHeight={plotHeight} />

        {/* 2. Furniture */}
        {floor.furniture && floor.furniture.length > 0 && (
          <FurnitureLayer items={floor.furniture} plotHeight={plotHeight} />
        )}

        {/* 3. Walls */}
        <WallsLayer walls={floor.walls} plotHeight={plotHeight} premium={premium} />

        {/* 4. Doors & windows */}
        <WindowsLayer
          windows={floor.windows.filter((w) => w.width > 0)}
          walls={floor.walls}
          plotHeight={plotHeight}
          premium={premium}
        />
        <DoorsLayer
          doors={floor.doors.filter((d) => d.width > 0)}
          walls={floor.walls}
          plotHeight={plotHeight}
          premium={premium}
        />

        {/* 5. Exterior dimension lines */}
        {premium && (
          <ExteriorDimensionLayer walls={floor.walls} plotHeight={plotHeight} />
        )}

        {/* 6. Room name + dimension labels (on top of furniture) */}
        <RoomLabelsLayer layouts={labelLayouts} premium={premium} />

        {/* 7. Compass, scale, subtitle */}
        <NorthIndicator
          northAngleDeg={meta.north_angle_deg}
          plotWidth={meta.plot.width}
          plotHeight={plotHeight}
        />
        <ScaleBar
          unit={meta.unit}
          scale={meta.scale}
          plotWidth={meta.plot.width}
          plotHeight={plotHeight}
        />

        <text
          x={meta.plot.width / 2}
          y={plotHeight + 1.5}
          textAnchor="middle"
          fontSize={0.7}
          fill="#8a7a68"
          fontStyle="italic"
          letterSpacing="0.15em"
        >
          {floor.floor_id.toUpperCase()} FLOOR PLAN
        </text>
      </>
    ),
  };
}
