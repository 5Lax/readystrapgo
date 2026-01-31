-- =====================================================
-- Migration: Seed Catalog Data
-- Inserts hardware, webbing, and pricing rules
-- =====================================================

-- =====================================================
-- HARDWARE CATALOG - 20 Items
-- =====================================================

-- BUCKLES (4 items)
INSERT INTO public.hardware_catalog (sku, name, category, type, width_options, price_tiers, specs) VALUES
(
  'BKL-SR-075',
  '3/4" Side Release Buckle',
  'buckle',
  'side-release',
  '[0.75]',
  '{"1": 0.45, "100": 0.38, "500": 0.32, "1000": 0.28, "5000": 0.22}',
  '{"weight_g": 8, "material": "POM Acetal", "finish": "Matte", "load_rating_lbs": 50}'
),
(
  'BKL-SR-100',
  '1" Side Release Buckle',
  'buckle',
  'side-release',
  '[1.0]',
  '{"1": 0.55, "100": 0.46, "500": 0.38, "1000": 0.32, "5000": 0.26}',
  '{"weight_g": 12, "material": "POM Acetal", "finish": "Matte", "load_rating_lbs": 80}'
),
(
  'BKL-CAM-100',
  '1" Cam Buckle',
  'buckle',
  'cam',
  '[1.0]',
  '{"1": 0.65, "100": 0.55, "500": 0.45, "1000": 0.38, "5000": 0.30}',
  '{"weight_g": 18, "material": "Zinc Alloy", "finish": "Nickel Plated", "load_rating_lbs": 200}'
),
(
  'BKL-FID-075',
  '3/4" FIDLOCK V-Buckle',
  'buckle',
  'fidlock',
  '[0.75]',
  '{"1": 3.25, "100": 2.95, "500": 2.65, "1000": 2.40, "5000": 2.15}',
  '{"weight_g": 14, "material": "Glass-Filled Nylon", "finish": "Matte Black", "load_rating_lbs": 60}'
);

-- RINGS (3 items)
INSERT INTO public.hardware_catalog (sku, name, category, type, width_options, price_tiers, specs) VALUES
(
  'RNG-D-075',
  '3/4" D-Ring',
  'ring',
  'd-ring',
  '[0.75]',
  '{"1": 0.18, "100": 0.14, "500": 0.11, "1000": 0.09, "5000": 0.07}',
  '{"weight_g": 6, "material": "Steel", "finish": "Nickel Plated", "load_rating_lbs": 150}'
),
(
  'RNG-D-100',
  '1" D-Ring',
  'ring',
  'd-ring',
  '[1.0]',
  '{"1": 0.22, "100": 0.18, "500": 0.14, "1000": 0.11, "5000": 0.08}',
  '{"weight_g": 10, "material": "Steel", "finish": "Nickel Plated", "load_rating_lbs": 200}'
),
(
  'RNG-O-100',
  '1" O-Ring',
  'ring',
  'o-ring',
  '[1.0]',
  '{"1": 0.15, "100": 0.12, "500": 0.09, "1000": 0.07, "5000": 0.05}',
  '{"weight_g": 8, "material": "Steel", "finish": "Nickel Plated", "load_rating_lbs": 180}'
);

-- SLIDERS (3 items)
INSERT INTO public.hardware_catalog (sku, name, category, type, width_options, price_tiers, specs) VALUES
(
  'SLD-TRI-075',
  '3/4" Tri-Glide Slider',
  'slider',
  'tri-glide',
  '[0.75]',
  '{"1": 0.22, "100": 0.18, "500": 0.14, "1000": 0.11, "5000": 0.08}',
  '{"weight_g": 4, "material": "POM Acetal", "finish": "Matte", "load_rating_lbs": 40}'
),
(
  'SLD-TRI-100',
  '1" Tri-Glide Slider',
  'slider',
  'tri-glide',
  '[1.0]',
  '{"1": 0.28, "100": 0.22, "500": 0.18, "1000": 0.14, "5000": 0.10}',
  '{"weight_g": 6, "material": "POM Acetal", "finish": "Matte", "load_rating_lbs": 60}'
),
(
  'SLD-LAD-100',
  '1" Ladder Lock Slider',
  'slider',
  'ladder-lock',
  '[1.0]',
  '{"1": 0.32, "100": 0.26, "500": 0.21, "1000": 0.17, "5000": 0.13}',
  '{"weight_g": 8, "material": "POM Acetal", "finish": "Matte", "load_rating_lbs": 70}'
);

