/**
 * Plain Three.js house builder from floor-plan JSON.
 *
 * Coordinate system (no horizontal offsets between floors):
 *   plan.x  → THREE.x
 *   plan.y  → THREE.z
 *   elevation → THREE.y (vertical stack only)
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type {
  Door,
  Floor,
  FloorPlan,
  Point,
  Room,
  Stairs,
  Wall,
  Window,
} from "@/types/floor-plan";
import {
  type HouseBuildConfig,
  floorBaseY,
  resolveBuildConfig,
  slabTopY,
} from "./config";
import {
  bboxOfPolygons,
  dirAlong,
  externalFootprint,
  pointOnWall,
  wallAngleY,
  wallLen,
  wallMid,
} from "./geometry";

export const SCHEMA_GAPS = `
Optional meta fields not in the base schema (defaults used if omitted):
  floor_height      (10 ft)  — vertical spacing between floor slabs
  wall_height       (9 ft)   — wall mesh height per story
  slab_thickness    (0.5 ft)
  door_height       (7 ft)
  window_height     (4 ft)
  roof_thickness    (0.4 ft)
  base_beam_height  (0.55 ft)
  story_count       — duplicate floors[0] when > floors.length
  roof_pitch_deg / roof_type — not implemented; flat roof only for now
`;

export interface BuildHouseOptions {
  showRoof?: boolean;
  showBaseBeam?: boolean;
  /** When false, only `activeFloorIndex` is built (still at its stacked Y). */
  showAllFloors?: boolean;
  activeFloorIndex?: number;
}

const MAT_WALL = new THREE.MeshStandardMaterial({
  color: 0xe8e6e1,
  roughness: 0.88,
  metalness: 0.02,
});
const MAT_WALL_EXT = new THREE.MeshStandardMaterial({
  color: 0xddd9d2,
  roughness: 0.9,
  metalness: 0.02,
});
const MAT_SLAB = new THREE.MeshStandardMaterial({
  color: 0xb8b4ac,
  roughness: 0.92,
  metalness: 0.02,
});
const MAT_ROOF = new THREE.MeshStandardMaterial({
  color: 0x9a968e,
  roughness: 0.85,
  metalness: 0.03,
});
const MAT_BEAM = new THREE.MeshStandardMaterial({
  color: 0x8e8e8e,
  roughness: 0.82,
  metalness: 0.05,
});
/** CSG cutters — visible=false, not added to scene */
const MAT_CUTTER = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1,
  metalness: 0,
});

const csgEvaluator = new Evaluator();
csgEvaluator.useGroups = false;

function extrudePolygonSlab(
  polygon: Point[],
  yBase: number,
  thickness: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  polygon.forEach(([px, pz], i) => {
    // shape Y → -Z after rotateX(-π/2), so use -pz for plan z
    if (i === 0) shape.moveTo(px, -pz);
    else shape.lineTo(px, -pz);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, yBase, 0);
  return geo;
}

/** Merge all room polygons into one slab mesh — same X/Z origin, no offset. */
function buildFloorSlab(
  rooms: Room[],
  yBase: number,
  thickness: number,
): THREE.Mesh | null {
  const geos: THREE.BufferGeometry[] = [];
  for (const room of rooms) {
    if (room.polygon.length >= 3) {
      geos.push(extrudePolygonSlab(room.polygon, yBase, thickness));
    }
  }
  if (!geos.length) return null;
  const merged = mergeGeometries(geos, false);
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, MAT_SLAB);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = "floor-slab";
  return mesh;
}

function buildRoofSlab(
  footprint: { minX: number; minZ: number; width: number; depth: number },
  yBase: number,
  thickness: number,
): THREE.Mesh {
  const poly: Point[] = [
    [footprint.minX, footprint.minZ],
    [footprint.minX + footprint.width, footprint.minZ],
    [footprint.minX + footprint.width, footprint.minZ + footprint.depth],
    [footprint.minX, footprint.minZ + footprint.depth],
  ];
  const geo = extrudePolygonSlab(poly, yBase, thickness);
  const mesh = new THREE.Mesh(geo, MAT_ROOF);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = "roof";
  return mesh;
}

function subtractOpening(
  wallBrush: Brush,
  size: [number, number, number],
  center: THREE.Vector3,
  rotationY: number,
): Brush {
  const cutterGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const cutter = new Brush(cutterGeo, MAT_CUTTER);
  cutter.position.copy(center);
  cutter.rotation.y = rotationY;
  cutter.updateMatrixWorld(true);
  wallBrush.updateMatrixWorld(true);
  const result = csgEvaluator.evaluate(wallBrush, cutter, SUBTRACTION);
  return result as Brush;
}

