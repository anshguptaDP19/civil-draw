"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MAT, SLAB_THICKNESS } from "@/lib/floor-plan-3d";

interface Slab3DProps {
  width: number;
  depth: number;
  elevation: number;
}

export function Slab3D({ width, depth, elevation }: Slab3DProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(width, 0);
    shape.lineTo(width, depth);
    shape.lineTo(0, depth);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: SLAB_THICKNESS,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [width, depth]);

  return (
    <mesh geometry={geometry} position={[0, elevation, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        color={MAT.slab.color}
        roughness={MAT.slab.roughness}
        metalness={MAT.slab.metalness}
      />
    </mesh>
  );
}

/** Plot outline on ground — white boundary like Higharc previews. */
export function PlotOutline3D({
  width,
  depth,
}: {
  width: number;
  depth: number;
}) {
  const points = useMemo(
    () =>
      new Float32Array([
        0, 0.02, 0,
        width, 0.02, 0,
        width, 0.02, depth,
        0, 0.02, depth,
        0, 0.02, 0,
      ]),
    [width, depth],
  );

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#e8e8ec" linewidth={1} />
    </line>
  );
}
