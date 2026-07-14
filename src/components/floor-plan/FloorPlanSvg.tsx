import type { Floor, FloorPlanMeta } from "@/types/floor-plan";
import { renderFloorPlan } from "@/lib/floor-plan/renderFloorPlan";

interface FloorPlanSvgProps {
  floor: Floor;
  meta: FloorPlanMeta;
  title?: string;
}

export function FloorPlanSvg({ floor, meta, title }: FloorPlanSvgProps) {
  const { viewBox, premium, content } = renderFloorPlan({ floor, meta, title });

  return (
    <svg
      viewBox={viewBox}
      className="h-full w-full"
      style={{
        fontFamily: premium
          ? "Georgia, 'Times New Roman', serif"
          : "Arial, Helvetica, sans-serif",
        background: premium ? "#faf8f4" : "#ffffff",
      }}
      role="img"
      aria-label={title ?? `Floor plan: ${floor.floor_id}`}
    >
      {content}
    </svg>
  );
}