-- SNAPS (3 items)
INSERT INTO public.hardware_catalog (sku, name, category, type, width_options, price_tiers, specs) VALUES
(
  'SNP-HK-075',
  '3/4" Snap Hook',
  'snap',
  'snap-hook',
  '[0.75]',
  '{"1": 0.55, "100": 0.45, "500": 0.38, "1000": 0.32, "5000": 0.26}',
  '{"weight_g": 22, "material": "Zinc Alloy", "finish": "Nickel Plated", "load_rating_lbs": 120}'
),
(
  'SNP-HK-100',
  '1" Snap Hook',
  'snap',
  'snap-hook',
  '[1.0]',
  '{"1": 0.65, "100": 0.55, "500": 0.45, "1000": 0.38, "5000": 0.30}',
  '{"weight_g": 32, "material": "Zinc Alloy", "finish": "Nickel Plated", "load_rating_lbs": 180}'
),
(
  'SNP-SWV-100',
  '1" Swivel Snap Hook',
  'snap',
  'swivel-hook',
  '[1.0]',
  '{"1": 0.72, "100": 0.62, "500": 0.52, "1000": 0.44, "5000": 0.36}',
  '{"weight_g": 38, "material": "Zinc Alloy", "finish": "Nickel Plated", "load_rating_lbs": 160}'
);

-- OTHER (4 items)
INSERT INTO public.hardware_catalog (sku, name, category, type, width_options, price_tiers, specs) VALUES
(
  'OTH-RVT-DC',
  'Double Cap Rivet',
  'other',
  'rivet',
  '[0.5, 0.75, 1.0, 1.5]',
  '{"1": 0.08, "100": 0.06, "500": 0.05, "1000": 0.04, "5000": 0.03}',
  '{"weight_g": 2, "material": "Brass", "finish": "Antique Brass", "load_rating_lbs": 25}'
),
(
  'OTH-CRD-END',
  'Cord End / Aglet',
  'other',
  'cord-end',
  '[0.25, 0.375]',
  '{"1": 0.12, "100": 0.09, "500": 0.07, "1000": 0.05, "5000": 0.04}',
  '{"weight_g": 1, "material": "Zinc Alloy", "finish": "Nickel Plated", "load_rating_lbs": 15}'
),
(
  'OTH-KEY-SPL',
  'Split Key Ring 1"',
  'other',
  'key-ring',
  '[1.0]',
  '{"1": 0.10, "100": 0.08, "500": 0.06, "1000": 0.05, "5000": 0.04}',
  '{"weight_g": 4, "material": "Steel", "finish": "Nickel Plated", "load_rating_lbs": 30}'
),
(
  'OTH-KPR-100',
  '1" Webbing Keeper',
  'other',
  'keeper',
  '[1.0]',
  '{"1": 0.06, "100": 0.05, "500": 0.04, "1000": 0.03, "5000": 0.02}',
  '{"weight_g": 1, "material": "Silicone Rubber", "finish": "Matte Black", "load_rating_lbs": 5}'
);

-- PREMIUM (3 items)
INSERT INTO public.hardware_catalog (sku, name, category, type, width_options, price_tiers, specs) VALUES
(
  'BKL-CBR-150',
  '1.5" Cobra Buckle',
  'buckle',
  'side-release',
  '[1.5]',
  '{"1": 1.85, "100": 1.65, "500": 1.45, "1000": 1.28, "5000": 1.12}',
  '{"weight_g": 45, "material": "Glass-Filled Nylon", "finish": "Matte Black", "load_rating_lbs": 300}'
),
(
  'BKL-DFX-100',
  '1" Duraflex Stealth Buckle',
  'buckle',
  'side-release',
  '[1.0]',
  '{"1": 0.95, "100": 0.82, "500": 0.72, "1000": 0.62, "5000": 0.52}',
  '{"weight_g": 15, "material": "POM Acetal", "finish": "Matte Black", "load_rating_lbs": 100}'
),
(
  'BKL-BRK-075',
  '3/4" Breakaway Safety Buckle',
  'buckle',
  'breakaway',
  '[0.75]',
  '{"1": 0.38, "100": 0.32, "500": 0.26, "1000": 0.22, "5000": 0.18}',
  '{"weight_g": 6, "material": "POM Acetal", "finish": "Matte", "load_rating_lbs": 15}'
);

