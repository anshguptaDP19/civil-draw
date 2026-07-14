export type Point = readonly [number, number];

export interface PlotMeta {
  width: number;
  height: number;
}

export interface FloorPlanMeta {
  unit: string;
  scale: string;
  north_angle_deg: number;
  plot: PlotMeta;
  /** Premium rendering style */
  style?: "standard" | "premium";
  /** Number of stacked stories for 3D (duplicates floor plan if needed) */
  story_count?: number;
}

export type FloorFinish = "wood" | "carpet" | "tile" | "stone" | "concrete";

export interface Room {
  id: string;
  name: string;
  polygon: Point[];
  area_sqft: number;
  /** @deprecated Ignored — labels use room.name. Kept for backward-compatible JSON. */
  label?: string;
  /** Explicit dimensions for label; computed from polygon if omitted */
  width_ft?: number;
  depth_ft?: number;
  floor_finish?: FloorFinish;
}

export type WallType = "external" | "internal";

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  type: WallType;
}

export type DoorSwing = "left" | "right";

export interface Door {
  id: string;
  wall_id: string;
  position_on_wall: number;
  width: number;
  swing: DoorSwing;
  type: string;
}

export interface Window {
  id: string;
  wall_id: string;
  position_on_wall: number;
  width: number;
  sill_height: number;
}

export interface Stairs {
  id: string;
  polygon: Point[];
  up_direction: Point;
  steps: number;
}

export type FurnitureKind =
  | "sofa"
  | "armchair"
  | "coffee_table"
  | "accent_chair"
  | "round_table"
  | "bed"
  | "nightstand"
  | "tv_console"
  | "kitchen_island"
  | "counter_l"
  | "sink"
  | "stove"
  | "fridge"
  | "bar_stool"
  | "toilet"
  | "tub"
  | "shower"
  | "vanity"
  | "closet_shelf";

export interface Furniture {
  id: string;
  room_id: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation?: number;
}

export interface Floor {
  floor_id: string;
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  stairs?: Stairs;
  furniture?: Furniture[];
}

export interface FloorPlan {
  meta: FloorPlanMeta;
  floors: Floor[];
}
