"use server";

import { createClient } from "@/lib/supabase/server";

// =====================================================
// Types
// =====================================================

export interface HardwareItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  type: string | null;
  width_options: number[];
  image_url: string | null;
  price_tiers: Record<string, number>;
  specs: {
    weight_g: number;
    material: string;
    finish: string;
    load_rating_lbs: number;
  };
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebbingItem {
  id: string;
  material: string;
  width: number;
  color_options: Array<{ name: string; hex: string }>;
  price_per_yard_by_region: Record<string, number>;
  moq_by_region: Record<string, number>;
  specs: {
    tensile_strength_lbs: number;
    weight_per_yard_oz: number;
    stretch_percent?: number;
  };
  active: boolean;
  created_at: string;
}

export interface PricingRule {
  id: string;
  region: string;
  labor_rate_per_unit: number;
  tooling_base: number;
  tooling_per_hardware_type: number;
  shipping_rate_per_lb: number;
  shipping_base: number;
  lead_time_weeks_min: number;
  lead_time_weeks_max: number;
  moq: number;
  qty_breaks: Array<{ min: number; max: number; discount: number }>;
  created_at: string;
}

export interface QuoteConfig {
  webbingId: string;
  lengthInches: number;
  color: string;
  plies: number;
  hardware: Array<{ id: string; qty: number }>;
  quantity: number;
}

export interface RegionQuote {
  region: string;
  regionLabel: string;
  available: boolean;
  meetsMinimum: boolean;
  moq: number;
  leadTimeMin: number;
  leadTimeMax: number;
  breakdown: {
    webbingCost: number;
    hardwareCost: number;
    laborCost: number;
    toolingCost: number;
    subtotal: number;
    volumeDiscount: number;
    shippingCost: number;
    total: number;
    perUnit: number;
  };
}

export interface QuoteResult {
  config: QuoteConfig;
  webbing: WebbingItem | null;
  hardwareItems: Array<HardwareItem & { requestedQty: number }>;
  quotes: RegionQuote[];
}

// =====================================================
// Region Labels
// =====================================================

const REGION_LABELS: Record<string, string> = {
  usa: "USA (Domestic)",
  mexico: "Mexico (Nearshore)",
  taiwan: "Taiwan",
  vietnam: "Vietnam",
  cambodia: "Cambodia",
  china: "China",
};

// =====================================================
// Server Actions
// =====================================================

/**
 * Fetch hardware catalog, optionally filtered by category
 */
export async function getHardwareCatalog(
  category?: string
): Promise<{ data: HardwareItem[] | null; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from("hardware_catalog")
    .select("*")
    .eq("active", true)
    .order("category")
    .order("name");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as HardwareItem[], error: null };
}

/**
 * Fetch webbing catalog, optionally filtered by material
 */
export async function getWebbingCatalog(
  material?: string
): Promise<{ data: WebbingItem[] | null; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from("webbing_catalog")
    .select("*")
    .eq("active", true)
    .order("material")
    .order("width");

  if (material) {
    query = query.eq("material", material);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as WebbingItem[], error: null };
}

/**
 * Fetch all pricing rules for all regions
 */
export async function getPricingRules(): Promise<{
  data: PricingRule[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .order("moq");

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as PricingRule[], error: null };
}

/**
 * Calculate quote for a strap configuration across all regions
 */
