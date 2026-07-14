"use client";

import { useCallback, useMemo, useState } from "react";
import { FloorPlanSvg } from "@/components/floor-plan/FloorPlanSvg";
import { sampleFloorPlan } from "@/lib/sample-plan";
import type { FloorPlan } from "@/types/floor-plan";

import { PlainHouse3DView } from "@/components/floor-plan-3d/PlainHouse3DView";

type ViewMode = "2d" | "3d";

function isFloorPlan(value: unknown): value is FloorPlan {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.meta === "object" &&
    obj.meta !== null &&
    Array.isArray(obj.floors) &&
    obj.floors.length > 0
  );
}

export function FloorPlanEditor() {
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(sampleFloorPlan, null, 2),
  );
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [showAllFloors, setShowAllFloors] = useState(true);
  const [showRoof, setShowRoof] = useState(true);
  const [showBaseBeam, setShowBaseBeam] = useState(true);

  const { floorPlan, parseError } = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!isFloorPlan(parsed)) {
        return {
          floorPlan: null,
          parseError: "Invalid floor plan structure. Requires meta and floors.",
        };
      }
      return { floorPlan: parsed, parseError: null };
    } catch (err) {
      return {
        floorPlan: null,
        parseError: err instanceof Error ? err.message : "Invalid JSON",
      };
    }
  }, [jsonText]);

  const activeFloor = floorPlan?.floors[activeFloorIndex];

  const handleLoadSample = useCallback(() => {
    setJsonText(JSON.stringify(sampleFloorPlan, null, 2));
    setActiveFloorIndex(0);
  }, []);

  const handleFormat = useCallback(() => {
    if (!floorPlan) return;
    setJsonText(JSON.stringify(floorPlan, null, 2));
  }, [floorPlan]);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Civil Draw</h1>
            <p className="mt-1 text-sm text-slate-600">
              Paste or edit floor plan JSON — 2D and 3D views update live
            </p>
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("2d")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "2d"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2D Plan
            </button>
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "3d"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3D View
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-0 lg:flex-row">
        <aside className="flex w-full flex-col border-r border-slate-200 bg-white lg:w-[420px]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <button
              type="button"
              onClick={handleLoadSample}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={handleFormat}
              disabled={!floorPlan}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Format JSON
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <label htmlFor="json-input" className="sr-only">
              Floor plan JSON
            </label>
            <textarea
              id="json-input"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="h-full w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {parseError && (
            <div className="mx-4 mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {parseError}
            </div>
          )}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
            {floorPlan && floorPlan.floors.length > 1 && (
              <div className="flex gap-2">
                {floorPlan.floors.map((floor, index) => (
                  <button
                    key={floor.floor_id}
                    type="button"
                    onClick={() => setActiveFloorIndex(index)}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      index === activeFloorIndex
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {floor.floor_id}
                  </button>
                ))}
              </div>
            )}

            {viewMode === "3d" && floorPlan && (
              <div className="ml-auto flex flex-wrap items-center gap-4">
                {(floorPlan.floors.length > 1 ||
                  (floorPlan.meta.story_count ?? 1) > 1) && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={showAllFloors}
                      onChange={(e) => setShowAllFloors(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Show all floors stacked
                  </label>
                )}
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={showRoof}
                    onChange={(e) => setShowRoof(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Roof
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={showBaseBeam}
                    onChange={(e) => setShowBaseBeam(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Base beam
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
            {floorPlan && activeFloor ? (
              <div
                className={`w-full rounded-lg border border-slate-300 bg-[#faf8f4] shadow-lg ${
                  viewMode === "2d"
                    ? "aspect-[3/4] max-w-3xl p-2"
                    : "h-full max-h-[calc(100vh-220px)]"
                }`}
              >
                {viewMode === "2d" ? (
                  <FloorPlanSvg
                    floor={activeFloor}
                    meta={floorPlan.meta}
                    title={`${activeFloor.floor_id.charAt(0).toUpperCase()}${activeFloor.floor_id.slice(1)} Floor`}
                  />
                ) : (
                  <PlainHouse3DView
                    floorPlan={floorPlan}
                    showAllFloors={showAllFloors}
                    activeFloorIndex={activeFloorIndex}
                    showRoof={showRoof}
                    showBaseBeam={showBaseBeam}
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <p className="text-lg font-medium">No valid floor plan</p>
                <p className="mt-1 text-sm">
                  Fix JSON errors or load the sample data to preview
                </p>
              </div>
            )}
          </div>

          {floorPlan && activeFloor && (
            <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-600">
              {viewMode === "2d" ? (
                <>
                  <span className="font-medium text-slate-800">Premium plan:</span> Room
                  labels show name + dimensions (ft) · Wood / carpet / tile finishes ·
                  Furniture & fixtures · Dimension ticks on exterior edges
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-800">3D Controls:</span>{" "}
                  Left drag = rotate · Right drag = pan · Scroll = zoom · Plain
                  Three.js builder with CSG door/window cutouts
                </>
              )}
              {" · "}Unit: {floorPlan.meta.unit} · Scale: {floorPlan.meta.scale}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
