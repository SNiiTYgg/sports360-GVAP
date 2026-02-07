-- ============================================================================
-- CAMPUS360 SPORTS - COMPLETE SUPABASE DATABASE SETUP
-- ============================================================================
-- 
-- This file contains ALL queries needed to recreate the Campus360 Sports
-- database from scratch. Run these in the Supabase SQL Editor in order.
-- 
-- Created: January 2026
-- Version: 2.0 (Unified - includes all tables, storage, and migrations)
-- 
-- ============================================================================


-- ============================================================================
-- STORAGE BUCKET: MEDIA UPLOADS
-- ============================================================================
-- Create storage bucket for media uploads (images, videos)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Anyone can view media" ON storage.objects 
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete media" ON storage.objects 
FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 1: HOUSES
-- ============================================================================
-- This table stores the 5 house teams (Aakash, Agni, Jal, Prithvi, Vayu).
-- Each house has a unique slug used in URLs, a display name, brand color,
-- description for the profile page, profile image, Instagram link, and 
-- member count. This is the core reference table for the entire app.
-- ============================================================================

CREATE TABLE public.houses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT NOT NULL,
    profile_image_url TEXT,
    instagram_url TEXT,
    members_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) - Required for Supabase security
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Anyone (public) can view houses - needed for the public website pages
CREATE POLICY "Anyone can view houses" ON public.houses
    FOR SELECT USING (true);

-- Only logged-in admin users can update house information via admin panel
CREATE POLICY "Authenticated users can update houses" ON public.houses
    FOR UPDATE USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 2: POLLS
-- ============================================================================
-- This table stores poll questions created by admins. Each poll has a question
-- text, array of options (stored as JSON), active/paused toggle, show results
-- toggle, and optional end timestamp for permanent ending.
-- ============================================================================

CREATE TABLE public.polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    votes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    show_results BOOLEAN DEFAULT false,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Anyone can view polls - needed for the public poll voting page
CREATE POLICY "Anyone can view polls" ON public.polls
    FOR SELECT USING (true);

-- Only admins can create, update, or delete polls
CREATE POLICY "Authenticated users can manage polls" ON public.polls
    FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 3: POLL_VOTES
-- ============================================================================
-- This table records individual votes. Each vote links to a poll, stores
-- the device token (user_identifier from browser localStorage), and the
-- selected option. The UNIQUE constraint ensures ONE VOTE PER DEVICE PER POLL.
-- ============================================================================

CREATE TABLE public.poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    user_identifier TEXT NOT NULL,
    selected_option TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(poll_id, user_identifier)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes - needed to count and display poll results
CREATE POLICY "Anyone can view votes" ON public.poll_votes
    FOR SELECT USING (true);

-- Anyone can insert votes - allows anonymous voting from public page
CREATE POLICY "Anyone can insert votes" ON public.poll_votes
    FOR INSERT WITH CHECK (true);


-- ============================================================================
-- TABLE 4: SPORT_EVENTS
-- ============================================================================
-- This table stores each sports event/match with points awarded to each house.
-- Admins create events and enter points for each house.
-- The scoreboard totals are calculated by summing all events per house.
-- ============================================================================

CREATE TABLE public.sport_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game TEXT NOT NULL,
    category TEXT NOT NULL,
    vayu INTEGER DEFAULT 0,
    aakash INTEGER DEFAULT 0,
    prithvi INTEGER DEFAULT 0,
    agni INTEGER DEFAULT 0,
    jal INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sport_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view sport events - needed for public scoreboard display
CREATE POLICY "Anyone can view sport_events" ON public.sport_events
    FOR SELECT USING (true);

-- Only admins can add, edit, or delete sport events
CREATE POLICY "Authenticated users can manage sport_events" ON public.sport_events
    FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 5: SCOREBOARD
-- ============================================================================
-- This table stores the summary scoreboard with total points, wins, losses,
-- and draws for each house.
-- ============================================================================

CREATE TABLE public.scoreboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    house_name TEXT NOT NULL,
    house_slug TEXT NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scoreboard ENABLE ROW LEVEL SECURITY;

-- Anyone can view scoreboard - needed for public scoreboard page
CREATE POLICY "Anyone can view scoreboard" ON public.scoreboard
    FOR SELECT USING (true);

-- Only admins can update scores
CREATE POLICY "Authenticated users can update scoreboard" ON public.scoreboard
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert scoreboard" ON public.scoreboard
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 6: SCORE_EVENTS (Score History)
-- ============================================================================
-- Tracks individual score events for historical records
-- ============================================================================