export async function calculateQuote(
  config: QuoteConfig
): Promise<{ data: QuoteResult | null; error: string | null }> {
  const supabase = await createClient();

  // Fetch webbing
  const { data: webbing, error: webbingError } = await supabase
    .from("webbing_catalog")
    .select("*")
    .eq("id", config.webbingId)
    .single();

  if (webbingError || !webbing) {
    return { data: null, error: "Webbing not found" };
  }

  // Fetch hardware items
  const hardwareIds = config.hardware.map((h) => h.id);
  const { data: hardwareItems, error: hardwareError } = await supabase
    .from("hardware_catalog")
    .select("*")
    .in("id", hardwareIds);

  if (hardwareError) {
    return { data: null, error: "Failed to fetch hardware: " + hardwareError.message };
  }

  // Fetch pricing rules
  const { data: pricingRules, error: pricingError } = await supabase
    .from("pricing_rules")
    .select("*");

  if (pricingError || !pricingRules) {
    return { data: null, error: "Failed to fetch pricing rules" };
  }

  // Calculate quotes for each region
  const quotes: RegionQuote[] = [];

  for (const rule of pricingRules as PricingRule[]) {
    const region = rule.region;
    const meetsMinimum = config.quantity >= rule.moq;

    // Get webbing price for this region
    const webbingPricePerYard =
      (webbing as WebbingItem).price_per_yard_by_region[region] || 0;

    // Calculate webbing cost (convert inches to yards, multiply by plies)
    const yardsNeeded = (config.lengthInches / 36) * config.plies;
    const webbingCostPerUnit = yardsNeeded * webbingPricePerYard;
    const webbingCost = webbingCostPerUnit * config.quantity;

    // Calculate hardware cost
    let hardwareCost = 0;
    const hardwareWithQty: Array<HardwareItem & { requestedQty: number }> = [];
    const uniqueHardwareTypes = new Set<string>();

    for (const hw of config.hardware) {
      const item = (hardwareItems as HardwareItem[])?.find((h) => h.id === hw.id);
      if (item) {
        hardwareWithQty.push({ ...item, requestedQty: hw.qty });
        uniqueHardwareTypes.add(item.type || item.category);

        // Get price tier for hardware based on total hardware qty
        const totalHardwareQty = hw.qty * config.quantity;
        const priceTiers = item.price_tiers;
        const tierKeys = Object.keys(priceTiers)
          .map(Number)
          .sort((a, b) => b - a);

        let unitPrice = priceTiers["1"] || 0;
        for (const tier of tierKeys) {
          if (totalHardwareQty >= tier) {
            unitPrice = priceTiers[tier.toString()];
            break;
          }
        }

        hardwareCost += unitPrice * hw.qty * config.quantity;
      }
    }

    // Calculate labor cost
    const laborCost = rule.labor_rate_per_unit * config.quantity;

    // Calculate tooling cost (one-time, amortized)
    const toolingCost =
      rule.tooling_base + rule.tooling_per_hardware_type * uniqueHardwareTypes.size;

    // Calculate subtotal
    const subtotal = webbingCost + hardwareCost + laborCost + toolingCost;

    // Calculate volume discount
    let discountRate = 0;
    for (const tier of rule.qty_breaks) {
      if (config.quantity >= tier.min && config.quantity <= tier.max) {
        discountRate = tier.discount;
        break;
      }
    }
    const volumeDiscount = (webbingCost + hardwareCost + laborCost) * discountRate;

    // Estimate shipping (rough estimate based on weight)
    const estimatedWeightLbs =
      (((webbing as WebbingItem).specs.weight_per_yard_oz * yardsNeeded) / 16) *
      config.quantity;
    const shippingCost =
      rule.shipping_base + rule.shipping_rate_per_lb * Math.max(1, estimatedWeightLbs);

    // Calculate total
    const total = subtotal - volumeDiscount + shippingCost;
    const perUnit = config.quantity > 0 ? total / config.quantity : 0;

    quotes.push({
      region,
      regionLabel: REGION_LABELS[region] || region,
      available: true,
      meetsMinimum,
      moq: rule.moq,
      leadTimeMin: rule.lead_time_weeks_min,
      leadTimeMax: rule.lead_time_weeks_max,
      breakdown: {
        webbingCost: Number(webbingCost.toFixed(2)),
        hardwareCost: Number(hardwareCost.toFixed(2)),
        laborCost: Number(laborCost.toFixed(2)),
        toolingCost: Number(toolingCost.toFixed(2)),
        subtotal: Number(subtotal.toFixed(2)),
        volumeDiscount: Number(volumeDiscount.toFixed(2)),
        shippingCost: Number(shippingCost.toFixed(2)),
        total: Number(total.toFixed(2)),
        perUnit: Number(perUnit.toFixed(2)),
      },
    });
  }

  // Sort quotes by per-unit cost (cheapest first)
  quotes.sort((a, b) => a.breakdown.perUnit - b.breakdown.perUnit);

  return {
    data: {
      config,
      webbing: webbing as WebbingItem,
      hardwareItems: (hardwareItems as HardwareItem[])?.map((item) => ({
        ...item,
        requestedQty: config.hardware.find((h) => h.id === item.id)?.qty || 0,
      })) || [],
      quotes,
    },
    error: null,
  };
}

/**
 * Get a single hardware item by ID
 */
export async function getHardwareById(
  id: string
): Promise<{ data: HardwareItem | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hardware_catalog")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as HardwareItem, error: null };
}

/**
 * Get a single webbing item by ID
 */
export async function getWebbingById(
  id: string
): Promise<{ data: WebbingItem | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("webbing_catalog")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as WebbingItem, error: null };
}

/**
 * Get hardware catalog grouped by category
 */
export async function getHardwareCatalogGrouped(): Promise<{
  data: Record<string, HardwareItem[]> | null;
  error: string | null;
}> {
  const { data, error } = await getHardwareCatalog();

  if (error || !data) {
    return { data: null, error };
  }

  const grouped = data.reduce(
    (acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, HardwareItem[]>
  );

  return { data: grouped, error: null };
}

/**
 * Get webbing catalog grouped by material
 */
export async function getWebbingCatalogGrouped(): Promise<{
  data: Record<string, WebbingItem[]> | null;
  error: string | null;
}> {
  const { data, error } = await getWebbingCatalog();

  if (error || !data) {
    return { data: null, error };
  }

  const grouped = data.reduce(
    (acc, item) => {
      const material = item.material;
      if (!acc[material]) {
        acc[material] = [];
      }
      acc[material].push(item);
      return acc;
    },
    {} as Record<string, WebbingItem[]>
  );

  return { data: grouped, error: null };
}
