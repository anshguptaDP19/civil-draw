"use client";

import { useMemo } from "react";
import type { Door, Wall } from "@/types/floor-plan";
import {
  DOOR_HEIGHT,
  MAT,
  planTo3D,
  splitWallAtOpenings,
  wallAngle,
  wallLength,
} from "@/lib/floor-plan-3d";
import { pointOnWall } from "@/lib/geometry";

interface Walls3DProps {
  walls: Wall[];
  doors: Door[];
  windows: { wall_id: string; position_on_wall: number; width: number }[];
  elevation: number;
  wallHeight: number;
  premium?: boolean;
}

function WallBox({
  start,
  end,
  thickness,
  height,
  elevation,
  isExternal,
  premium,
}: {
  start: readonly [number, number];
  end: readonly [number, number];
  thickness: number;
  height: number;
  elevation: number;
  isExternal: boolean;
  premium?: boolean;
}) {
  const len = wallLength(start, end);
  if (len < 0.05) return null;

  const cx = (start[0] + end[0]) / 2;
  const cz = (start[1] + end[1]) / 2;
  const angle = wallAngle(start, end);
  const y = elevation + height / 2;
  const mat = isExternal ? MAT.wallExt : MAT.wallInt;

  return (
    <mesh
      position={[cx, y, cz]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[len, height, thickness]} />
      <meshStandardMaterial
        color={premium ? mat.color : isExternal ? "#d4d4d4" : "#e8e8e8"}
        roughness={mat.roughness}
        metalness={mat.metalness}
      />
    </mesh>
  );
}

export function Walls3D({
  walls,
  doors,
  windows,
  elevation,
  wallHeight,
  premium,
}: Walls3DProps) {
  const segments = useMemo(() => {
    return walls.flatMap((wall) => {
      const openings = [
        ...doors
          .filter((d) => d.wall_id === wall.id)
          .map((d) => ({ position: d.position_on_wall, width: d.width })),
        ...windows
          .filter((w) => w.wall_id === wall.id)
          .map((w) => ({ position: w.position_on_wall, width: w.width })),
      ];

      return splitWallAtOpenings(wall.start, wall.end, openings).map((seg) => ({
        ...seg,
        thickness: wall.thickness,
        isExternal: wall.type === "external",
        wallId: wall.id,
      }));
    });
  }, [walls, doors, windows]);

  return (
    <group>
      {segments.map((seg, i) => (
        <WallBox
          key={`${seg.wallId}-${i}`}
          start={seg.start}
          end={seg.end}
          thickness={seg.thickness}
          height={wallHeight}
          elevation={elevation}
          isExternal={seg.isExternal}
          premium={premium}
        />
      ))}
    </group>
  );
}

interface Doors3DProps {
  doors: Door[];
  walls: Wall[];
  elevation: number;
  premium?: boolean;
}

export function Doors3D({ doors, walls, elevation, premium }: Doors3DProps) {
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  return (
    <group>
      {doors.map((door) => {
        const wall = wallMap.get(door.wall_id);
        if (!wall) return null;

        const center = pointOnWall(wall.start, wall.end, door.position_on_wall);
        const angle = wallAngle(wall.start, wall.end);
        const [x, , z] = planTo3D(center, elevation + DOOR_HEIGHT / 2);
        const depth = wall.thickness;

        return (
          <group key={door.id} position={[x, elevation + DOOR_HEIGHT / 2, z]} rotation={[0, -angle, 0]}>
            {premium && (
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[door.width + 0.2, DOOR_HEIGHT + 0.2, depth + 0.15]} />
                <meshStandardMaterial color={MAT.frame.color} roughness={0.7} metalness={0.15} />
              </mesh>
            )}
            <mesh castShadow>
              <boxGeometry args={[door.width, DOOR_HEIGHT, depth * 0.35]} />
              <meshStandardMaterial
                color={premium ? MAT.door.color : "#8b6914"}
                roughness={MAT.door.roughness}
                metalness={MAT.door.metalness}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
