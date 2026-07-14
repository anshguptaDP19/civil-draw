"""
CP-SAT Floorplan Generator (rectangular rooms)

Usage:
  python tools/floorplan_cpsat.py --variants 4 > layouts.json

Notes:
  - Integer grid = 1 unit per foot.
  - Outputs Civil Draw "DrawingDocument" JSON with rooms only.
  - Your app can deterministically add beams/nodes after import.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from ortools.sat.python import cp_model


PLOT_W, PLOT_H = 20, 20  # feet


@dataclass(frozen=True)
class RoomSpec:
    name: str
    min_w: int
    min_h: int
    fill: str
    stroke: str


ROOMS: List[RoomSpec] = [
    RoomSpec("Living", 8, 8, "rgba(160,180,170,0.35)", "#5f8f7a"),
    RoomSpec("Kitchen", 6, 6, "rgba(220,200,170,0.35)", "#b8835a"),
    RoomSpec("Bedroom1", 8, 8, "rgba(244,170,140,0.35)", "#e67e4a"),
    RoomSpec("Bedroom2", 8, 8, "rgba(244,170,140,0.35)", "#e67e4a"),
    RoomSpec("Bathroom", 4, 6, "rgba(200,200,200,0.35)", "#64748b"),
]

ADJACENT: List[Tuple[str, str]] = [("Kitchen", "Living"), ("Bathroom", "Bedroom1")]


def _overlap_len(model: cp_model.CpModel, a0, a1, b0, b1, name: str):
    """Compute positive overlap length between [a0,a1] and [b0,b1]."""
    min_end = model.NewIntVar(0, 10_000, f"{name}_min_end")
    max_start = model.NewIntVar(0, 10_000, f"{name}_max_start")
    raw = model.NewIntVar(-10_000, 10_000, f"{name}_raw")
    ov = model.NewIntVar(0, 10_000, f"{name}_ov")

    model.AddMinEquality(min_end, [a1, b1])
    model.AddMaxEquality(max_start, [a0, b0])
    model.Add(raw == min_end - max_start)
    model.AddMaxEquality(ov, [raw, 0])
    return ov


def _add_touch(model: cp_model.CpModel, A: Dict, B: Dict, min_overlap: int = 1):
    """Enforce that rectangles A and B touch on any side with overlap >= min_overlap."""
    touch_l = model.NewBoolVar(f"touch_{A['name']}_L_{B['name']}")
    touch_r = model.NewBoolVar(f"touch_{A['name']}_R_{B['name']}")
    touch_t = model.NewBoolVar(f"touch_{A['name']}_T_{B['name']}")
    touch_b = model.NewBoolVar(f"touch_{A['name']}_B_{B['name']}")

    ov_y = _overlap_len(model, A["y"], A["y2"], B["y"], B["y2"], f"ovy_{A['name']}_{B['name']}")
    ov_x = _overlap_len(model, A["x"], A["x2"], B["x"], B["x2"], f"ovx_{A['name']}_{B['name']}")

    # A.right == B.left
    model.Add(A["x2"] == B["x"]).OnlyEnforceIf(touch_r)
    model.Add(ov_y >= min_overlap).OnlyEnforceIf(touch_r)

    # A.left == B.right
    model.Add(A["x"] == B["x2"]).OnlyEnforceIf(touch_l)
    model.Add(ov_y >= min_overlap).OnlyEnforceIf(touch_l)

    # A.bottom == B.top
    model.Add(A["y2"] == B["y"]).OnlyEnforceIf(touch_b)
    model.Add(ov_x >= min_overlap).OnlyEnforceIf(touch_b)

    # A.top == B.bottom
    model.Add(A["y"] == B["y2"]).OnlyEnforceIf(touch_t)
    model.Add(ov_x >= min_overlap).OnlyEnforceIf(touch_t)

    model.AddBoolOr([touch_l, touch_r, touch_t, touch_b])


def solve_once(seed: int = 1, time_limit_s: float = 3.0) -> Optional[dict]:
    model = cp_model.CpModel()

    rv: Dict[str, Dict] = {}
    x_intervals = []
    y_intervals = []

    for spec in ROOMS:
        name = spec.name
        w = model.NewIntVar(spec.min_w, PLOT_W, f"{name}_w")
        h = model.NewIntVar(spec.min_h, PLOT_H, f"{name}_h")
        x = model.NewIntVar(0, PLOT_W, f"{name}_x")
        y = model.NewIntVar(0, PLOT_H, f"{name}_y")
        x2 = model.NewIntVar(0, PLOT_W, f"{name}_x2")
        y2 = model.NewIntVar(0, PLOT_H, f"{name}_y2")

        model.Add(x2 == x + w)
        model.Add(y2 == y + h)
        model.Add(x2 <= PLOT_W)
        model.Add(y2 <= PLOT_H)

        xi = model.NewIntervalVar(x, w, x2, f"{name}_xi")
        yi = model.NewIntervalVar(y, h, y2, f"{name}_yi")
        x_intervals.append(xi)
        y_intervals.append(yi)

        rv[name] = {"name": name, "x": x, "y": y, "w": w, "h": h, "x2": x2, "y2": y2, "spec": spec}

    model.AddNoOverlap2D(x_intervals, y_intervals)

    for a, b in ADJACENT:
        _add_touch(model, rv[a], rv[b], min_overlap=1)

    # Compactness objective: minimize bounding box perimeter
    min_x = model.NewIntVar(0, PLOT_W, "min_x")
    min_y = model.NewIntVar(0, PLOT_H, "min_y")
    max_x = model.NewIntVar(0, PLOT_W, "max_x")
    max_y = model.NewIntVar(0, PLOT_H, "max_y")
    model.AddMinEquality(min_x, [rv[n]["x"] for n in rv])
    model.AddMinEquality(min_y, [rv[n]["y"] for n in rv])
    model.AddMaxEquality(max_x, [rv[n]["x2"] for n in rv])
    model.AddMaxEquality(max_y, [rv[n]["y2"] for n in rv])

    bb_w = model.NewIntVar(0, PLOT_W, "bb_w")
    bb_h = model.NewIntVar(0, PLOT_H, "bb_h")
    model.Add(bb_w == max_x - min_x)
    model.Add(bb_h == max_y - min_y)
    model.Minimize(bb_w + bb_h)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_s
    solver.parameters.random_seed = seed
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    objects = []
    for name, v in rv.items():
        x = solver.Value(v["x"])
        y = solver.Value(v["y"])
        w = solver.Value(v["w"])
        h = solver.Value(v["h"])
        spec: RoomSpec = v["spec"]
        objects.append(
            {
                "id": f"room_{name.lower()}",
                "type": "room",
                "name": name,
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "fill": spec.fill,
                "stroke": spec.stroke,
            }
        )

    return {
        "version": 1,
        "floorName": "Generated",
        "northLabel": "ROAD / NORTH",
        "objects": objects,
    }


def generate_variants(k: int) -> List[dict]:
    variants: List[dict] = []
    seen = set()

    seed = 1
    while len(variants) < k and seed < 500:
        doc = solve_once(seed=seed)
        seed += 1
        if not doc:
            continue
        key = tuple(sorted((o["name"], o["x"], o["y"], o["width"], o["height"]) for o in doc["objects"]))
        if key in seen:
            continue
        seen.add(key)
        variants.append(doc)

    return variants


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--variants", type=int, default=4)
    args = ap.parse_args()

    layouts = generate_variants(args.variants)
    print(json.dumps({"layouts": layouts}, indent=2))


if __name__ == "__main__":
    main()

