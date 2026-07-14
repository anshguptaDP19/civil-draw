# Civil Draw — Full-Scale Product Pipeline (Design → Structure → Deliverables)

This document formalizes the end-to-end pipeline for a production-grade system that turns a **user brief** into **multiple layout options**, validates them against **bylaws/codes**, generates **structural framing**, runs **analysis & design checks**, and outputs **2D/3D/CAD/BIM** deliverables with full traceability.

---

## Goals

- Generate **3–4 candidate layouts** from a single prompt (e.g., *north-facing 3BHK on 40×30 ft plot*).
- Ensure solutions are **editable** (2D plan editor), **inspectable** (3D), and **exportable** (PNG/PDF/DXF/IFC).
- Provide deterministic, auditable compliance for:
  - **Building bylaws** (local authority)
  - **NBC** (National Building Code)
  - **IS codes** (e.g., IS 456, IS 875, IS 1893; steel if applicable)
- Support iterative improvement loops (layout ↔ structure) with **failure diagnosis**.

---

## Non-goals (initially)

- Full automatic reinforcement detailing for every special case (e.g., complex seismic detailing) without engineer review.
- Guaranteed “approval-ready” for every jurisdiction on day one.
- Replacing licensed professionals; the platform should assist and document, not obscure reasoning.

---

## Core idea

AI is used for **interpretation, proposal, and explanations**.

Deterministic engines are used for **constraints, validation, structural modeling, analysis, and code checks**.

> **AI proposes. The system validates.**

---

## High-level pipeline

1. **User Request**
2. **LLM — Natural Language Understanding**
3. **RAG — Retrieve Rules & Knowledge**
4. **Constraint Builder**
5. **Optimization Engine (CP-SAT / OR-Tools)**
6. **Geometry Generator**
7. **Structural Grid Engine**
8. **Load Computation Engine**
9. **Structural Analysis Engine (FEA)**
10. **IS Code Design Check Engine**
11. **Rendering & Deliverables**
11A. **Failure Diagnosis & Feedback Loop**

---

## 1) User request (input contract)

### Input
Free text plus optional structured fields.

Examples:
- Plot: `40×30 ft`, facing `North`, floors `G+1`
- Program: `3BHK`, 2 baths, 1 parking
- Preferences: kitchen beside dining, accessibility, budget
- Local constraints: *Noida bylaws*, *Vastu* (optional)

### Output
Raw prompt + metadata:
- locale/jurisdiction
- units (ft/m)
- user/project identifiers

---

## 2) LLM — Natural Language Understanding

### Responsibilities
Convert free text into a strict **requirements JSON**:
- plot dimensions and orientation
- floor count
- room list and priorities
- adjacency preferences (hard vs soft)
- optional Vastu rules
- parking requirements
- accessibility

### Output (example sketch)
```json
{
  "plot": { "width_ft": 40, "depth_ft": 30, "facing": "N" },
  "floors": 2,
  "program": { "bedrooms": 3, "bathrooms": 2, "parking": 1 },
  "adjacency": [{ "a": "kitchen", "b": "dining", "type": "hard" }],
  "preferences": { "vastu": true, "budget_level": "mid" }
}
```

### Notes
For production, enforce:
- JSON schema validation
- model versioning
- deterministic post-processing (units, defaults)

---

## 3) RAG — Retrieve rules & knowledge

### Responsibilities
Retrieve relevant rules based on jurisdiction and occupancy:
- Local building bylaws (setbacks, FAR/FSI, height limits, parking norms)
- NBC excerpts
- IS codes references (loads, seismic zone mapping)
- Organization standards (typical room sizes, preferred typologies)
- Vastu guidelines (optional)

### Output
Retrieved rule snippets **with citations**, plus a normalized “rule facts” set (still not executable).

### Important
Do **not** use LLM/RAG as the final arbiter of compliance. Convert rules into an executable ruleset.

---

## 4) Constraint builder (executable constraints)

### Responsibilities
Merge:
- requirements JSON (Step 2)
- retrieved knowledge (Step 3)
- engineering limits (spans, minimum widths, egress rules)

Into a single **constraint JSON** consumable by solvers.

### Output (example sketch)
```json
{
  "plot": { "w": 40, "d": 30, "setbacks": { "front": 10, "rear": 5, "left": 3, "right": 3 } },
  "rooms": [
    { "name": "Living", "min_w": 12, "min_h": 12, "orientation_pref": ["N","E"] }
  ],
  "adjacency": [{ "a": "Kitchen", "b": "Dining", "type": "hard" }],
  "objectives": { "min_corridor_area": true, "maximize_light": true }
}
```

---

## 5) Optimization engine (CP-SAT)

### Responsibilities
Solve the macro “space planning” problem by choosing:
- room rectangles (positions + sizes)
- circulation corridors
- stairs placement (coarse)
- doors/windows (coarse, or deferred to geometry stage)

### Constraints (examples)
- inside buildable envelope (plot minus setbacks)
- rooms do not overlap
- required adjacencies (hard) and preferences (soft)
- minimum sizes / aspect ratios
- orientation rules (optional: Vastu)

