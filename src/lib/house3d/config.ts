import type { FloorPlanMeta } from "@/types/floor-plan";

/** Resolved build dimensions — see SCHEMA_GAPS in buildHouseFromJSON.ts for JSON additions. */
export interface HouseBuildConfig {
  floorHeight: number;
  wallHeight: number;
  slabThickness: number;
  doorHeight: number;
  windowHeight: number;
  roofThickness: number;
  baseBeamHeight: number;
  storyCount: number;
  showRoof: boolean;
  showBaseBeam: boolean;
}

export const DEFAULT_BUILD_CONFIG = {
  floorHeight: 10,
  wallHeight: 9,
  slabThickness: 0.5,
  doorHeight: 7,
  windowHeight: 4,
  roofThickness: 0.4,
  baseBeamHeight: 0.55,
} as const;

export function resolveBuildConfig(
  meta: FloorPlanMeta,
  options: Partial<HouseBuildConfig> = {},
): HouseBuildConfig {
  const m = meta as FloorPlanMeta & {
    floor_height?: number;
    wall_height?: number;
    slab_thickness?: number;
    door_height?: number;
    window_height?: number;
    roof_thickness?: number;
    base_beam_height?: number;
  };

  return {
    floorHeight: m.floor_height ?? DEFAULT_BUILD_CONFIG.floorHeight,
    wallHeight: m.wall_height ?? DEFAULT_BUILD_CONFIG.wallHeight,
    slabThickness: m.slab_thickness ?? DEFAULT_BUILD_CONFIG.slabThickness,
    doorHeight: m.door_height ?? DEFAULT_BUILD_CONFIG.doorHeight,
    windowHeight: m.window_height ?? DEFAULT_BUILD_CONFIG.windowHeight,
    roofThickness: m.roof_thickness ?? DEFAULT_BUILD_CONFIG.roofThickness,
    baseBeamHeight: m.base_beam_height ?? DEFAULT_BUILD_CONFIG.baseBeamHeight,
    storyCount: meta.story_count ?? 1,
    showRoof: options.showRoof ?? true,
    showBaseBeam: options.showBaseBeam ?? true,
  };
}

export function floorBaseY(floorIndex: number, cfg: HouseBuildConfig): number {
  const beam = cfg.showBaseBeam && floorIndex === 0 ? cfg.baseBeamHeight : 0;
  return floorIndex * cfg.floorHeight + beam;
}

export function slabTopY(floorIndex: number, cfg: HouseBuildConfig): number {
  return floorBaseY(floorIndex, cfg) + cfg.slabThickness;
}
