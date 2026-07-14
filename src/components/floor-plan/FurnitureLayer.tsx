import type { Furniture } from "@/types/floor-plan";
import { toSvgPoint } from "@/lib/geometry";

interface FurnitureLayerProps {
  items: Furniture[];
  plotHeight: number;
}

function FurnitureItem({
  item,
  plotHeight,
}: {
  item: Furniture;
  plotHeight: number;
}) {
  const [x, y] = toSvgPoint([item.x, item.y], plotHeight);
  const rot = item.rotation ?? 0;
  const cx = x + item.width / 2;
  const cy = y - item.depth / 2;

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${-rot}) translate(${-item.width / 2}, ${-item.depth / 2})`}
      filter="url(#furniture-shadow)"
    >
      <FurnitureShape kind={item.kind} w={item.width} d={item.depth} />
    </g>
  );
}

function FurnitureShape({
  kind,
  w,
  d,
}: {
  kind: Furniture["kind"];
  w: number;
  d: number;
}) {
  switch (kind) {
    case "sofa":
      return (
        <g>
          <rect width={w} height={d} rx={0.25} fill="url(#fabric-blue)" stroke="#3d5a78" strokeWidth={0.06} />
          <rect x={0.15} y={0.1} width={w - 0.3} height={d * 0.35} rx={0.15} fill="#7a9cc0" opacity={0.5} />
        </g>
      );
    case "armchair":
      return (
        <rect width={w} height={d} rx={0.2} fill="url(#fabric-blue)" stroke="#3d5a78" strokeWidth={0.05} />
      );
    case "accent_chair":
      return (
        <rect width={w} height={d} rx={0.15} fill="#6b8fb8" stroke="#4a6888" strokeWidth={0.04} />
      );
    case "coffee_table":
      return (
        <rect width={w} height={d} rx={0.12} fill="url(#wood-furniture)" stroke="#8a7048" strokeWidth={0.05} />
      );
    case "round_table":
      return (
        <ellipse cx={w / 2} cy={d / 2} rx={w / 2} ry={d / 2} fill="url(#wood-furniture)" stroke="#8a7048" strokeWidth={0.05} />
      );
    case "bed":
      return (
        <g>
          <rect width={w} height={d} rx={0.15} fill="#f5f0e6" stroke="#c8bfb0" strokeWidth={0.05} />
          <rect x={0.2} y={0.15} width={w - 0.4} height={d * 0.55} rx={0.1} fill="url(#fabric-navy)" />
          <rect x={0.2} y={d * 0.12} width={w - 0.4} height={d * 0.18} rx={0.08} fill="#ffffff" />
        </g>
      );
    case "nightstand":
      return (
        <rect width={w} height={d} rx={0.08} fill="url(#wood-furniture)" stroke="#8a7048" strokeWidth={0.04} />
      );
    case "tv_console":
      return (
        <g>
          <rect width={w} height={d} rx={0.06} fill="url(#wood-furniture)" stroke="#8a7048" strokeWidth={0.04} />
          <rect x={w * 0.25} y={-0.15} width={w * 0.5} height={0.12} rx={0.02} fill="#1a1a1a" />
        </g>
      );
    case "kitchen_island":
      return (
        <g>
          <rect width={w} height={d} rx={0.1} fill="url(#granite)" stroke="#7a7570" strokeWidth={0.06} />
          <rect x={0.15} y={0.15} width={w - 0.3} height={d - 0.3} rx={0.06} fill="url(#granite)" opacity={0.85} />
        </g>
      );
    case "counter_l":
      return (
        <rect width={w} height={d} fill="url(#granite)" stroke="#7a7570" strokeWidth={0.05} />
      );
    case "sink":
      return (
        <g>
          <rect width={w} height={d} rx={0.08} fill="#c8c4bc" stroke="#9a9690" strokeWidth={0.04} />
          <ellipse cx={w / 2} cy={d / 2} rx={w * 0.35} ry={d * 0.35} fill="#b0aca4" />
        </g>
      );
    case "stove":
      return (
        <g>
          <rect width={w} height={d} fill="#3a3a3a" stroke="#1a1a1a" strokeWidth={0.04} />
          {[0.25, 0.5, 0.75].map((tx) =>
            [0.3, 0.7].map((ty) => (
              <circle key={`${tx}-${ty}`} cx={w * tx} cy={d * ty} r={Math.min(w, d) * 0.12} fill="#1a1a1a" stroke="#555" strokeWidth={0.02} />
            )),
          )}
        </g>
      );
    case "fridge":
      return (
        <rect width={w} height={d} rx={0.08} fill="#f0f0f0" stroke="#c0c0c0" strokeWidth={0.05} />
      );
    case "bar_stool":
      return (
        <g>
          <circle cx={w / 2} cy={d * 0.35} r={w * 0.38} fill="#4a4a4a" />
          <rect x={w * 0.42} y={d * 0.5} width={w * 0.16} height={d * 0.45} fill="#3a3a3a" />
        </g>
      );
    case "toilet":
      return (
        <g>
          <ellipse cx={w / 2} cy={d * 0.55} rx={w * 0.42} ry={d * 0.38} fill="#f5f5f5" stroke="#ccc" strokeWidth={0.04} />
          <rect x={w * 0.2} y={0} width={w * 0.6} height={d * 0.35} rx={0.08} fill="#f5f5f5" stroke="#ccc" strokeWidth={0.04} />
        </g>
      );
    case "tub":
      return (
        <rect width={w} height={d} rx={0.35} fill="url(#water-tub)" stroke="#4a8098" strokeWidth={0.06} />
      );
    case "shower":
      return (
        <g>
          <rect width={w} height={d} rx={0.1} fill="#e8e8e8" stroke="#aaa" strokeWidth={0.05} />
          <rect x={0.08} y={0.08} width={w - 0.16} height={d - 0.16} rx={0.06} fill="none" stroke="#93c5fd" strokeWidth={0.06} strokeDasharray="0.2 0.15" />
        </g>
      );
    case "vanity":
      return (
        <g>
          <rect width={w} height={d} rx={0.06} fill="url(#wood-furniture)" stroke="#8a7048" strokeWidth={0.04} />
          <rect x={0.1} y={0.05} width={w - 0.2} height={d * 0.35} rx={0.04} fill="url(#granite)" />
          <ellipse cx={w * 0.35} cy={d * 0.22} rx={w * 0.12} ry={d * 0.1} fill="#d0ccc4" />
          {w > 2.5 && (
            <ellipse cx={w * 0.65} cy={d * 0.22} rx={w * 0.12} ry={d * 0.1} fill="#d0ccc4" />
          )}
        </g>
      );
    case "closet_shelf":
      return (
        <g>
          <line x1={0.1} y1={d * 0.25} x2={w - 0.1} y2={d * 0.25} stroke="#c0b8a8" strokeWidth={0.06} />
          <line x1={0.1} y1={d * 0.55} x2={w - 0.1} y2={d * 0.55} stroke="#c0b8a8" strokeWidth={0.06} />
          <line x1={w * 0.5} y1={0.1} x2={w * 0.5} y2={d - 0.1} stroke="#b0a898" strokeWidth={0.04} />
        </g>
      );
    default:
      return <rect width={w} height={d} fill="#ccc" />;
  }
}

export function FurnitureLayer({ items, plotHeight }: FurnitureLayerProps) {
  if (!items.length) return null;
  return (
    <g className="furniture">
      {items.map((item) => (
        <FurnitureItem key={item.id} item={item} plotHeight={plotHeight} />
      ))}
    </g>
  );
}
