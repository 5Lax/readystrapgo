-- =====================================================
-- Migration: Sample QR Scanner & Tracking
-- Tables: scan_samples, scan_logs, scan_feedback
-- =====================================================

-- =====================================================
-- TABLE 1: scan_samples
-- Mirror of key Vendor Samples fields from SharePoint
-- Synced periodically; external pages read from here
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scan_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sp_item_id INT UNIQUE NOT NULL,
  scan_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT,
  brand TEXT,
  status TEXT,
  photo_url TEXT,
  specs JSONB DEFAULT '{}',
  project_id INT,
  project_name TEXT,
  vendor_contact_email TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scan_samples_scan_code_idx ON public.scan_samples(scan_code);
CREATE INDEX IF NOT EXISTS scan_samples_item_type_idx ON public.scan_samples(item_type);

-- =====================================================
-- TABLE 2: scan_logs
-- Every QR code scan gets a row here
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES public.scan_samples(id) ON DELETE CASCADE,
  scan_code TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_agent TEXT,
  device_type TEXT,
  is_internal BOOLEAN DEFAULT FALSE,
  scanner_email TEXT
);

CREATE INDEX IF NOT EXISTS scan_logs_sample_id_idx ON public.scan_logs(sample_id);
CREATE INDEX IF NOT EXISTS scan_logs_scanned_at_idx ON public.scan_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS scan_logs_scan_code_idx ON public.scan_logs(scan_code);

-- =====================================================
-- TABLE 3: scan_feedback
-- External user feedback and approvals
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES public.scan_samples(id) ON DELETE CASCADE,
  scan_code TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  feedback_type TEXT NOT NULL DEFAULT 'comment',
  comment TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  synced_to_sp BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS scan_feedback_sample_id_idx ON public.scan_feedback(sample_id);
CREATE INDEX IF NOT EXISTS scan_feedback_email_idx ON public.scan_feedback(email);

-- =====================================================
-- ROW LEVEL SECURITY
-- scan_logs: allow anonymous inserts (from scan endpoint)
-- scan_samples: read-only for anon, admin can manage
-- scan_feedback: allow anonymous inserts
-- =====================================================

ALTER TABLE public.scan_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_feedback ENABLE ROW LEVEL SECURITY;

-- scan_samples: anyone can read (external landing page), admins can write
CREATE POLICY "Anyone can read samples" ON public.scan_samples
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert samples" ON public.scan_samples
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update samples" ON public.scan_samples
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete samples" ON public.scan_samples
  FOR DELETE USING (public.is_admin());

-- scan_logs: anyone can insert (scan tracking), admins can read
CREATE POLICY "Anyone can insert scan logs" ON public.scan_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read scan logs" ON public.scan_logs
  FOR SELECT USING (public.is_admin());

-- scan_feedback: anyone can insert, admins can read/manage
CREATE POLICY "Anyone can insert feedback" ON public.scan_feedback
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read feedback" ON public.scan_feedback
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update feedback" ON public.scan_feedback
  FOR UPDATE USING (public.is_admin());

-- =====================================================
-- SERVICE ROLE BYPASS
-- The scan API route uses the service role key, which
-- bypasses RLS entirely. These policies are for direct
-- Supabase client access from the browser.
-- =====================================================

-- =====================================================
-- VIEWS: scan analytics helpers
-- =====================================================

CREATE OR REPLACE VIEW public.scan_stats AS
SELECT
  s.id AS sample_id,
  s.scan_code,
  s.title,
  s.item_type,
  COUNT(l.id) AS total_scans,
  COUNT(DISTINCT l.ip_address) AS unique_scanners,
  MAX(l.scanned_at) AS last_scanned,
  MIN(l.scanned_at) AS first_scanned
FROM public.scan_samples s
LEFT JOIN public.scan_logs l ON l.sample_id = s.id
GROUP BY s.id, s.scan_code, s.title, s.item_type;