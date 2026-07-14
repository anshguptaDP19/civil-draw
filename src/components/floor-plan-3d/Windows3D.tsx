"use client";

import type { Wall, Window } from "@/types/floor-plan";
import {
  MAT,
  WINDOW_HEIGHT,
  WINDOW_SILL_DEFAULT,
  planTo3D,
  wallAngle,
} from "@/lib/floor-plan-3d";
import { pointOnWall } from "@/lib/geometry";

interface Windows3DProps {
  windows: Window[];
  walls: Wall[];
  elevation: number;
  premium?: boolean;
}

export function Windows3D({ windows, walls, elevation, premium }: Windows3DProps) {
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  return (
    <group>
      {windows.map((win) => {
        const wall = wallMap.get(win.wall_id);
        if (!wall) return null;

        const center = pointOnWall(wall.start, wall.end, win.position_on_wall);
        const angle = wallAngle(wall.start, wall.end);
        const sill = win.sill_height ?? WINDOW_SILL_DEFAULT;
        const winCenterY = sill + WINDOW_HEIGHT / 2;
        const [x, , z] = planTo3D(center, elevation + winCenterY);
        const depth = wall.thickness;

        if (!premium) {
          return (
            <group key={win.id}>
              <mesh position={[x, elevation + winCenterY, z]} rotation={[0, -angle, 0]}>
                <boxGeometry args={[win.width, WINDOW_HEIGHT, depth * 0.3]} />
                <meshStandardMaterial color="#93c5fd" transparent opacity={0.55} />
              </mesh>
            </group>
          );
        }

        return (
          <group key={win.id} position={[x, elevation + winCenterY, z]} rotation={[0, -angle, 0]}>
            {/* Dark recessed opening */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[win.width, WINDOW_HEIGHT, depth * 0.85]} />
              <meshStandardMaterial color="#0a0a0c" roughness={1} metalness={0} />
            </mesh>
            {/* Glass pane */}
            <mesh position={[0, 0, depth * 0.22]}>
              <boxGeometry args={[win.width - 0.12, WINDOW_HEIGHT - 0.12, 0.05]} />
              <meshStandardMaterial
                color={MAT.glass.color}
                transparent
                opacity={MAT.glass.opacity}
                roughness={MAT.glass.roughness}
                metalness={MAT.glass.metalness}
              />
            </mesh>
            {/* Thin frame edges */}
            <mesh position={[0, 0, depth * 0.28]}>
              <boxGeometry args={[win.width + 0.06, WINDOW_HEIGHT + 0.06, 0.03]} />
              <meshStandardMaterial color={MAT.frame.color} roughness={0.5} metalness={0.25} />
            </mesh>
            {/* Sill overhang */}
            <mesh position={[0, -WINDOW_HEIGHT / 2 - 0.08, depth * 0.35]}>
              <boxGeometry args={[win.width + 0.35, 0.1, depth * 0.6]} />
              <meshStandardMaterial color={MAT.wallExt.color} roughness={0.9} />
            </mesh>
            {/* Lintel overhang */}
            <mesh position={[0, WINDOW_HEIGHT / 2 + 0.08, depth * 0.35]}>
              <boxGeometry args={[win.width + 0.35, 0.1, depth * 0.6]} />
              <meshStandardMaterial color={MAT.wallExt.color} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