CREATE TABLE public.score_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    house_slug TEXT NOT NULL,
    event_name TEXT NOT NULL,
    points INTEGER NOT NULL,
    event_date DATE DEFAULT CURRENT_DATE,
    day_label TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view score events" ON public.score_events 
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create score events" ON public.score_events 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete score events" ON public.score_events 
FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 7: MEDIA (House Galleries - Simple)
-- ============================================================================
-- Simple media table for house galleries
-- ============================================================================

CREATE TABLE public.media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    house_slug TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media" ON public.media 
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create media" ON public.media 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete media" ON public.media 
FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 8: HOUSE_MEDIA (Extended Media with Polls)
-- ============================================================================
-- Extended media content for houses with poll attachments and pinning
-- ============================================================================

CREATE TABLE public.house_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    house TEXT NOT NULL,
    media_type TEXT NOT NULL,
    platform TEXT,
    original_url TEXT,
    embed_url TEXT,
    image_url TEXT,
    thumbnail_url TEXT,
    description TEXT,
    poll_id UUID REFERENCES public.polls(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.house_media ENABLE ROW LEVEL SECURITY;

-- Anyone can view media - needed for public house profile pages
CREATE POLICY "Anyone can view house_media" ON public.house_media
    FOR SELECT USING (true);

-- Only admins can upload, edit, or delete media
CREATE POLICY "Authenticated users can manage house_media" ON public.house_media
    FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 9: APP_SETTINGS
-- ============================================================================
-- Key-value store for application-wide settings.
-- ============================================================================

CREATE TABLE public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public to read app_settings
GRANT SELECT ON public.app_settings TO anon, authenticated;

-- Anyone can view settings
CREATE POLICY "Anyone can view app_settings" ON public.app_settings
    FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Authenticated users can manage app_settings" ON public.app_settings
    FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 10: ADMIN_ROLES
-- ============================================================================
-- Stores role assignments for admin users.
-- ============================================================================

CREATE TABLE public.admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'house_social', 'sports_coordinator', 'sports_admin', 'event_admin')),
    house_name TEXT CHECK (house_name IN ('aakash', 'agni', 'jal', 'prithvi', 'vayu') OR house_name IS NULL),
    display_name TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users can read their own role" ON public.admin_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Super admins can read ALL admin roles
CREATE POLICY "Super admins can read all roles" ON public.admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
        )
    );

-- Super admins can insert new admin roles
CREATE POLICY "Super admins can insert roles" ON public.admin_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
        )
    );

-- Super admins can update admin roles
CREATE POLICY "Super admins can update roles" ON public.admin_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
        )
    );


-- ============================================================================
-- TABLE 11: AUDIT_LOGS
-- ============================================================================
-- Immutable log table that tracks all admin actions for accountability.
-- ============================================================================

CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_user_id UUID,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    house_name TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only logged-in admins can view audit logs
CREATE POLICY "Authenticated users can view audit_logs" ON public.audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Anyone can insert audit logs
CREATE POLICY "Anyone can insert audit_logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Constraint: Only allow valid entity_type values
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_entity_type_check 
CHECK (entity_type IN (
    'toggle', 
    'app_settings', 
    'sport_event', 
    'arena_match', 
    'common_match', 
    'poll', 
    'house_media', 
    'sports_settings', 
    'house',
    'auth',
    'score_event',
    'admin_role'
));


-- ============================================================================
-- TABLE 12: SPORTS_SETTINGS (Winner Celebration System)
-- ============================================================================
-- Single-row table for controlling winner reveal celebrations.
-- ============================================================================

CREATE TABLE public.sports_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sports_reveal_on BOOLEAN DEFAULT false,
    sports_reveal_started_at TIMESTAMPTZ,
    overall_reveal_on BOOLEAN DEFAULT false,
    overall_reveal_started_at TIMESTAMPTZ,
    celebration_window_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sports_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (needed for public scoreboard celebrations)
CREATE POLICY "Anyone can view sports_settings" ON public.sports_settings
    FOR SELECT USING (true);

-- Only authenticated admins can update settings
CREATE POLICY "Admin can update sports_settings" ON public.sports_settings
    FOR UPDATE USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 13: ARENA_MATCHES (Live/Upcoming/Completed Matches)
-- ============================================================================
-- Stores match events for the public Arena feature.
-- ============================================================================

CREATE TABLE public.arena_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sport TEXT NOT NULL,
    match_title TEXT NOT NULL,
    house_a_key TEXT NOT NULL,
    house_b_key TEXT NOT NULL,
    organizer_house_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED')),
    result_type TEXT CHECK (result_type IN ('WIN', 'DRAW', 'NO_RESULT')),
    winner_house_key TEXT,
    sequence_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view arena_matches" ON public.arena_matches
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert arena_matches" ON public.arena_matches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update arena_matches" ON public.arena_matches
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete arena_matches" ON public.arena_matches
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================================
-- TABLE 14: COMMON_MATCHES (All 5 Houses Compete Together)
-- ============================================================================
-- Stores events where ALL houses participate (like Relay, March Past).
-- ============================================================================

