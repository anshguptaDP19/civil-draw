"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Wall } from "@/types/floor-plan";
import type { BuildingFootprint } from "@/lib/floor-plan-3d";
import {
  BASE_BEAM_HEIGHT,
  MAT,
  ROOF_THICKNESS,
  wallAngle,
  wallLength,
} from "@/lib/floor-plan-3d";

interface BaseBeam3DProps {
  walls: Wall[];
  elevation?: number;
}

/** Perimeter plinth beam along external walls only. */
export function BaseBeam3D({ walls, elevation = 0 }: BaseBeam3DProps) {
  const external = walls.filter((w) => w.type === "external");

  return (
    <group>
      {external.map((wall) => {
        const len = wallLength(wall.start, wall.end);
        if (len < 0.05) return null;

        const cx = (wall.start[0] + wall.end[0]) / 2;
        const cz = (wall.start[1] + wall.end[1]) / 2;
        const angle = wallAngle(wall.start, wall.end);

        return (
          <mesh
            key={`base-beam-${wall.id}`}
            position={[cx, elevation + BASE_BEAM_HEIGHT / 2, cz]}
            rotation={[0, -angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[len, BASE_BEAM_HEIGHT, wall.thickness + 0.25]} />
            <meshStandardMaterial
              color={MAT.column.color}
              roughness={MAT.column.roughness}
              metalness={MAT.column.metalness}
            />
          </mesh>
        );
      })}
    </group>
  );
}

interface Roof3DProps {
  footprint: BuildingFootprint;
  elevation: number;
}

/** Flat roof slab sized to the house footprint only. */
export function Roof3D({ footprint, elevation }: Roof3DProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(footprint.width, 0);
    shape.lineTo(footprint.width, footprint.depth);
    shape.lineTo(0, footprint.depth);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: ROOF_THICKNESS,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [footprint.width, footprint.depth]);

  return (
    <group position={[footprint.minX, elevation, footprint.minY]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#b0aca4"
          roughness={0.88}
          metalness={0.03}
        />
      </mesh>
    </group>
  );
}
