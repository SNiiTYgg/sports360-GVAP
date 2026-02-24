-- ============================================================================
-- VOTING SYSTEM SECURITY MIGRATION
-- ============================================================================
-- Adds user_id column for verified Firebase UID storage,
-- creates unique index for one-vote-per-user enforcement,
-- and removes public INSERT policy (votes go through Edge Function only).
-- ============================================================================

-- 1. Add user_id column (nullable to preserve existing data)
ALTER TABLE public.poll_votes
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 2. Backfill: copy existing user_identifier values into user_id
-- so existing votes are recognized under the new column
UPDATE public.poll_votes
SET user_id = user_identifier
WHERE user_id IS NULL;

-- 3. Create unique index to enforce one vote per Firebase user per poll
CREATE UNIQUE INDEX IF NOT EXISTS one_vote_per_user_per_poll
ON public.poll_votes (poll_id, user_id);

-- 4. Remove public INSERT policy (votes now go through Edge Function only)
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.poll_votes;

-- 5. Performance index on user_id for fetching user's votes
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id
ON public.poll_votes (user_id);

-- ============================================================================
-- VERIFICATION:
-- 1. Run: SELECT column_name FROM information_schema.columns WHERE table_name = 'poll_votes';
--    → Should include 'user_id'
-- 2. Run: SELECT * FROM pg_indexes WHERE tablename = 'poll_votes';
--    → Should show 'one_vote_per_user_per_poll' index
-- 3. Run: SELECT * FROM pg_policies WHERE tablename = 'poll_votes';
--    → Should NOT have "Anyone can insert votes" policy
--    → Should still have "Anyone can view votes" (SELECT) policy
-- ============================================================================
