"use client";

import { useMemo } from "react";
import { Doors3D, Walls3D } from "./Walls3D";
import { Rooms3D } from "./Rooms3D";
import { Windows3D } from "./Windows3D";
import { Stairs3D } from "./Stairs3D";
import { Structure3D } from "./Structure3D";
import { Slab3D } from "./Slab3D";
import { BaseBeam3D, Roof3D } from "./HouseEnvelope3D";
import type { Floor, FloorPlanMeta } from "@/types/floor-plan";
import {
  BASE_BEAM_HEIGHT,
  SLAB_THICKNESS,
  WALL_HEIGHT,
  buildingFootprint,
  collectColumnPositions,
  levelOffset,
} from "@/lib/floor-plan-3d";

interface FloorLevel3DProps {
  floor: Floor;
  elevation: number;
  wallHeight: number;
  premium?: boolean;
  showStructure?: boolean;
  isTopStory?: boolean;
  showRoof?: boolean;
}

function FloorLevel3D({
  floor,
  elevation,
  wallHeight,
  premium,
  showStructure,
  isTopStory,
  showRoof,
}: FloorLevel3DProps) {
  const columns = useMemo(
    () => (showStructure ? collectColumnPositions(floor.walls) : []),
    [floor.walls, showStructure],
  );

  return (
    <group>
      <Rooms3D rooms={floor.rooms} elevation={elevation} premium={premium} />
      {showStructure && columns.length > 0 && (
        <Structure3D
          columns={columns}
          elevation={elevation}
          wallHeight={wallHeight}
          extendAbove={isTopStory && !showRoof}
        />
      )}
      <Walls3D
        walls={floor.walls}
        doors={floor.doors}
        windows={floor.windows}
        elevation={elevation}
        wallHeight={wallHeight}
        premium={premium}
      />
      <Doors3D doors={floor.doors} walls={floor.walls} elevation={elevation} premium={premium} />
      <Windows3D
        windows={floor.windows}
        walls={floor.walls}
        elevation={elevation}
        premium={premium}
      />
      <Stairs3D stairs={floor.stairs} elevation={elevation} totalRise={wallHeight} />
    </group>
  );
}

export interface FloorPlanSceneContentProps {
  floors: Floor[];
  meta: FloorPlanMeta;
  activeFloorIndex: number;
  showAllFloors: boolean;
  showRoof?: boolean;
  showBaseBeam?: boolean;
}

function resolveStoryFloors(floors: Floor[], storyCount: number): Floor[] {
  if (storyCount <= floors.length) return floors.slice(0, storyCount);
  const base = floors[0];
  if (!base) return floors;
  const result: Floor[] = [];
  for (let i = 0; i < storyCount; i++) {
    result.push({
      ...base,
      floor_id: i === 0 ? base.floor_id : `level_${i + 1}`,
      stairs: i === 0 ? base.stairs : undefined,
    });
  }
  return result;
}

export function FloorPlanSceneContent({
  floors,
  meta,
  activeFloorIndex,
  showAllFloors,
  showRoof = true,
  showBaseBeam = true,
}: FloorPlanSceneContentProps) {
  const premium = meta.style === "premium";
  const storyCount = meta.story_count ?? floors.length;
  const allStories = resolveStoryFloors(floors, storyCount);
  const offset = levelOffset();
  const baseFloor = allStories[0];
  const footprint = baseFloor ? buildingFootprint(baseFloor.walls) : null;

  const floorLevels = showAllFloors
    ? allStories
    : allStories[activeFloorIndex]
      ? [allStories[activeFloorIndex]]
      : [];

  const visibleStoryCount = floorLevels.length;
  const topStoryIndex = showAllFloors ? allStories.length - 1 : activeFloorIndex;
  const roofElevation =
    topStoryIndex * offset + WALL_HEIGHT + SLAB_THICKNESS;
  const showRoofHere =
    showRoof && (showAllFloors || activeFloorIndex === allStories.length - 1);

  return (
    <group>
      {showBaseBeam && baseFloor && (
        <BaseBeam3D walls={baseFloor.walls} elevation={0} />
      )}

      {floorLevels.map((floor, index) => {
        const storyIndex = showAllFloors ? index : activeFloorIndex;
        const elevation = storyIndex * offset + (showBaseBeam ? BASE_BEAM_HEIGHT : 0);
        const isTopStory = storyIndex === topStoryIndex;

        return (
          <group key={`${floor.floor_id}-${storyIndex}`}>
            <FloorLevel3D
              floor={floor}
              elevation={elevation}
              wallHeight={WALL_HEIGHT}
              premium={premium}
              showStructure={premium}
              isTopStory={isTopStory}
              showRoof={showRoof}
            />
            {/* Inter-floor slab (house footprint) */}
            {footprint && (
              <group position={[footprint.minX, 0, footprint.minY]}>
                <Slab3D
                  width={footprint.width}
                  depth={footprint.depth}
                  elevation={elevation + WALL_HEIGHT}
                />
              </group>
            )}
          </group>
        );
      })}

      {showRoofHere && footprint && visibleStoryCount > 0 && (
        <Roof3D
          footprint={footprint}
          elevation={roofElevation + (showBaseBeam ? BASE_BEAM_HEIGHT : 0)}
        />
      )}
    </group>
  );
}

export function getCameraTarget(
  meta: FloorPlanMeta,
  floorCount: number,
  showAllFloors: boolean,
  showRoof = true,
  showBaseBeam = true,
): { position: [number, number, number]; target: [number, number, number] } {
  const cx = meta.plot.width / 2;
  const cz = meta.plot.height / 2;
  const maxDim = Math.max(meta.plot.width, meta.plot.height);
  const stories = meta.story_count ?? floorCount;
  const stackHeight = showAllFloors ? stories * levelOffset() : WALL_HEIGHT;
  const baseOffset = showBaseBeam ? BASE_BEAM_HEIGHT : 0;
  const roofExtra = showRoof ? 1.2 : 0;
  const dist = maxDim * 1.35;

  return {
    position: [
      cx + dist * 0.75,
      stackHeight + baseOffset + roofExtra + dist * 0.5,
      cz + dist * 0.75,
    ],
    target: [cx, (stackHeight + baseOffset) * 0.45, cz],
  };
}
