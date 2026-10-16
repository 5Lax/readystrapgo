import snapshot from "./catalog-snapshot.json";
import type { Catalog, StrapTemplate } from "./types";

// Checked-in development snapshot of migration 005, never a second pricing formula.
export const seedCatalog = { ...snapshot, source: "seed" } as Catalog;
export const materialNames: Record<string, string> = {
  nylon: "Nylon 6/6",
  polyester: "Polyester",
  polypropylene: "Polypropylene",
  elastic: "Elastic",
  uhmwpe: "UHMWPE",
};
export const materialNotes: Record<string, string> = {
  nylon: "Soft hand · everyday straps",
  polyester: "Low stretch · outdoor gear",
  polypropylene: "Lightweight · utility straps",
  elastic: "Flexible · stretch applications",
  uhmwpe: "Low weight · specialist applications",
};
// Starting dimensions adapted from StrapBuilder; only references present in this catalog.
export const templates: StrapTemplate[] = [
  {
    id: "utility",
    name: "Utility strap",
    description: "A versatile starting point",
    material: "nylon",
    widthMm: 25.4,
    lengthMm: 600,
    hardwareSku: "BKL-SR-100",
    ends: "sealed",
  },
  {
    id: "camera",
    name: "Camera strap",
    description: "A longer, soft webbing strap",
    material: "polyester",
    widthMm: 19.05,
    lengthMm: 1200,
    hardwareSku: "BKL-SR-075",
    ends: "folded",
  },
  {
    id: "handle",
    name: "Carry handle",
    description: "Short webbing with sewn end loops",
    material: "polyester",
    widthMm: 38.1,
    lengthMm: 300,
    hardwareSku: null,
    ends: "loops",
  },
];
export const endsNames = {
  sealed: "Heat-sealed ends",
  folded: "Folded & stitched ends",
  loops: "Sewn end loops",
};
export const widthInMm = (inches: number) => Math.round(inches * 2540) / 100;