-- =====================================================
-- WEBBING CATALOG - 15 Items (5 materials × 3 widths)
-- =====================================================

-- NYLON 6/6 (3 widths)
INSERT INTO public.webbing_catalog (material, width, color_options, price_per_yard_by_region, moq_by_region, specs) VALUES
(
  'nylon',
  0.75,
  '[{"name": "Black", "hex": "#000000"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Charcoal", "hex": "#36454f"}, {"name": "Olive", "hex": "#556b2f"}, {"name": "Coyote", "hex": "#81613c"}, {"name": "Red", "hex": "#cc0000"}, {"name": "Royal Blue", "hex": "#4169e1"}, {"name": "Safety Orange", "hex": "#ff6600"}]',
  '{"usa": 0.38, "mexico": 0.32, "taiwan": 0.28, "vietnam": 0.22, "cambodia": 0.20, "china": 0.18}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 600, "weight_per_yard_oz": 0.8}'
),
(
  'nylon',
  1.0,
  '[{"name": "Black", "hex": "#000000"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Charcoal", "hex": "#36454f"}, {"name": "Olive", "hex": "#556b2f"}, {"name": "Coyote", "hex": "#81613c"}, {"name": "Red", "hex": "#cc0000"}, {"name": "Royal Blue", "hex": "#4169e1"}, {"name": "Safety Orange", "hex": "#ff6600"}]',
  '{"usa": 0.42, "mexico": 0.36, "taiwan": 0.32, "vietnam": 0.26, "cambodia": 0.24, "china": 0.22}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 800, "weight_per_yard_oz": 1.1}'
),
(
  'nylon',
  1.5,
  '[{"name": "Black", "hex": "#000000"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Charcoal", "hex": "#36454f"}, {"name": "Olive", "hex": "#556b2f"}, {"name": "Coyote", "hex": "#81613c"}, {"name": "Red", "hex": "#cc0000"}, {"name": "Royal Blue", "hex": "#4169e1"}, {"name": "Safety Orange", "hex": "#ff6600"}]',
  '{"usa": 0.52, "mexico": 0.44, "taiwan": 0.38, "vietnam": 0.32, "cambodia": 0.28, "china": 0.26}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 1200, "weight_per_yard_oz": 1.6}'
);

-- POLYESTER (3 widths)
INSERT INTO public.webbing_catalog (material, width, color_options, price_per_yard_by_region, moq_by_region, specs) VALUES
(
  'polyester',
  0.75,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Gray", "hex": "#808080"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Red", "hex": "#cc0000"}]',
  '{"usa": 0.32, "mexico": 0.26, "taiwan": 0.22, "vietnam": 0.18, "cambodia": 0.16, "china": 0.14}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 450, "weight_per_yard_oz": 0.7}'
),
(
  'polyester',
  1.0,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Gray", "hex": "#808080"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Red", "hex": "#cc0000"}]',
  '{"usa": 0.35, "mexico": 0.29, "taiwan": 0.25, "vietnam": 0.20, "cambodia": 0.18, "china": 0.16}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 600, "weight_per_yard_oz": 0.9}'
),
(
  'polyester',
  1.5,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Gray", "hex": "#808080"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Red", "hex": "#cc0000"}]',
  '{"usa": 0.45, "mexico": 0.38, "taiwan": 0.32, "vietnam": 0.26, "cambodia": 0.24, "china": 0.22}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 900, "weight_per_yard_oz": 1.4}'
);

