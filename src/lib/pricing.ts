import { StrapSpecs, Hardware, PriceBreakdown, LineItem } from './types';

// Base prices
const BASE_PRICE_PER_FOOT = 2.50;
const BASE_PRICE_PER_INCH_WIDTH = 0.50;

// Material multipliers
const MATERIAL_MULTIPLIERS: Record<string, number> = {
  nylon: 1.0,
  polyester: 1.2,
  polypropylene: 0.9,
  cotton: 1.3,
  leather: 3.5,
  neoprene: 2.0,
};

// Hardware prices
const HARDWARE_PRICES: Record<string, number> = {
  buckleType_none: 0,
  buckleType_side_release: 1.25,
  buckleType_cam: 1.75,
  buckleType_ladder_lock: 1.50,
  buckleType_metal: 2.50,
  dRings: 0.75,
  rivets: 0.35,
  snaps: 0.85,
  velcro: 1.50,
  triGlide: 0.65,
};

// Quantity discount tiers
const QUANTITY_DISCOUNTS: { min: number; discount: number }[] = [
  { min: 100, discount: 0.15 },
  { min: 50, discount: 0.10 },
  { min: 25, discount: 0.05 },
  { min: 1, discount: 0 },
];

export function calculatePrice(
  specs: StrapSpecs,
  hardware: Hardware,
  quantity: number
): PriceBreakdown {
  const lineItems: LineItem[] = [];

  // Calculate base strap price
  const lengthInFeet = specs.length / 12;
  const baseStrapPrice = lengthInFeet * BASE_PRICE_PER_FOOT + specs.width * BASE_PRICE_PER_INCH_WIDTH;

  // Get material multiplier
  const materialMultiplier = MATERIAL_MULTIPLIERS[specs.material] || 1.0;
  const strapWithMaterial = baseStrapPrice * materialMultiplier;

  lineItems.push({
    description: `${specs.material.charAt(0).toUpperCase() + specs.material.slice(1)} Strap - ${specs.length}" x ${specs.width}"`,
    quantity: quantity,
    unitPrice: Number(strapWithMaterial.toFixed(2)),
    total: Number((strapWithMaterial * quantity).toFixed(2)),
  });

  // Calculate hardware total
  let hardwareTotal = 0;

  // Buckle
  if (hardware.buckleType && hardware.buckleType !== 'none') {
    const buckleKey = `buckleType_${hardware.buckleType.replace(/[\s-]/g, '_')}`;
    const bucklePrice = HARDWARE_PRICES[buckleKey] || 0;
    if (bucklePrice > 0) {
      hardwareTotal += bucklePrice;
      lineItems.push({
        description: `${hardware.buckleType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Buckle`,
        quantity: quantity,
        unitPrice: bucklePrice,
        total: Number((bucklePrice * quantity).toFixed(2)),
      });
    }
  }

  // Other hardware
  if (hardware.dRings) {
    hardwareTotal += HARDWARE_PRICES.dRings;
    lineItems.push({
      description: 'D-Rings (pair)',
      quantity: quantity,
      unitPrice: HARDWARE_PRICES.dRings,
      total: Number((HARDWARE_PRICES.dRings * quantity).toFixed(2)),
    });
  }

  if (hardware.rivets) {
    hardwareTotal += HARDWARE_PRICES.rivets;
    lineItems.push({
      description: 'Rivets (set)',
      quantity: quantity,
      unitPrice: HARDWARE_PRICES.rivets,
      total: Number((HARDWARE_PRICES.rivets * quantity).toFixed(2)),
    });
  }

  if (hardware.snaps) {
    hardwareTotal += HARDWARE_PRICES.snaps;
    lineItems.push({
      description: 'Snap Fasteners',
      quantity: quantity,
      unitPrice: HARDWARE_PRICES.snaps,
      total: Number((HARDWARE_PRICES.snaps * quantity).toFixed(2)),
    });
  }

  if (hardware.velcro) {
    hardwareTotal += HARDWARE_PRICES.velcro;
    lineItems.push({
      description: 'Velcro Strips',
      quantity: quantity,
      unitPrice: HARDWARE_PRICES.velcro,
      total: Number((HARDWARE_PRICES.velcro * quantity).toFixed(2)),
    });
  }

  if (hardware.triGlide) {
    hardwareTotal += HARDWARE_PRICES.triGlide;
    lineItems.push({
      description: 'Tri-Glide Adjuster',
      quantity: quantity,
      unitPrice: HARDWARE_PRICES.triGlide,
      total: Number((HARDWARE_PRICES.triGlide * quantity).toFixed(2)),
    });
  }

  // Calculate subtotal per unit
  const subtotalPerUnit = strapWithMaterial + hardwareTotal;
  const subtotal = subtotalPerUnit * quantity;

  // Calculate quantity discount
  const discountTier = QUANTITY_DISCOUNTS.find(tier => quantity >= tier.min);
  const discountRate = discountTier?.discount || 0;
  const quantityDiscount = subtotal * discountRate;

  // Calculate total
  const total = subtotal - quantityDiscount;

  return {
    baseStrapPrice: Number(baseStrapPrice.toFixed(2)),
    materialMultiplier,
    hardwareTotal: Number(hardwareTotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    quantityDiscount: Number(quantityDiscount.toFixed(2)),
    total: Number(total.toFixed(2)),
    lineItems,
  };
}

export function getQuantityDiscountLabel(quantity: number): string {
  if (quantity >= 100) return '15% volume discount applied';
  if (quantity >= 50) return '10% volume discount applied';
  if (quantity >= 25) return '5% volume discount applied';
  return 'Order 25+ for volume discounts';
}
