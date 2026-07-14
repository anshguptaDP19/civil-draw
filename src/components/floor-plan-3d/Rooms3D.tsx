"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Room } from "@/types/floor-plan";
import { FLOOR_THICKNESS, MAT, roomFloorColor } from "@/lib/floor-plan-3d";

interface Rooms3DProps {
  rooms: Room[];
  elevation: number;
  premium?: boolean;
}

function RoomFloor({
  room,
  color,
  elevation,
  premium,
}: {
  room: Room;
  color: string;
  elevation: number;
  premium?: boolean;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    room.polygon.forEach(([x, y], i) => {
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: FLOOR_THICKNESS,
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, elevation + FLOOR_THICKNESS, 0);
    return geo;
  }, [room.polygon, elevation]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color={premium ? color : "#f0f0f0"}
        roughness={premium ? 0.8 : 0.85}
        metalness={0.02}
      />
    </mesh>
  );
}

export function Rooms3D({ rooms, elevation, premium }: Rooms3DProps) {
  return (
    <group>
      {rooms.map((room, index) => (
        <RoomFloor
          key={room.id}
          room={room}
          color={roomFloorColor(room.floor_finish, index)}
          elevation={elevation}
          premium={premium}
        />
      ))}
    </group>
  );
}
