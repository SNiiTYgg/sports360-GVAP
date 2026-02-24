/**
 * usePolls Hook - campus360
 * 
 * Fetches active polls from Supabase for public display.
 * Handles voting with Firebase Auth UID for one-vote-per-user enforcement.
 * Vote counts are derived from poll_votes table.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFirebaseToken } from '@/lib/secureAction';

// Generate device token fallback (for backward compatibility only)
const getDeviceToken = (): string => {
    const STORAGE_KEY = 'poll_voter_id';
    let voterId = localStorage.getItem(STORAGE_KEY);
    if (!voterId) {
        voterId = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, voterId);
    }
    return voterId;
};

export interface PublicPoll {
    id: string;
    question: string;
    options: string[];
    votes: Record<string, number>;
    isActive: boolean;
    showResults: boolean;
    endsAt: string | null;
    createdAt: string;
    hasEnded: boolean;
}

export interface UserVote {
    pollId: string;
    selectedOption: string;
}

// Current user's Firebase UID for the hook
let currentFirebaseUid: string | null = null;

export const usePolls = (firebaseUid?: string | null) => {
    const [polls, setPolls] = useState<PublicPoll[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Update Firebase UID when it changes
    useEffect(() => {
        currentFirebaseUid = firebaseUid || null;
    }, [firebaseUid]);

    // Get user identifier - Firebase UID only
    const getUserIdentifier = useCallback((): string | null => {
        if (firebaseUid) {
            return firebaseUid;
        }
        return null;
    }, [firebaseUid]);

    // Get legacy device token for backward compat
    const getLegacyDeviceToken = useCallback((): string | null => {
        return localStorage.getItem('poll_voter_id');
    }, []);

    // Fetch all polls (active + ended) with vote counts using Supabase count (no row limit!)
    const fetchPolls = useCallback(async () => {
        try {
            // Fetch all polls (not filtered by is_active - we want to show ended ones too)
            const { data: pollsData, error: pollsError } = await supabase
                .from('polls')
                .select('id, question, options, is_active, show_results, ends_at, created_at')
                .order('created_at', { ascending: false });

            if (pollsError) throw pollsError;

            const now = new Date();

            // Build polls with vote counts using count: 'exact' (no row limit!)
            const mappedPolls: PublicPoll[] = await Promise.all(
                (pollsData || []).map(async (p) => {
                    const options = Array.isArray(p.options) ? p.options.map(String) : [];
                    const votes: Record<string, number> = {};

                    // Get vote count for each option using count: 'exact', head: true
                    // This approach has NO row limit and doesn't fetch actual data
                    await Promise.all(
                        options.map(async (option) => {
                            const { count, error: countError } = await supabase
                                .from('poll_votes')
                                .select('*', { count: 'exact', head: true })
                                .eq('poll_id', p.id)
                                .eq('selected_option', option);

                            if (countError) {
                                console.error(`Error counting votes for ${option}:`, countError);
                                votes[option] = 0;
                            } else {
                                votes[option] = count || 0;
                            }
                        })
                    );

                    const hasEnded = p.ends_at ? new Date(p.ends_at) <= now : false;

                    return {
                        id: p.id,
                        question: p.question,
                        options,
                        votes,
                        isActive: p.is_active && !hasEnded,
                        showResults: p.show_results ?? false,
                        endsAt: p.ends_at,
                        createdAt: p.created_at,
                        hasEnded,
                    };
                })
            );

            // Sort: active polls first (isActive && !hasEnded), then ended/paused polls
            const sortedPolls = mappedPolls.sort((a, b) => {
                const aIsLive = a.isActive && !a.hasEnded;
                const bIsLive = b.isActive && !b.hasEnded;

                if (aIsLive && !bIsLive) return -1;
                if (!aIsLive && bIsLive) return 1;

                // Within same category, sort by created_at descending
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setPolls(sortedPolls);

        } catch (err: any) {
            console.error('Error fetching polls:', err);
            setError(err.message);
        }
    }, []);

    // Fetch user's existing votes (check both user_id and legacy user_identifier)
    const fetchUserVotes = useCallback(async () => {
        try {
            const uid = getUserIdentifier();
            const legacyToken = getLegacyDeviceToken();
            const votesMap: Record<string, string> = {};

            // Query by Firebase UID (new system)
            if (uid) {
                const { data, error: fetchError } = await supabase
                    .from('poll_votes')
                    .select('poll_id, selected_option')
                    .eq('user_id', uid);

                if (!fetchError && data) {
                    data.forEach((v) => {
                        votesMap[v.poll_id] = v.selected_option;
                    });
                }
            }

            // Also check legacy device token votes (backward compat)
            if (legacyToken) {
                const { data, error: fetchError } = await supabase
                    .from('poll_votes')
                    .select('poll_id, selected_option')
                    .eq('user_identifier', legacyToken);

                if (!fetchError && data) {
                    data.forEach((v) => {
                        if (!votesMap[v.poll_id]) {
                            votesMap[v.poll_id] = v.selected_option;
                        }
                    });
                }
            }

            setUserVotes(votesMap);
        } catch (err: any) {
            console.error('Error fetching user votes:', err);
        }
    }, [getUserIdentifier, getLegacyDeviceToken]);

    // Vote on a poll — routes through Edge Function with Firebase JWT
    const vote = useCallback(async (pollId: string, option: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Require Firebase login
            if (!firebaseUid) {
                return { success: false, error: 'Please sign in with Google to vote' };
            }

            const token = await getFirebaseToken();
            if (!token) {
                return { success: false, error: 'Failed to get auth token. Please sign in again.' };
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/vote`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poll_id: pollId,
                    selected_option: option,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || `Vote failed (${response.status})` };
            }

            // Update local state
            setUserVotes((prev) => ({ ...prev, [pollId]: option }));

            // Update local polls state with new vote count
            setPolls((prev) =>
                prev.map((p) =>
                    p.id === pollId
                        ? {
                            ...p,
                            votes: {
                                ...p.votes,
                                [option]: (p.votes[option] || 0) + 1,
                            },
                        }
                        : p
                )
            );

            return { success: true };
        } catch (err: any) {
            console.error('Error voting:', err);
            return { success: false, error: err.message || 'Failed to submit vote' };
        }
    }, [firebaseUid]);

    // Check if user has voted on a poll
    const hasVoted = useCallback((pollId: string): boolean => {
        return !!userVotes[pollId];
    }, [userVotes]);

    // Get user's vote for a poll
    const getUserVote = useCallback((pollId: string): string | null => {
        return userVotes[pollId] || null;
    }, [userVotes]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchPolls(), fetchUserVotes()]);
            setLoading(false);
        };
        init();
    }, [fetchPolls, fetchUserVotes]);

    return {
        polls,
        loading,
        error,
        vote,
        hasVoted,
        getUserVote,
        refetch: fetchPolls,
    };
};

export default usePolls;
