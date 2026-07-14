"use client";

import { useEffect, useRef } from "react";
import type { FloorPlan } from "@/types/floor-plan";
import {
  buildHouseFromJSON,
  fitCameraToHouse,
  type BuildHouseOptions,
} from "@/lib/house3d";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface PlainHouse3DViewProps {
  floorPlan: FloorPlan;
  showAllFloors?: boolean;
  activeFloorIndex?: number;
  showRoof?: boolean;
  showBaseBeam?: boolean;
}

/**
 * Plain Three.js viewer (no React Three Fiber).
 * Uses buildHouseFromJSON — all floors share the same X/Z origin.
 */
export function PlainHouse3DView({
  floorPlan,
  showAllFloors = true,
  activeFloorIndex = 0,
  showRoof = true,
  showBaseBeam = true,
}: PlainHouse3DViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const plotW = floorPlan.meta.plot.width;
    const plotH = floorPlan.meta.plot.height;
    const cx = plotW / 2;
    const cz = plotH / 2;
    const maxDim = Math.max(plotW, plotH);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141416);
    scene.fog = new THREE.Fog(0x141416, maxDim * 2, maxDim * 5);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      500,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc8d4e8, 0x1a1a20, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.25);
    sun.position.set(plotW * 1.2, 40, plotH * 0.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    const sc = maxDim * 0.9;
    sun.shadow.camera.left = -sc;
    sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc;
    sun.shadow.camera.bottom = -sc;
    scene.add(sun);
    scene.add(new THREE.DirectionalLight(0xa0b8d8, 0.28));

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(maxDim * 4, maxDim * 4),
      new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cx, -0.37, cz);
    ground.receiveShadow = true;
    scene.add(ground);

    const options: BuildHouseOptions = {
      showRoof,
      showBaseBeam,
      showAllFloors,
      activeFloorIndex,
    };
    const house = buildHouseFromJSON(floorPlan, options);
    scene.add(house);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = maxDim * 3;
    controls.maxPolarAngle = Math.PI / 2.02;
    fitCameraToHouse(camera, controls, house);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [floorPlan, showAllFloors, activeFloorIndex, showRoof, showBaseBeam]);

  return <div ref={containerRef} className="h-full w-full" />;
}
