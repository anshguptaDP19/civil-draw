Civil Draw renders floor plans from JSON in **2D** (SVG) and **3D** (Three.js).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Paste or edit floor plan JSON in the left panel (or click **Load Sample**).
2. Switch between **2D Plan** and **3D View** using the header tabs.
3. Use **Format JSON** to pretty-print valid JSON.

The JSON schema expects `meta` (unit, scale, plot size) and `floors` (rooms, walls, doors, windows, optional stairs).

## Docs

- `docs/PRODUCT_PIPELINE.md`: planned end-to-end architecture for layouts, codes, and structure.