-- POLYPROPYLENE (3 widths)
INSERT INTO public.webbing_catalog (material, width, color_options, price_per_yard_by_region, moq_by_region, specs) VALUES
(
  'polypropylene',
  0.75,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Red", "hex": "#cc0000"}, {"name": "Blue", "hex": "#0066cc"}, {"name": "Green", "hex": "#228b22"}, {"name": "Yellow", "hex": "#ffd700"}]',
  '{"usa": 0.20, "mexico": 0.16, "taiwan": 0.14, "vietnam": 0.11, "cambodia": 0.10, "china": 0.09}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 300, "weight_per_yard_oz": 0.5}'
),
(
  'polypropylene',
  1.0,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Red", "hex": "#cc0000"}, {"name": "Blue", "hex": "#0066cc"}, {"name": "Green", "hex": "#228b22"}, {"name": "Yellow", "hex": "#ffd700"}]',
  '{"usa": 0.22, "mexico": 0.18, "taiwan": 0.15, "vietnam": 0.12, "cambodia": 0.11, "china": 0.10}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 400, "weight_per_yard_oz": 0.7}'
),
(
  'polypropylene',
  1.5,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Red", "hex": "#cc0000"}, {"name": "Blue", "hex": "#0066cc"}, {"name": "Green", "hex": "#228b22"}, {"name": "Yellow", "hex": "#ffd700"}]',
  '{"usa": 0.28, "mexico": 0.23, "taiwan": 0.20, "vietnam": 0.16, "cambodia": 0.14, "china": 0.13}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 600, "weight_per_yard_oz": 1.0}'
);

-- ELASTIC (3 widths)
INSERT INTO public.webbing_catalog (material, width, color_options, price_per_yard_by_region, moq_by_region, specs) VALUES
(
  'elastic',
  0.75,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Gray", "hex": "#808080"}]',
  '{"usa": 0.50, "mexico": 0.42, "taiwan": 0.36, "vietnam": 0.30, "cambodia": 0.28, "china": 0.25}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 150, "weight_per_yard_oz": 0.6, "stretch_percent": 100}'
),
(
  'elastic',
  1.0,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Gray", "hex": "#808080"}]',
  '{"usa": 0.55, "mexico": 0.46, "taiwan": 0.40, "vietnam": 0.33, "cambodia": 0.30, "china": 0.28}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 200, "weight_per_yard_oz": 0.8, "stretch_percent": 100}'
),
(
  'elastic',
  1.5,
  '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#ffffff"}, {"name": "Gray", "hex": "#808080"}]',
  '{"usa": 0.68, "mexico": 0.58, "taiwan": 0.50, "vietnam": 0.42, "cambodia": 0.38, "china": 0.35}',
  '{"usa": 50, "mexico": 100, "taiwan": 200, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 280, "weight_per_yard_oz": 1.2, "stretch_percent": 100}'
);

-- UHMWPE / DYNEEMA (3 widths)
INSERT INTO public.webbing_catalog (material, width, color_options, price_per_yard_by_region, moq_by_region, specs) VALUES
(
  'uhmwpe',
  0.75,
  '[{"name": "White", "hex": "#f5f5f5"}, {"name": "Gray", "hex": "#808080"}, {"name": "Black", "hex": "#1a1a1a"}]',
  '{"usa": 1.65, "mexico": 1.45, "taiwan": 1.30, "vietnam": 1.15, "cambodia": 1.10, "china": 1.00}',
  '{"usa": 100, "mexico": 200, "taiwan": 300, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 1500, "weight_per_yard_oz": 0.4}'
),
(
  'uhmwpe',
  1.0,
  '[{"name": "White", "hex": "#f5f5f5"}, {"name": "Gray", "hex": "#808080"}, {"name": "Black", "hex": "#1a1a1a"}]',
  '{"usa": 1.85, "mexico": 1.62, "taiwan": 1.45, "vietnam": 1.28, "cambodia": 1.22, "china": 1.12}',
  '{"usa": 100, "mexico": 200, "taiwan": 300, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 2000, "weight_per_yard_oz": 0.5}'
),
(
  'uhmwpe',
  1.5,
  '[{"name": "White", "hex": "#f5f5f5"}, {"name": "Gray", "hex": "#808080"}, {"name": "Black", "hex": "#1a1a1a"}]',
  '{"usa": 2.35, "mexico": 2.05, "taiwan": 1.85, "vietnam": 1.62, "cambodia": 1.55, "china": 1.42}',
  '{"usa": 100, "mexico": 200, "taiwan": 300, "vietnam": 500, "cambodia": 500, "china": 1000}',
  '{"tensile_strength_lbs": 3000, "weight_per_yard_oz": 0.7}'
);

