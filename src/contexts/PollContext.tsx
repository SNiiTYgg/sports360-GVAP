/**
 * PollContext - campus360
 * 
 * Global poll state management for synchronized vote tracking.
 * Ensures vote state is shared across all components (PollPage, MediaModal, etc.)
 * so that voting from one location immediately reflects in all other locations.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface PollContextType {
    polls: PublicPoll[];
    loading: boolean;
    error: string | null;
    vote: (pollId: string, option: string) => Promise<{ success: boolean; error?: string }>;
    hasVoted: (pollId: string) => boolean;
    getUserVote: (pollId: string) => string | null;
    refetch: () => Promise<void>;
}

const PollContext = createContext<PollContextType | null>(null);

/**
 * Poll Provider component - wrap app with this for global poll state
 */
export const PollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [polls, setPolls] = useState<PublicPoll[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get user identifier - prefer Firebase UID, fallback to device token
    const getUserIdentifier = useCallback((): string => {
        if (user?.uid) {
            return user.uid;
        }
        return getDeviceToken();
    }, [user?.uid]);

    // Fetch all polls with vote counts using Supabase count (no row limit!)
    const fetchPolls = useCallback(async () => {
        try {
            // Fetch all polls
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

            // Sort: active polls first, then ended/paused polls
            const sortedPolls = mappedPolls.sort((a, b) => {
                const aIsLive = a.isActive && !a.hasEnded;
                const bIsLive = b.isActive && !b.hasEnded;

                if (aIsLive && !bIsLive) return -1;
                if (!aIsLive && bIsLive) return 1;

                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setPolls(sortedPolls);

        } catch (err) {
            console.error('Error fetching polls:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch polls');
        }
    }, []);

    // Fetch user's existing votes
    const fetchUserVotes = useCallback(async () => {
        try {
            const userId = getUserIdentifier();
            const { data, error: fetchError } = await supabase
                .from('poll_votes')
                .select('poll_id, selected_option')
                .eq('user_identifier', userId);

            if (fetchError) throw fetchError;

            const votesMap: Record<string, string> = {};
            (data || []).forEach((v) => {
                votesMap[v.poll_id] = v.selected_option;
            });

            setUserVotes(votesMap);
        } catch (err) {
            console.error('Error fetching user votes:', err);
        }
    }, [getUserIdentifier]);

    // Vote on a poll
    const vote = useCallback(async (pollId: string, option: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const userId = getUserIdentifier();

            const { error: voteError } = await supabase
                .from('poll_votes')
                .insert({
                    poll_id: pollId,
                    user_identifier: userId,
                    selected_option: option,
                });

            if (voteError) {
                if (voteError.code === '23505') {
                    return { success: false, error: 'You have already voted on this poll' };
                }
                if (voteError.message?.includes('Poll is paused')) {
                    return { success: false, error: 'This poll is currently paused' };
                }
                if (voteError.message?.includes('Poll has ended permanently')) {
                    return { success: false, error: 'This poll has ended' };
                }
                if (voteError.message?.includes('Poll does not exist')) {
                    return { success: false, error: 'Poll not found' };
                }
                throw voteError;
            }

            // Update local state immediately (shared across all components!)
            setUserVotes((prev) => ({ ...prev, [pollId]: option }));

            // Update poll vote counts
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
        } catch (err) {
            console.error('Error voting:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to submit vote' };
        }
    }, [getUserIdentifier]);

    // Check if user has voted on a poll
    const hasVoted = useCallback((pollId: string): boolean => {
        return !!userVotes[pollId];
    }, [userVotes]);

    // Get user's vote for a poll
    const getUserVote = useCallback((pollId: string): string | null => {
        return userVotes[pollId] || null;
    }, [userVotes]);

    // Refetch data
    const refetch = useCallback(async () => {
        await Promise.all([fetchPolls(), fetchUserVotes()]);
    }, [fetchPolls, fetchUserVotes]);

    // Initial fetch
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchPolls(), fetchUserVotes()]);
            setLoading(false);
        };
        init();
    }, [fetchPolls, fetchUserVotes]);

    // Refetch user votes when auth state changes (user logs in/out)
    useEffect(() => {
        if (!loading) {
            fetchUserVotes();
        }
    }, [user?.uid, fetchUserVotes, loading]);

    return (
        <PollContext.Provider value={{
            polls,
            loading,
            error,
            vote,
            hasVoted,
            getUserVote,
            refetch,
        }}>
            {children}
        </PollContext.Provider>
    );
};

/**
 * Hook to access global poll context
 */
export const usePollContext = (): PollContextType => {
    const context = useContext(PollContext);
    if (!context) {
        throw new Error('usePollContext must be used within a PollProvider');
    }
    return context;
};

export default PollContext;
