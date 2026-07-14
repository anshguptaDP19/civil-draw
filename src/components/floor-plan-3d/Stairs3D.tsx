"use client";

import { useMemo } from "react";
import type { Stairs } from "@/types/floor-plan";
import { normalizeVector } from "@/lib/geometry";
import { planTo3D } from "@/lib/floor-plan-3d";

interface Stairs3DProps {
  stairs?: Stairs;
  elevation: number;
  totalRise?: number;
}

export function Stairs3D({ stairs, elevation, totalRise = 9 }: Stairs3DProps) {
  const steps = useMemo(() => {
    if (!stairs) return [];

    const up = normalizeVector(stairs.up_direction);
    const xs = stairs.polygon.map((p) => p[0]);
    const ys = stairs.polygon.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const stepCount = Math.min(stairs.steps, 20);
    const stepRise = totalRise / stepCount;
    const result: {
      x: number;
      z: number;
      width: number;
      depth: number;
      height: number;
      y: number;
    }[] = [];

    const alongX = Math.abs(up[0]) > Math.abs(up[1]);

    for (let i = 0; i < stepCount; i++) {
      const t0 = i / stepCount;
      const t1 = (i + 1) / stepCount;

      if (alongX) {
        const x0 = up[0] > 0 ? minX + (maxX - minX) * t0 : maxX - (maxX - minX) * t0;
        const x1 = up[0] > 0 ? minX + (maxX - minX) * t1 : maxX - (maxX - minX) * t1;
        const depth = Math.abs(x1 - x0) || (maxX - minX) / stepCount;
        result.push({
          x: (x0 + x1) / 2,
          z: (minY + maxY) / 2,
          width: depth,
          depth: maxY - minY,
          height: stepRise * (i + 1),
          y: elevation,
        });
      } else {
        const z0 = up[1] > 0 ? minY + (maxY - minY) * t0 : maxY - (maxY - minY) * t0;
        const z1 = up[1] > 0 ? minY + (maxY - minY) * t1 : maxY - (maxY - minY) * t1;
        const depth = Math.abs(z1 - z0) || (maxY - minY) / stepCount;
        result.push({
          x: (minX + maxX) / 2,
          z: (z0 + z1) / 2,
          width: maxX - minX,
          depth,
          height: stepRise * (i + 1),
          y: elevation,
        });
      }
    }

    return result;
  }, [stairs, elevation, totalRise]);

  if (!stairs) return null;

  return (
    <group>
      {steps.map((step, i) => (
        <mesh
          key={`stair-${i}`}
          position={[step.x, step.y + step.height / 2, step.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[step.width, step.height, step.depth]} />
          <meshStandardMaterial color="#b0b0b0" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