function buildWallWithCutouts(
  wall: Wall,
  doors: Door[],
  windows: Window[],
  yBase: number,
  wallHeight: number,
  cfg: HouseBuildConfig,
): THREE.Mesh | null {
  const len = wallLen(wall.start, wall.end);
  if (len < 0.05) return null;

  const extend = wall.thickness;
  const boxLen = len + extend;
  const geo = new THREE.BoxGeometry(boxLen, wallHeight, wall.thickness);
  const mat = wall.type === "external" ? MAT_WALL_EXT : MAT_WALL;
  let brush = new Brush(geo, mat);

  const mid = wallMid(wall.start, wall.end);
  const angle = wallAngleY(wall.start, wall.end);
  const yCenter = yBase + wallHeight / 2;

  brush.position.set(mid[0], yCenter, mid[1]);
  brush.rotation.y = -angle;
  brush.updateMatrixWorld(true);

  const wallDoors = doors.filter((d) => d.wall_id === wall.id);
  const wallWins = windows.filter((w) => w.wall_id === wall.id);

  for (const door of wallDoors) {
    const localDist = door.position_on_wall - len / 2;
    const cutCenter = new THREE.Vector3(
      mid[0] + Math.cos(angle) * localDist,
      yBase + cfg.doorHeight / 2,
      mid[1] + Math.sin(angle) * localDist,
    );
    brush = subtractOpening(
      brush,
      [door.width + 0.1, cfg.doorHeight + 0.1, wall.thickness * 2.5],
      cutCenter,
      -angle,
    );
  }

  for (const win of wallWins) {
    const localDist = win.position_on_wall - len / 2;
    const cutCenter = new THREE.Vector3(
      mid[0] + Math.cos(angle) * localDist,
      yBase + win.sill_height + cfg.windowHeight / 2,
      mid[1] + Math.sin(angle) * localDist,
    );
    brush = subtractOpening(
      brush,
      [win.width + 0.1, cfg.windowHeight + 0.1, wall.thickness * 2.5],
      cutCenter,
      -angle,
    );
  }

  brush.castShadow = true;
  brush.receiveShadow = true;
  brush.name = `wall-${wall.id}`;
  return brush;
}

function buildBaseBeams(walls: Wall[], yBase: number, height: number): THREE.Group {
  const g = new THREE.Group();
  g.name = "base-beams";
  for (const wall of walls.filter((w) => w.type === "external")) {
    const len = wallLen(wall.start, wall.end);
    if (len < 0.05) continue;
    const mid = wallMid(wall.start, wall.end);
    const angle = wallAngleY(wall.start, wall.end);
    const geo = new THREE.BoxGeometry(len + wall.thickness, height, wall.thickness + 0.2);
    const mesh = new THREE.Mesh(geo, MAT_BEAM);
    mesh.position.set(mid[0], yBase + height / 2, mid[1]);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  return g;
}

function buildStairs(stairs: Stairs, yBase: number, totalRise: number): THREE.Group {
  const g = new THREE.Group();
  g.name = `stairs-${stairs.id}`;
  const xs = stairs.polygon.map((p) => p[0]);
  const zs = stairs.polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const up = dirAlong([0, 0], stairs.up_direction);
  const alongX = Math.abs(up[0]) > Math.abs(up[1]);
  const steps = Math.min(stairs.steps, 24);
  const stepRise = totalRise / steps;

  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    let cx: number;
    let cz: number;
    let w: number;
    let d: number;
    const h = stepRise * (i + 1);

    if (alongX) {
      const x0 = up[0] > 0 ? minX + (maxX - minX) * t0 : maxX - (maxX - minX) * t0;
      const x1 = up[0] > 0 ? minX + (maxX - minX) * t1 : maxX - (maxX - minX) * t1;
      w = Math.abs(x1 - x0) || (maxX - minX) / steps;
      d = maxZ - minZ;
      cx = (x0 + x1) / 2;
      cz = (minZ + maxZ) / 2;
    } else {
      const z0 = up[1] > 0 ? minZ + (maxZ - minZ) * t0 : maxZ - (maxZ - minZ) * t0;
      const z1 = up[1] > 0 ? minZ + (maxZ - minZ) * t1 : maxZ - (maxZ - minZ) * t1;
      d = Math.abs(z1 - z0) || (maxZ - minZ) / steps;
      w = maxX - minX;
      cx = (minX + maxX) / 2;
      cz = (z0 + z1) / 2;
    }

    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, MAT_SLAB);
    mesh.position.set(cx, yBase + h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  return g;
}

function buildFloorLevel(floor: Floor, floorIndex: number, cfg: HouseBuildConfig): THREE.Group {
  const level = new THREE.Group();
  level.name = `floor-${floor.floor_id}-${floorIndex}`;

  const ySlab = floorBaseY(floorIndex, cfg);
  const yWall = slabTopY(floorIndex, cfg);

  const slab = buildFloorSlab(floor.rooms, ySlab, cfg.slabThickness);
  if (slab) level.add(slab);

  for (const wall of floor.walls) {
    const mesh = buildWallWithCutouts(
      wall,
      floor.doors,
      floor.windows,
      yWall,
      cfg.wallHeight,
      cfg,
    );
    if (mesh) level.add(mesh);
  }

  if (floor.stairs) {
    level.add(buildStairs(floor.stairs, yWall, cfg.wallHeight));
  }

  return level;
}

function resolveFloors(data: FloorPlan, storyCount: number): Floor[] {
  if (storyCount <= data.floors.length) return data.floors.slice(0, storyCount);
  const base = data.floors[0];
  if (!base) return data.floors;
  return Array.from({ length: storyCount }, (_, i) => ({
    ...base,
    floor_id: i === 0 ? base.floor_id : `level_${i + 1}`,
    stairs: i === 0 ? base.stairs : undefined,
  }));
}

/**
 * Build a complete house THREE.Group from floor-plan JSON.
 * All geometry shares the same X/Z origin — stacked only along Y.
 */
export function buildHouseFromJSON(
  data: FloorPlan,
  options: BuildHouseOptions = {},
): THREE.Group {
  const cfg = resolveBuildConfig(data.meta, options);
  const house = new THREE.Group();
  house.name = "house";

  const floors = resolveFloors(data, cfg.storyCount);
  const baseFloor = floors[0];
  const showAll = options.showAllFloors !== false;
  const activeIndex = Math.min(
    Math.max(options.activeFloorIndex ?? 0, 0),
    Math.max(floors.length - 1, 0),
  );
  const levels = showAll
    ? floors.map((floor, i) => ({ floor, i }))
    : [{ floor: floors[activeIndex], i: activeIndex }].filter((l) => l.floor);

  if (cfg.showBaseBeam && baseFloor && (showAll || activeIndex === 0)) {
    house.add(buildBaseBeams(baseFloor.walls, 0, cfg.baseBeamHeight));
  }

  for (const { floor, i } of levels) {
    house.add(buildFloorLevel(floor, i, cfg));
  }

  const topIndex = showAll ? floors.length - 1 : activeIndex;
  if (cfg.showRoof && baseFloor && topIndex === floors.length - 1) {
    const footprint =
      externalFootprint(baseFloor.walls) ??
      bboxOfPolygons(baseFloor.rooms.map((r) => r.polygon));
    if (footprint) {
      const roofY = slabTopY(topIndex, cfg) + cfg.wallHeight;
      house.add(buildRoofSlab(footprint, roofY, cfg.roofThickness));
    }
  }

  return house;
}

export interface ViewerSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
  house: THREE.Group;
}

