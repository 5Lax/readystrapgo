import {
  getHardwareCatalog,
  getPricingRules,
  getWebbingCatalog,
} from "../actions/catalog";
import { seedCatalog } from "./catalog";
import type { Catalog } from "./types";

export function backendConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    /^https?:\/\//.test(url) && !url.includes("placeholder") && key.length > 20
  );
}
export async function loadLiveCatalog(): Promise<Catalog> {
  if (!backendConfigured())
    throw new Error(
      "Project submission is unavailable until the catalog and project intake are connected. You can still export your specification.",
    );
  const [hardware, webbing, rules] = await Promise.all([
    getHardwareCatalog(),
    getWebbingCatalog(),
    getPricingRules(),
  ]);
  if (
    hardware.error ||
    webbing.error ||
    rules.error ||
    !hardware.data ||
    !webbing.data?.length ||
    !rules.data?.length
  )
    throw new Error(
      "The live catalog could not be loaded. Please try again later; your specification can still be exported.",
    );
  return {
    hardware: hardware.data,
    webbing: webbing.data,
    rules: rules.data,
    source: "live",
  };
}
export async function loadCatalog(): Promise<Catalog> {
  try {
    return await loadLiveCatalog();
  } catch {
    return seedCatalog;
  }
}
