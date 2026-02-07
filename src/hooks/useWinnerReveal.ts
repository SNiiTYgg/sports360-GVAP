/**
 * useWinnerReveal Hook
 * 
 * Manages the winner reveal state including:
 * - Fetching sports_settings from Supabase
 * - Determining if celebration should play (time window + localStorage)
 * - Identifying the winner house (highest points)
 * - Priority logic (overall > sports)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSportsEvents } from '@/components/admin/SportsManager';

export interface SportsSettings {
    id: string;
    sports_reveal_on: boolean;
    sports_reveal_started_at: string | null;
    overall_reveal_on: boolean;
    overall_reveal_started_at: string | null;
    celebration_window_hours: number;
}

export interface WinnerRevealState {
    // Settings from DB
    settings: SportsSettings | null;
    loading: boolean;
    error: string | null;

    // Calculated state
    winnerHouse: string | null;
    winnerPoints: number;

    // Reveal type (overall takes priority)
    activeRevealType: 'overall' | 'sports' | null;

    // Should we show celebration overlay?
    shouldPlayCelebration: boolean;

    // Is the reveal toggle ON (for showing badge)?
    isRevealActive: boolean;

    // Mark celebration as seen
    markCelebrationSeen: () => void;

    // Refetch settings
    refetch: () => Promise<void>;
}

/**
 * Get localStorage key for tracking if celebration was seen
 */
const getSeenKey = (revealType: 'sports' | 'overall', startedAt: string) => {
    return `winner_seen_${revealType}_${startedAt}`;
};

/**
 * Check if current time is within celebration window
 */
const isWithinWindow = (startedAt: string | null, windowHours: number): boolean => {
    if (!startedAt) return false;
    const startTime = new Date(startedAt).getTime();
    const windowMs = windowHours * 60 * 60 * 1000;
    const now = Date.now();
    return now < startTime + windowMs;
};

/**
 * Calculate winner house from sport events
 */
const calculateWinner = async (): Promise<{ house: string; points: number } | null> => {
    const events = await getSportsEvents();
    if (events.length === 0) return null;

    const totals = {
        vayu: events.reduce((sum, e) => sum + e.vayu, 0),
        aakash: events.reduce((sum, e) => sum + e.aakash, 0),
        prithvi: events.reduce((sum, e) => sum + e.prithvi, 0),
        agni: events.reduce((sum, e) => sum + e.agni, 0),
        jal: events.reduce((sum, e) => sum + e.jal, 0),
    };

    // Find house with max points
    let maxHouse = 'vayu';
    let maxPoints = totals.vayu;

    for (const [house, points] of Object.entries(totals)) {
        if (points > maxPoints) {
            maxHouse = house;
            maxPoints = points;
        }
    }

    return { house: maxHouse.toUpperCase(), points: maxPoints };
};

export const useWinnerReveal = (): WinnerRevealState => {
    const [settings, setSettings] = useState<SportsSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [winnerHouse, setWinnerHouse] = useState<string | null>(null);
    const [winnerPoints, setWinnerPoints] = useState(0);
    const [shouldPlayCelebration, setShouldPlayCelebration] = useState(false);

    // Fetch settings from Supabase
    const fetchSettings = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('sports_settings')
                .select('id, sports_reveal_on, sports_reveal_started_at, overall_reveal_on, overall_reveal_started_at, celebration_window_hours')
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                setSettings(data as SportsSettings);
            } else {
                console.warn('[WinnerReveal] No sports_settings found in DB');
            }
        } catch (err: any) {
            console.error('Error fetching sports settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate winner
    const fetchWinner = useCallback(async () => {
        const winner = await calculateWinner();
        if (winner) {
            setWinnerHouse(winner.house);
            setWinnerPoints(winner.points);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
        fetchWinner();
    }, [fetchSettings, fetchWinner]);

    // Determine active reveal type (overall takes priority)
    const getActiveRevealType = (): 'overall' | 'sports' | null => {
        if (!settings) {
            return null;
        }
        if (settings.overall_reveal_on) {
            return 'overall';
        }
        if (settings.sports_reveal_on) {
            return 'sports';
        }
        return null;
    };

    const activeRevealType = getActiveRevealType();

    // Check if reveal is active (for showing badge)
    const isRevealActive = activeRevealType !== null;

    // Calculate if celebration should play
    useEffect(() => {
        if (!settings || !activeRevealType) {
            setShouldPlayCelebration(false);
            return;
        }

        const startedAt = activeRevealType === 'overall'
            ? settings.overall_reveal_started_at
            : settings.sports_reveal_started_at;

        if (!startedAt) {
            setShouldPlayCelebration(false);
            return;
        }

        // Check time window
        const withinWindow = isWithinWindow(startedAt, settings.celebration_window_hours);
        if (!withinWindow) {
            setShouldPlayCelebration(false);
            return;
        }

        // Check localStorage
        const seenKey = getSeenKey(activeRevealType, startedAt);
        const alreadySeen = localStorage.getItem(seenKey) === 'true';

        setShouldPlayCelebration(!alreadySeen);
    }, [settings, activeRevealType]);

    // Mark celebration as seen
    const markCelebrationSeen = useCallback(() => {
        if (!settings || !activeRevealType) return;

        const startedAt = activeRevealType === 'overall'
            ? settings.overall_reveal_started_at
            : settings.sports_reveal_started_at;

        if (!startedAt) return;

        const seenKey = getSeenKey(activeRevealType, startedAt);
        localStorage.setItem(seenKey, 'true');
        setShouldPlayCelebration(false);
    }, [settings, activeRevealType]);

    return {
        settings,
        loading,
        error,
        winnerHouse,
        winnerPoints,
        activeRevealType,
        shouldPlayCelebration,
        isRevealActive,
        markCelebrationSeen,
        refetch: fetchSettings,
    };
};

export default useWinnerReveal;
