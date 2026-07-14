/**
 * Build-time validation: every room in the sample plan must get a label layout.
 * Run: npm run validate:floor-plan
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FloorPlan } from "../src/types/floor-plan";
import { computeRoomLabelLayouts } from "../src/lib/floor-plan/room-labels";

const samplePath = join(process.cwd(), "samples", "2bhk-flat.json");
const raw = readFileSync(samplePath, "utf-8");
const plan = JSON.parse(raw) as FloorPlan;
const floor = plan.floors[0];

if (!floor) {
  console.error("validate-floor-plan: no floors in sample JSON");
  process.exit(1);
}

const layouts = computeRoomLabelLayouts(
  floor.rooms,
  floor.doors,
  floor.walls,
  plan.meta.plot.height,
  plan.meta.style === "premium",
);

let failed = false;
for (const room of floor.rooms) {
  const layout = layouts.find((l) => l.roomId === room.id);
  if (!layout) {
    console.error(`MISSING LABEL: room "${room.name}" (id: ${room.id})`);
    failed = true;
    continue;
  }
  if (!layout.name.includes(room.name.toUpperCase().split(" ")[0]!)) {
    console.error(
      `LABEL MISMATCH: room "${room.name}" got label "${layout.name}"`,
    );
    failed = true;
  }
  if (room.label != null && room.label !== room.name) {
    console.warn(
      `DEPRECATED: room "${room.id}" has label "${room.label}" — renderer uses name "${room.name}"`,
    );
  }
}

if (failed) {
  process.exit(1);
}

console.log(`OK: ${layouts.length} room labels match ${floor.rooms.length} rooms`);
