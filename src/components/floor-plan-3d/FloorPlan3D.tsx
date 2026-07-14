"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  FloorPlanSceneContent,
  getCameraTarget,
} from "./FloorPlanScene";
import { PlotOutline3D } from "./Slab3D";
import { MAT, buildingFootprint } from "@/lib/floor-plan-3d";
import type { Floor, FloorPlanMeta } from "@/types/floor-plan";

interface CameraSetupProps {
  meta: FloorPlanMeta;
  floorCount: number;
  showAllFloors: boolean;
  showRoof: boolean;
  showBaseBeam: boolean;
}

function CameraSetup({
  meta,
  floorCount,
  showAllFloors,
  showRoof,
  showBaseBeam,
}: CameraSetupProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const { position, target } = getCameraTarget(
    meta,
    floorCount,
    showAllFloors,
    showRoof,
    showBaseBeam,
  );

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    controlsRef.current?.target.set(...target);
    controlsRef.current?.update();
  }, [camera, position, target, meta.plot.width, meta.plot.height, showAllFloors, showRoof, showBaseBeam]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={target}
      enableDamping
      dampingFactor={0.06}
      minDistance={8}
      maxDistance={180}
      maxPolarAngle={Math.PI / 2.02}
      minPolarAngle={0.15}
    />
  );
}

interface FloorPlan3DProps {
  floors: Floor[];
  meta: FloorPlanMeta;
  activeFloorIndex: number;
  showAllFloors?: boolean;
  showRoof?: boolean;
  showBaseBeam?: boolean;
}

function Scene({
  floors,
  meta,
  activeFloorIndex,
  showAllFloors,
  showRoof = true,
  showBaseBeam = true,
}: FloorPlan3DProps) {
  const premium = meta.style === "premium";
  const cx = meta.plot.width / 2;
  const cz = meta.plot.height / 2;
  const groundSize = Math.max(meta.plot.width, meta.plot.height) * 3;
  const storyCount = meta.story_count ?? floors.length;
  const footprint = floors[0] ? buildingFootprint(floors[0].walls) : null;

  return (
    <>
      <color attach="background" args={[premium ? "#141416" : "#e8ecf0"]} />
      <fog attach="fog" args={[premium ? "#141416" : "#e8ecf0", 80, 220]} />

      <PerspectiveCamera makeDefault fov={42} near={0.1} far={500} />
      <CameraSetup
        meta={meta}
        floorCount={storyCount}
        showAllFloors={showAllFloors ?? true}
        showRoof={showRoof}
        showBaseBeam={showBaseBeam}
      />

      {/* Higharc-style lighting */}
      <ambientLight intensity={premium ? 0.35 : 0.55} />
      <hemisphereLight
        args={[premium ? "#c8d0e0" : "#ffffff", premium ? "#1a1a1e" : "#888888", 0.5]}
      />
      <directionalLight
        position={[meta.plot.width * 1.2, 45, meta.plot.height * 0.6]}
        intensity={premium ? 1.4 : 1.1}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[-20, 25, -15]}
        intensity={premium ? 0.25 : 0.35}
        color="#a0b8d8"
      />

      {premium && <Environment preset="city" environmentIntensity={0.45} />}

      <FloorPlanSceneContent
        floors={floors}
        meta={meta}
        activeFloorIndex={activeFloorIndex}
        showAllFloors={showAllFloors ?? true}
        showRoof={showRoof}
        showBaseBeam={showBaseBeam}
      />

      {/* Dark ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.36, cz]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial
          color={premium ? MAT.ground.color : "#d0d4d8"}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {premium && footprint && (
        <group position={[footprint.minX, 0, footprint.minY]}>
          <PlotOutline3D width={footprint.width} depth={footprint.depth} />
        </group>
      )}

      {premium && (
        <ContactShadows
          position={[cx, -0.34, cz]}
          opacity={0.55}
          scale={groundSize * 0.6}
          blur={2.2}
          far={50}
          resolution={1024}
          color="#000000"
        />
      )}
    </>
  );
}

export function FloorPlan3D({
  floors,
  meta,
  activeFloorIndex,
  showAllFloors = true,
  showRoof = true,
  showBaseBeam = true,
}: FloorPlan3DProps) {
  const premium = meta.style === "premium";

  return (
    <Canvas
      shadows
      className="h-full w-full"
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: premium ? 1.05 : 1,
      }}
      style={{
        background: premium ? "#141416" : "linear-gradient(180deg, #e2e8f0 0%, #f8fafc 60%)",
      }}
    >
      <Suspense fallback={null}>
        <Scene
          floors={floors}
          meta={meta}
          activeFloorIndex={activeFloorIndex}
          showAllFloors={showAllFloors}
          showRoof={showRoof}
          showBaseBeam={showBaseBeam}
        />
      </Suspense>
    </Canvas>
  );
}
