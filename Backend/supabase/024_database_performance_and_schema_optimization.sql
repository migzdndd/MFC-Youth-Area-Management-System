-- Migration 024: Database Performance & Schema Optimization
-- Adds missing pastoral fields and high-performance composite indexes
-- Author: Antigravity AI Pair Programmer
-- Target: Supabase Cloud PostgreSQL (MFC Youth AMS)

-- 1. Ensure all pastoral schema columns exist on members table
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS mfc_id TEXT,
  ADD COLUMN IF NOT EXISTS blood_type TEXT,
  ADD COLUMN IF NOT EXISTS medical_notes TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS is_baptized BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_first_communion BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- 2. Composite index for fast pre-sorted member roster fetches: WHERE area_id = $1 ORDER BY last_name, first_name
CREATE INDEX IF NOT EXISTS idx_members_area_name_composite
  ON public.members USING btree (area_id, last_name, first_name);

-- 3. Index for fast status-based counting (active vs inactive) in dashboard metrics
CREATE INDEX IF NOT EXISTS idx_members_area_status
  ON public.members USING btree (area_id, status);

-- 4. Index for instantaneous MFC ID QR scanning & digital member pass verification
CREATE INDEX IF NOT EXISTS idx_members_mfc_id
  ON public.members USING btree (mfc_id);

-- 5. Composite index for rapid attendance count and check-in status lookups
CREATE INDEX IF NOT EXISTS idx_event_participants_attended
  ON public.event_participants USING btree (event_id, attended);

-- 6. Index for active chapter lookups by Area
CREATE INDEX IF NOT EXISTS idx_chapters_area_active
  ON public.chapters USING btree (area_id, is_active);