/** Create scene + lights + camera + OrbitControls framing the house from meta.plot. */
export function createHouseViewer(
  container: HTMLElement,
  data: FloorPlan,
  options: BuildHouseOptions = {},
): ViewerSetup {
  const cfg = resolveBuildConfig(data.meta, options);
  const plotW = data.meta.plot.width;
  const plotH = data.meta.plot.height;
  const cx = plotW / 2;
  const cz = plotH / 2;
  const stories = cfg.storyCount;
  const stackH = stories * cfg.floorHeight + cfg.roofThickness;
  const maxDim = Math.max(plotW, plotH);
  const dist = maxDim * 1.45;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x141416);
  scene.fog = new THREE.Fog(0x141416, dist * 1.5, dist * 4);

  const camera = new THREE.PerspectiveCamera(
    42,
    container.clientWidth / container.clientHeight,
    0.1,
    500,
  );
  camera.position.set(cx + dist * 0.72, stackH + dist * 0.42, cz + dist * 0.72);

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
  sun.position.set(plotW * 1.2, stackH + 30, plotH * 0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  const sc = maxDim * 0.85;
  sun.shadow.camera.left = -sc;
  sun.shadow.camera.right = sc;
  sun.shadow.camera.top = sc;
  sun.shadow.camera.bottom = -sc;
  scene.add(sun);
  scene.add(new THREE.DirectionalLight(0xa0b8d8, 0.3));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(maxDim * 4, maxDim * 4),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.37, cz);
  ground.receiveShadow = true;
  scene.add(ground);

  const house = buildHouseFromJSON(data, options);
  scene.add(house);

  const controls = new OrbitControls(camera, renderer.domElement);
  fitCameraToHouse(camera, controls, house);
  controls.minDistance = 8;
  controls.maxDistance = dist * 2.5;
  controls.maxPolarAngle = Math.PI / 2.02;

  return { scene, camera, renderer, controls, house };
}

export function fitCameraToHouse(
  camera: THREE.PerspectiveCamera,
  controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls,
  house: THREE.Group,
  padding = 1.35,
): void {
  const box = new THREE.Box3().setFromObject(house);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const dist = maxDim * padding;
  camera.position.set(
    center.x + dist * 0.7,
    center.y + dist * 0.45,
    center.z + dist * 0.7,
  );
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.copy(center);
  controls.update();
}
