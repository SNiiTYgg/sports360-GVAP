-- ============================================================================
-- SECURE_LOGS TABLE — Firebase JWT Verified Actions Log
-- ============================================================================
-- Used by the `secure-action` Edge Function to log verified Firebase user
-- actions. No public RLS policies — only accessible via service role key.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.secure_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (no public policies — service role bypasses RLS)
ALTER TABLE public.secure_logs ENABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_secure_logs_user_id
  ON public.secure_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_secure_logs_created_at
  ON public.secure_logs(created_at);

-- ============================================================================
-- VERIFICATION:
-- 1. Run: SELECT * FROM pg_policies WHERE tablename = 'secure_logs';
--    → Should return NO rows (no public policies)
-- 2. Run: SELECT * FROM pg_indexes WHERE tablename = 'secure_logs';
--    → Should show 3 indexes (PK + user_id + created_at)
-- ============================================================================
