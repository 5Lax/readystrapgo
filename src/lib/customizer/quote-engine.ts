import type {
  HardwareItem,
  WebbingItem,
  PricingRule,
  QuoteConfig,
  QuoteResult,
  RegionQuote,
} from "../actions/catalog";

// Provisional finishing allowances, explicitly shown in the estimate; confirm at review.
export const FINISHING_PER_UNIT = { sealed: 0, folded: 0.15, loops: 0.3 };
export const WOVEN_LABEL_PER_UNIT = 0.25;
export const WOVEN_LABEL_SETUP = 35;

const REGION_LABELS: Record<string, string> = {
  usa: "USA (Domestic)",
  mexico: "Mexico (Nearshore)",
  taiwan: "Taiwan",
  vietnam: "Vietnam",
  cambodia: "Cambodia",
  china: "China",
};

/** Shared catalog quote engine, extracted from actions/catalog.ts. All amounts are USD. */
export function quoteFromCatalog(
  config: QuoteConfig,
  webbing: WebbingItem,
  hardwareItems: HardwareItem[],
  pricingRules: PricingRule[],
): QuoteResult {
  if (
    !webbing.active ||
    config.webbingId !== webbing.id ||
    !Number.isFinite(config.lengthInches) ||
    config.lengthInches <= 0 ||
    config.lengthInches > 100 ||
    !Number.isInteger(config.quantity) ||
    config.quantity < 1 ||
    config.quantity > 20000 ||
    !Number.isInteger(config.plies) ||
    config.plies < 1 ||
    config.plies > 3 ||
    !webbing.color_options.some((c) => c.name === config.color)
  ) {
    throw new Error("Invalid webbing, dimensions, color, or quantity.");
  }
  const ids = new Set<string>();
  for (const requested of config.hardware) {
    const item = hardwareItems.find((h) => h.id === requested.id);
    if (
      !item?.active ||
      !Number.isInteger(requested.qty) ||
      requested.qty < 1 ||
      requested.qty > 20 ||
      ids.has(requested.id) ||
      (item.width_options.length > 0 &&
        !item.width_options.includes(webbing.width))
    ) {
      throw new Error("Missing, duplicate, or incompatible hardware.");
    }
    ids.add(requested.id);
  }
  if (
    config.finishing &&
    (!Object.prototype.hasOwnProperty.call(
      FINISHING_PER_UNIT,
      config.finishing.ends,
    ) ||
      !["none", "woven"].includes(config.finishing.logo))
  )
    throw new Error("Invalid finishing option.");
  // Calculate quotes for each region
  const quotes: RegionQuote[] = [];

  for (const rule of pricingRules as PricingRule[]) {
    const region = rule.region;
    const moq = Math.max(rule.moq, webbing.moq_by_region[region] ?? rule.moq);
    const meetsMinimum = config.quantity >= moq;

    // Get webbing price for this region
    const webbingPricePerYard = webbing.price_per_yard_by_region[region];
    // Missing rates must never turn into free webbing or an orderable region.
    if (!Number.isFinite(webbingPricePerYard) || webbingPricePerYard <= 0)
      continue;

    // Calculate webbing cost (convert inches to yards, multiply by plies)
    const yardsNeeded = (config.lengthInches / 36) * config.plies;
    const webbingCostPerUnit = yardsNeeded * webbingPricePerYard;
    const webbingCost = webbingCostPerUnit * config.quantity;

    // Calculate hardware cost
    let hardwareCost = 0;
    const uniqueHardwareTypes = new Set<string>();

    for (const hw of config.hardware) {
      const item = (hardwareItems as HardwareItem[])?.find(
        (h) => h.id === hw.id,
      );
      if (item) {
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
    const finishingCost = config.finishing
      ? (FINISHING_PER_UNIT[config.finishing.ends] +
          (config.finishing.logo === "woven" ? WOVEN_LABEL_PER_UNIT : 0)) *
        config.quantity
      : 0;
    const logoSetupCost =
      config.finishing?.logo === "woven" ? WOVEN_LABEL_SETUP : 0;
    const laborCost = rule.labor_rate_per_unit * config.quantity;

    // Calculate tooling cost (one-time, amortized)
    const toolingCost =
      rule.tooling_base +
      rule.tooling_per_hardware_type * uniqueHardwareTypes.size;

    // Calculate subtotal
    const subtotal =
      webbingCost +
      hardwareCost +
      laborCost +
      toolingCost +
      finishingCost +
      logoSetupCost;

    // Calculate volume discount
    let discountRate = 0;
    for (const tier of rule.qty_breaks) {
      if (config.quantity >= tier.min && config.quantity <= tier.max) {
        discountRate = tier.discount;
        break;
      }
    }
    const volumeDiscount =
      (webbingCost + hardwareCost + laborCost) * discountRate;

    // Estimate shipping (rough estimate based on weight)
    const estimatedWeightLbs =
      (((webbing as WebbingItem).specs.weight_per_yard_oz * yardsNeeded) / 16) *
        config.quantity +
      config.hardware.reduce(
        (sum, hw) =>
          sum +
          ((hardwareItems.find((h) => h.id === hw.id)?.specs.weight_g ?? 0) *
            hw.qty *
            config.quantity) /
            453.59237,
        0,
      );
    const shippingCost =
      rule.shipping_base +
      rule.shipping_rate_per_lb * Math.max(1, estimatedWeightLbs);

    // Calculate total
    const total = subtotal - volumeDiscount + shippingCost;
    const perUnit = config.quantity > 0 ? total / config.quantity : 0;

    quotes.push({
      region,
      regionLabel: REGION_LABELS[region] || region,
      available: true,
      meetsMinimum,
      moq,
      leadTimeMin: rule.lead_time_weeks_min,
      leadTimeMax: rule.lead_time_weeks_max,
      breakdown: {
        webbingCost: Number(webbingCost.toFixed(2)),
        hardwareCost: Number(hardwareCost.toFixed(2)),
        laborCost: Number(laborCost.toFixed(2)),
        toolingCost: Number(toolingCost.toFixed(2)),
        finishingCost: Number(finishingCost.toFixed(2)),
        logoSetupCost,
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
    config,
    webbing: webbing as WebbingItem,
    hardwareItems:
      hardwareItems
        .filter((item) => config.hardware.some((h) => h.id === item.id))
        .map((item) => ({
          ...item,
          requestedQty: config.hardware.find((h) => h.id === item.id)?.qty || 0,
        })) || [],
    quotes,
  };
}
