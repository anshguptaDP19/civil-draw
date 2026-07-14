"use client";

import type { Point } from "@/types/floor-plan";
import { COLUMN_EXTENSION, COLUMN_SIZE, MAT, WALL_HEIGHT } from "@/lib/floor-plan-3d";

interface Structure3DProps {
  columns: Point[];
  elevation: number;
  wallHeight: number;
  extendAbove?: boolean;
}

export function Structure3D({
  columns,
  elevation,
  wallHeight,
  extendAbove = false,
}: Structure3DProps) {
  const totalH = wallHeight + (extendAbove ? COLUMN_EXTENSION : 0);

  return (
    <group>
      {columns.map((col, i) => (
        <mesh
          key={`col-${i}-${col[0]}-${col[1]}`}
          position={[col[0], elevation + totalH / 2, col[1]]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[COLUMN_SIZE, totalH, COLUMN_SIZE]} />
          <meshStandardMaterial
            color={MAT.column.color}
            roughness={MAT.column.roughness}
            metalness={MAT.column.metalness}
          />
        </mesh>
      ))}
    </group>
  );
}
