import type { FloorFinish, Room } from "@/types/floor-plan";
import { pointsToSvgPath } from "@/lib/geometry";
import { finishPatternId } from "./PremiumDefs";

interface RoomLayerProps {
  rooms: Room[];
  plotHeight: number;
  premium?: boolean;
}

/** Room floor fills only — labels rendered separately in RoomLabelsLayer. */
export function RoomLayer({ rooms, plotHeight, premium }: RoomLayerProps) {
  return (
    <g className="rooms">
      {rooms.map((room) => {
        const fill = premium
          ? finishPatternId(room.floor_finish as FloorFinish)
          : "#f8f9fa";

        return (
          <g key={room.id}>
            <path
              d={pointsToSvgPath(room.polygon, plotHeight)}
              fill={fill}
              stroke="none"
            />
            {premium && (
              <path
                d={pointsToSvgPath(room.polygon, plotHeight)}
                fill="none"
                stroke="rgba(0,0,0,0.04)"
                strokeWidth={0.06}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