CREATE TABLE public.common_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sport TEXT NOT NULL,
    match_title TEXT NOT NULL,
    organizer_house_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED')),
    result_type TEXT CHECK (result_type IN ('POSITIONS', 'DRAW', 'NO_RESULT')),
    winner_house_key TEXT,
    runner_up_house_key TEXT,
    sequence_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.common_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view common_matches" ON public.common_matches
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert common_matches" ON public.common_matches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update common_matches" ON public.common_matches
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete common_matches" ON public.common_matches
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-log app_settings changes
CREATE OR REPLACE FUNCTION public.log_app_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.value IS DISTINCT FROM NEW.value) THEN
        INSERT INTO public.audit_logs (
            actor_user_id,
            actor_email,
            action,
            entity_type,
            entity_id,
            old_data,
            new_data
        ) VALUES (
            auth.uid(),
            COALESCE(auth.jwt() ->> 'email', 'system'),
            'update',
            'app_settings',
            NEW.key,
            jsonb_build_object('key', OLD.key, 'value', OLD.value),
            jsonb_build_object('key', NEW.key, 'value', NEW.value)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_app_settings ON public.app_settings;
CREATE TRIGGER tr_log_app_settings
    AFTER UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_app_settings_changes();


-- Validate poll status before voting
CREATE OR REPLACE FUNCTION check_poll_status()
RETURNS TRIGGER AS $$
DECLARE
    poll_record RECORD;
BEGIN
    SELECT * INTO poll_record FROM public.polls WHERE id = NEW.poll_id;
    
    IF poll_record IS NULL THEN
        RAISE EXCEPTION 'Poll does not exist';
    END IF;
    
    IF NOT poll_record.is_active THEN
        RAISE EXCEPTION 'Poll is paused';
    END IF;
    
    IF poll_record.ends_at IS NOT NULL AND poll_record.ends_at <= NOW() THEN
        RAISE EXCEPTION 'Poll has ended permanently';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_poll_before_vote ON public.poll_votes;
CREATE TRIGGER check_poll_before_vote
    BEFORE INSERT ON public.poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION check_poll_status();


-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- App Settings
INSERT INTO public.app_settings (key, value) VALUES ('event_year', '2025-26')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES ('event_name', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES ('arena_visible', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES ('event_name_visible', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES ('event_year_visible', 'true')
ON CONFLICT (key) DO NOTHING;

-- Houses
INSERT INTO public.houses (slug, name, color, description) VALUES
('aakash', 'Aakash', '#3B82F6', 'House of Sky - Reaching for the heavens'),
('agni', 'Agni', '#EF4444', 'House of Fire - Burning with passion'),
('jal', 'Jal', '#06B6D4', 'House of Water - Flowing with grace'),
('prithvi', 'Prithvi', '#22C55E', 'House of Earth - Grounded and strong'),
('vayu', 'Vayu', '#A855F7', 'House of Wind - Swift and free')
ON CONFLICT (slug) DO NOTHING;

-- Scoreboard
INSERT INTO public.scoreboard (house_name, house_slug) VALUES
('Aakash', 'aakash'),
('Agni', 'agni'),
('Jal', 'jal'),
('Prithvi', 'prithvi'),
('Vayu', 'vayu')
ON CONFLICT (house_slug) DO NOTHING;

-- Sports Settings (single row)
INSERT INTO public.sports_settings (
    sports_reveal_on,
    overall_reveal_on,
    celebration_window_hours
) VALUES (false, false, 24);


-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- After running this script, your Supabase database will have:
-- 
-- ✅ 14 Tables: houses, polls, poll_votes, sport_events, scoreboard, 
--               score_events, media, house_media, app_settings, audit_logs, 
--               sports_settings, arena_matches, common_matches, admin_roles
-- 
-- ✅ Storage Bucket: media (for uploads)
-- 
-- ✅ RLS Policies: Proper security on all tables
-- 
-- ✅ Triggers: Auto-logging for settings, vote validation
-- 
-- ✅ Initial Data: 5 houses, scoreboard entries, app settings
-- 
-- Next Steps:
-- 1. Create an admin user in Supabase Auth Dashboard
-- 2. Add that user to admin_roles table with role = 'super_admin'
-- 3. Test the app locally with npm run dev
-- 
-- ============================================================================
