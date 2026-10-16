import { quoteFromCatalog } from "./quote-engine";
import { findWebbing, validateConfig } from "./rules";
import type { Catalog, StrapConfig } from "./types";

export function priceStrap(config: StrapConfig, catalog: Catalog) {
  const issues = validateConfig(config, catalog);
  if (issues.length) throw new Error(issues.join(" "));
  const webbing = findWebbing(config, catalog)!;
  // Length is the total cut webbing length, including end turnbacks, before assembly.
  return quoteFromCatalog(
    {
      webbingId: webbing.id,
      lengthInches: config.lengthMm / 25.4,
      color: config.color,
      plies: 1,
      hardware: config.hardwareId ? [{ id: config.hardwareId, qty: 1 }] : [],
      quantity: config.quantity,
      finishing: { ends: config.ends, logo: config.logo.kind },
    },
    webbing,
    catalog.hardware,
    catalog.rules,
  );
}
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