-- =====================================================
-- PRICING RULES - 6 Regions
-- =====================================================

INSERT INTO public.pricing_rules (region, labor_rate_per_unit, tooling_base, tooling_per_hardware_type, shipping_rate_per_lb, shipping_base, lead_time_weeks_min, lead_time_weeks_max, moq, qty_breaks) VALUES
(
  'usa',
  0.35,
  0,
  0,
  0.85,
  45,
  2,
  3,
  100,
  '[{"min": 1, "max": 99, "discount": 0}, {"min": 100, "max": 249, "discount": 0}, {"min": 250, "max": 499, "discount": 0.05}, {"min": 500, "max": 999, "discount": 0.10}, {"min": 1000, "max": 4999, "discount": 0.18}, {"min": 5000, "max": 9999, "discount": 0.25}, {"min": 10000, "max": 99999, "discount": 0.32}]'
),
(
  'mexico',
  0.25,
  200,
  50,
  0.65,
  75,
  4,
  5,
  250,
  '[{"min": 1, "max": 99, "discount": 0}, {"min": 100, "max": 249, "discount": 0}, {"min": 250, "max": 499, "discount": 0.05}, {"min": 500, "max": 999, "discount": 0.10}, {"min": 1000, "max": 4999, "discount": 0.18}, {"min": 5000, "max": 9999, "discount": 0.25}, {"min": 10000, "max": 99999, "discount": 0.32}]'
),
(
  'taiwan',
  0.20,
  350,
  75,
  0.55,
  150,
  6,
  8,
  500,
  '[{"min": 1, "max": 99, "discount": 0}, {"min": 100, "max": 249, "discount": 0}, {"min": 250, "max": 499, "discount": 0.05}, {"min": 500, "max": 999, "discount": 0.10}, {"min": 1000, "max": 4999, "discount": 0.18}, {"min": 5000, "max": 9999, "discount": 0.25}, {"min": 10000, "max": 99999, "discount": 0.32}]'
),
(
  'vietnam',
  0.13,
  300,
  65,
  0.48,
  175,
  8,
  10,
  1000,
  '[{"min": 1, "max": 99, "discount": 0}, {"min": 100, "max": 249, "discount": 0}, {"min": 250, "max": 499, "discount": 0.05}, {"min": 500, "max": 999, "discount": 0.10}, {"min": 1000, "max": 4999, "discount": 0.18}, {"min": 5000, "max": 9999, "discount": 0.25}, {"min": 10000, "max": 99999, "discount": 0.32}]'
),
(
  'cambodia',
  0.12,
  250,
  55,
  0.50,
  200,
  8,
  10,
  1000,
  '[{"min": 1, "max": 99, "discount": 0}, {"min": 100, "max": 249, "discount": 0}, {"min": 250, "max": 499, "discount": 0.05}, {"min": 500, "max": 999, "discount": 0.10}, {"min": 1000, "max": 4999, "discount": 0.18}, {"min": 5000, "max": 9999, "discount": 0.25}, {"min": 10000, "max": 99999, "discount": 0.32}]'
),
(
  'china',
  0.10,
  150,
  40,
  0.42,
  225,
  10,
  12,
  2000,
  '[{"min": 1, "max": 99, "discount": 0}, {"min": 100, "max": 249, "discount": 0}, {"min": 250, "max": 499, "discount": 0.05}, {"min": 500, "max": 999, "discount": 0.10}, {"min": 1000, "max": 4999, "discount": 0.18}, {"min": 5000, "max": 9999, "discount": 0.25}, {"min": 10000, "max": 99999, "discount": 0.32}]'
);