### Objective function (examples)
- minimize corridor area
- maximize north/east openings
- maximize compactness
- minimize cost proxy (perimeter length, wall length)

### Output
Multiple feasible candidates (ideally 10–50 internally), later ranked to present **top 3–4**.

---

## 6) Geometry generator (plan geometry)

### Responsibilities
Convert solver rectangles into editable plan geometry:
- room polygons
- walls with thickness
- openings (doors/windows)
- stairs (detailed)
- annotations (dimensions, labels)

### Output
A versioned **Plan Document**:
- plan geometry model (2D)
- semantic objects (rooms, walls, openings)
- stable IDs for diff/versioning

This is what the 2D editor operates on.

---

## 7) Structural grid engine

### Responsibilities
Generate a structural framing proposal:
- detect wall intersections
- place columns at corners/intersections
- insert intermediate columns if spans exceed limits
- generate beam network
- slab panels and panelization
- foundation candidate locations

### Output
Structural model inputs:
- nodes, members, supports
- member grouping for sizing
- slab panels / diaphragm assumptions

---

## 8) Load computation engine

### Responsibilities
Compute loads and combinations:
- dead loads: slab, wall, finishes, beams/columns self-weight
- live loads: occupancy categories
- environmental loads: wind and seismic (IS 1893), rain if applicable
- load combinations per IS codes

### Output
Load cases and combinations, mapped to the structural model.

---

## 9) Structural analysis (FEA engine)

### Responsibilities
Run analysis using a trusted solver (examples: OpenSees, OpenSeesPy, PyNite, commercial integrations):
- member forces (M/V/N)
- deflections
- reactions
- stability checks

### Output
Results per combination:
- beam moments/shear envelopes
- column axial + moments
- deflection utilization

---

## 10) IS code design check engine

### Responsibilities
Design verification per material system:
- RCC: IS 456
- Loads: IS 875
- Seismic: IS 1893
- Steel (optional): IS 800

Checks include:
- strength (flexure, shear, axial)
- serviceability (deflection, crack width where applicable)
- detailing constraints (minimum reinforcement, spacing, cover)

### Output
Pass/fail per element + governing combo + utilization ratios + required changes.

---

## 11) Rendering & deliverables

### 2D outputs
- plan sheets (PNG/PDF)
- dimensions, labels, legends

### 3D outputs
- extruded wall/beam/column model
- optional material system preview

### CAD/BIM outputs (phased)
- DXF for CAD interoperability
- IFC for BIM interoperability

---

## 11A) Failure diagnosis & loop

If any checks fail:
- Generate a human-friendly diagnosis (LLM can help write summaries)
- Determine if a fix is:
  - sizing change (beam/column size, slab thickness, reinforcement)
  - structural topology change (add a column, reduce span)
  - architectural change (adjust layout constraints)
- Re-run the appropriate segment of the pipeline:
  - **Sizing** → repeat steps 8–10
  - **Topology** → repeat steps 7–10
  - **Layout** → repeat steps 4–10

---

## Candidate generation strategy (3–4 layouts)

To reliably produce 3–4 good options:
- generate N candidates internally (e.g., 20–50)
- rule-score each candidate (geometry validity, adjacency satisfaction, code pre-checks)
- select top 3–4 and present to the user

This is more stable than “ask the LLM for 4 layouts” as the only method.

---

## Data, provenance, and audit trail (production requirements)

Every generated plan should record:
- prompt, requirements JSON, constraint JSON
- retrieved documents + citations (RAG)
- ruleset version (bylaw pack version)
- solver version + random seed
- structural engine version
- model vendor + model version
- outputs (2D/3D exports) + diffs between revisions

This enables:
- reproducibility
- compliance audits
- regression testing
- continuous improvement

---

## Suggested implementation split (services)

- **Web App** (Next.js): editor UI (2D+3D), project/version UX
- **Generation API**: LLM parsing, candidate orchestration, scoring, repair
- **Rules Service**: executable bylaw/code packs with versioning
- **Optimization Service**: CP-SAT/OR-Tools
- **Structural Service**: grid generation, loads, FEA orchestration, design checks
- **Document Service**: plan/structural document schemas, export pipelines

---

## Phased roadmap (recommended)

1. **Plan Document + Editor** (2D/3D) with robust schema + versioning
2. **Prompt → 3–4 Layouts** using templates + solver + validators
3. **Jurisdiction rule packs** (Noida-first or a single target authority)
4. **Structural grid + basic loads + analysis** (RCC frames, limited cases)
5. **IS code design checks** (progressively expand coverage)
6. **DXF/IFC export** and professional sheet generation

---

## Appendix: Mapping to current repo

This repository currently provides:
- a Next.js app with a floor-plan style editor (`/draw`)
- a basic plan object model in `src/lib/civil-types.ts`

The next production step is to formalize a versioned **Plan Document** schema and implement validators and candidate generation (templates + solver).

