import { endsNames, materialNames } from "./catalog";
import { priceStrap } from "./pricing";
import { findWebbing } from "./rules";
import type { Catalog, StrapConfig } from "./types";

export function createSpec(config: StrapConfig, catalog: Catalog) {
  const quote =
    priceStrap(config, catalog).quotes.find(
      (q) => q.region === config.region,
    ) ?? null;
  const webbing = findWebbing(config, catalog)!;
  const hardware = catalog.hardware.find((h) => h.id === config.hardwareId);
  return {
    schemaVersion: 2,
    units: "mm",
    lengthDefinition:
      "Total cut webbing length before assembly; includes end turnbacks. Buckle is shown separately in an exploded flat view.",
    config,
    billOfMaterials: {
      webbing: {
        id: webbing.id,
        material: config.material,
        widthMm: config.widthMm,
        cutLengthMm: config.lengthMm,
        color: config.color,
        plies: 1,
      },
      hardware: hardware
        ? [
            {
              id: hardware.id,
              sku: hardware.sku,
              name: hardware.name,
              quantityPerStrap: 1,
            },
          ]
        : [],
      ends: endsNames[config.ends],
      logo:
        config.logo.kind === "woven"
          ? {
              kind: "woven",
              text: config.logo.text.trim(),
              widthMm: 40,
              heightMm: 10,
            }
          : null,
      quantity: config.quantity,
    },
    pricing: {
      source: catalog.source,
      currency: "USD",
      estimateOnly: true,
      quote,
      note: "Catalog estimate including estimated shipping. Taxes excluded. Finishing and label allowances are provisional; artwork and production details are confirmed during review.",
    },
    summary: `${materialNames[config.material] ?? config.material} · ${config.widthMm} × ${config.lengthMm} mm · ${config.color} · ${hardware?.name ?? "No buckle"} · ${endsNames[config.ends]} · ${config.quantity} units`,
  };
}
export type StrapSpec = ReturnType<typeof createSpec>;
