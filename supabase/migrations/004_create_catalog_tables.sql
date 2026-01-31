-- =====================================================
-- Migration: Create Catalog Tables for Strap Configurator
-- Tables: hardware_catalog, webbing_catalog, pricing_rules
-- =====================================================

-- Add role column to user_profiles if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- =====================================================
-- TABLE 1: hardware_catalog
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hardware_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- buckle, ring, slider, snap, other
  type TEXT, -- side-release, cam, magnetic, fidlock, tri-glide, ladder-lock, d-ring, o-ring, snap-hook, swivel-hook, rivet, cord-end, key-ring
  width_options JSONB, -- array of compatible widths in inches
  image_url TEXT,
  price_tiers JSONB, -- qty break pricing
  specs JSONB, -- {weight_g, material, finish, load_rating_lbs}
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS hardware_catalog_category_idx ON public.hardware_catalog(category);
CREATE INDEX IF NOT EXISTS hardware_catalog_type_idx ON public.hardware_catalog(type);
CREATE INDEX IF NOT EXISTS hardware_catalog_active_idx ON public.hardware_catalog(active);

-- =====================================================
-- TABLE 2: webbing_catalog
-- =====================================================
CREATE TABLE IF NOT EXISTS public.webbing_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material TEXT NOT NULL, -- nylon, polyester, polypropylene, elastic, uhmwpe
  width DECIMAL NOT NULL, -- inches
  color_options JSONB, -- array of {name, hex} objects
  price_per_yard_by_region JSONB, -- {usa, mexico, taiwan, vietnam, cambodia, china}
  moq_by_region JSONB, -- minimum order qty by region
  specs JSONB, -- {tensile_strength_lbs, weight_per_yard_oz}
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS webbing_catalog_material_idx ON public.webbing_catalog(material);
CREATE INDEX IF NOT EXISTS webbing_catalog_width_idx ON public.webbing_catalog(width);
CREATE INDEX IF NOT EXISTS webbing_catalog_active_idx ON public.webbing_catalog(active);

-- =====================================================
-- TABLE 3: pricing_rules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT UNIQUE NOT NULL, -- usa, mexico, taiwan, vietnam, cambodia, china
  labor_rate_per_unit DECIMAL NOT NULL,
  tooling_base DECIMAL NOT NULL,
  tooling_per_hardware_type DECIMAL NOT NULL,
  shipping_rate_per_lb DECIMAL NOT NULL,
  shipping_base DECIMAL NOT NULL,
  lead_time_weeks_min INT NOT NULL,
  lead_time_weeks_max INT NOT NULL,
  moq INT NOT NULL,
  qty_breaks JSONB, -- discount tiers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS pricing_rules_region_idx ON public.pricing_rules(region);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.hardware_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webbing_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Hardware Catalog Policies
CREATE POLICY "Public can view active hardware" ON public.hardware_catalog
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert hardware" ON public.hardware_catalog
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update hardware" ON public.hardware_catalog
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete hardware" ON public.hardware_catalog
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Webbing Catalog Policies
CREATE POLICY "Public can view active webbing" ON public.webbing_catalog
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert webbing" ON public.webbing_catalog
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update webbing" ON public.webbing_catalog
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete webbing" ON public.webbing_catalog
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Pricing Rules Policies
CREATE POLICY "Public can view pricing rules" ON public.pricing_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert pricing rules" ON public.pricing_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update pricing rules" ON public.pricing_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete pricing rules" ON public.pricing_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
