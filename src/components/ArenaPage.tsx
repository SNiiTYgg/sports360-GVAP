/**
 * Arena Page Component
 * 
 * Public-facing event wall for sports matches.
 * Displays three sections: LIVE, UPCOMING, and COMPLETED matches.
 * Each section has horizontally scrollable match cards.
 * Includes both regular matches (1v1) and common matches (all 5 houses).
 * 
 * Features:
 * - Horizontal scrolling sections (Netflix-style)
 * - Expand arrow to open full-screen vertical view
 * - Back button to return to main Arena
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import MatchCard from './MatchCard';
import CommonMatchCard from './CommonMatchCard';
import { ArenaFilters } from './ArenaFilters';
import { ChevronRight, ArrowLeft, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ArenaMatch = Tables<'arena_matches'>;
type CommonMatch = Tables<'common_matches'>;
type MatchStatus = 'LIVE' | 'UPCOMING' | 'COMPLETED';

// Fetch arena matches by status
const fetchArenaMatchesByStatus = async (status: MatchStatus, completedOrder: 'desc' | 'asc' = 'desc'): Promise<ArenaMatch[]> => {
    // For COMPLETED, order by completed_at (time of completion)
    // For UPCOMING, order by sequence_number
    // For LIVE, order by created_at
    const orderColumn = status === 'COMPLETED' ? 'completed_at' :
        status === 'UPCOMING' ? 'sequence_number' : 'created_at';
    const ascending = status === 'COMPLETED' ? (completedOrder === 'asc') :
        status === 'UPCOMING' ? true : true;

    const { data, error } = await supabase
        .from('arena_matches')
        .select('*')
        .eq('status', status)
        .order(orderColumn, { ascending });

    if (error) throw error;
    return data || [];
};

// Fetch common matches by status
const fetchCommonMatchesByStatus = async (status: MatchStatus, completedOrder: 'desc' | 'asc' = 'desc'): Promise<CommonMatch[]> => {
    const orderColumn = status === 'COMPLETED' ? 'completed_at' :
        status === 'UPCOMING' ? 'sequence_number' : 'created_at';
    const ascending = status === 'COMPLETED' ? (completedOrder === 'asc') :
        status === 'UPCOMING' ? true : true;

    const { data, error } = await supabase
        .from('common_matches')
        .select('*')
        .eq('status', status)
        .order(orderColumn, { ascending });

    if (error) throw error;
    return data || [];
};

const ArenaPage: React.FC = () => {
    // Track which section is expanded (null = default view)
    const [expandedSection, setExpandedSection] = useState<MatchStatus | null>(null);

    // Track completed matches order (only for full-screen COMPLETED view)
    const [completedOrder, setCompletedOrder] = useState<'latest' | 'oldest'>('latest');

    // Fetch arena matches for each status
    const { data: liveArenaMatches = [], isLoading: loadingLiveArena } = useQuery({
        queryKey: ['arena-matches', 'LIVE'],
        queryFn: () => fetchArenaMatchesByStatus('LIVE'),
        staleTime: 30000,
        refetchInterval: 30000,
    });

    const { data: upcomingArenaMatches = [], isLoading: loadingUpcomingArena } = useQuery({
        queryKey: ['arena-matches', 'UPCOMING'],
        queryFn: () => fetchArenaMatchesByStatus('UPCOMING'),
        staleTime: 60000,
    });

    const { data: completedArenaMatches = [], isLoading: loadingCompletedArena } = useQuery({
        queryKey: ['arena-matches', 'COMPLETED', completedOrder],
        queryFn: () => fetchArenaMatchesByStatus('COMPLETED', completedOrder === 'latest' ? 'desc' : 'asc'),
        staleTime: 60000,
    });

    // Fetch common matches for each status
    const { data: liveCommonMatches = [], isLoading: loadingLiveCommon } = useQuery({
        queryKey: ['common-matches', 'LIVE'],
        queryFn: () => fetchCommonMatchesByStatus('LIVE'),
        staleTime: 30000,
        refetchInterval: 30000,
    });

    const { data: upcomingCommonMatches = [], isLoading: loadingUpcomingCommon } = useQuery({
        queryKey: ['common-matches', 'UPCOMING'],
        queryFn: () => fetchCommonMatchesByStatus('UPCOMING'),
        staleTime: 60000,
    });

    const { data: completedCommonMatches = [], isLoading: loadingCompletedCommon } = useQuery({
        queryKey: ['common-matches', 'COMPLETED', completedOrder],
        queryFn: () => fetchCommonMatchesByStatus('COMPLETED', completedOrder === 'latest' ? 'desc' : 'asc'),
        staleTime: 60000,
    });

    const isLoading = loadingLiveArena || loadingUpcomingArena || loadingCompletedArena ||
        loadingLiveCommon || loadingUpcomingCommon || loadingCompletedCommon;

    // Get matches for expanded section (memoized to avoid recalculation)
    const expandedData = React.useMemo(() => {
        switch (expandedSection) {
            case 'LIVE':
                return { arenaMatches: liveArenaMatches, commonMatches: liveCommonMatches, title: '🔴 LIVE', emptyMessage: 'No live matches right now' };
            case 'UPCOMING':
                return { arenaMatches: upcomingArenaMatches, commonMatches: upcomingCommonMatches, title: '⏳ UPCOMING', emptyMessage: 'No upcoming matches scheduled' };
            case 'COMPLETED':
                return { arenaMatches: completedArenaMatches, commonMatches: completedCommonMatches, title: '🏆 COMPLETED', emptyMessage: 'No completed matches yet' };
            default:
                return null;
        }
    }, [expandedSection, liveArenaMatches, liveCommonMatches, upcomingArenaMatches, upcomingCommonMatches, completedArenaMatches, completedCommonMatches]);

    // State for group filter (null = "All")
    const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);

    // Reset filter when section changes
    React.useEffect(() => {
        setSelectedGroup(null);
    }, [expandedSection]);

    // Extract unique groups (sports) from matches - MUST be called unconditionally
    const uniqueGroups = React.useMemo(() => {
        if (!expandedData) return [];
        const sports = new Set<string>();
        expandedData.arenaMatches.forEach(m => m.sport && sports.add(m.sport));
        expandedData.commonMatches.forEach(m => m.sport && sports.add(m.sport));
        return Array.from(sports).sort();
    }, [expandedData]);

    // Filter matches based on selected group - computed values, not hooks
    const filteredArenaMatches = React.useMemo(() => {
        if (!expandedData) return [];
        return selectedGroup
            ? expandedData.arenaMatches.filter(m => m.sport === selectedGroup)
            : expandedData.arenaMatches;
    }, [expandedData, selectedGroup]);

    const filteredCommonMatches = React.useMemo(() => {
        if (!expandedData) return [];
        return selectedGroup
            ? expandedData.commonMatches.filter(m => m.sport === selectedGroup)
            : expandedData.commonMatches;
    }, [expandedData, selectedGroup]);

    // Full-screen expanded view
    if (expandedSection !== null && expandedData) {
        const totalCount = expandedData.arenaMatches.length + expandedData.commonMatches.length;
        const filteredCount = filteredArenaMatches.length + filteredCommonMatches.length;

        return (
            <div className="min-h-screen py-6">
                {/* Sticky Header: Back Button + Filter Bar */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6">
                    <div className="px-4 space-y-3">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            onClick={() => setExpandedSection(null)}
                            className="gap-2 hover:bg-muted"
                            aria-label="Go back to Arena"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        {/* Group Filter Bar - Only show if groups exist */}
                        <ArenaFilters
                            value={selectedGroup}
                            onChange={setSelectedGroup}
                            sports={uniqueGroups}
                        />
                    </div>
                </div>

                {/* Section Title with Order Toggle (only for COMPLETED) */}
                <div className="flex items-center justify-between px-4 mb-6">
                    <h1 className="text-2xl font-bold">{expandedData.title}</h1>
                    {expandedSection === 'COMPLETED' && totalCount > 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCompletedOrder(prev => prev === 'latest' ? 'oldest' : 'latest')}
                            className="gap-2"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            {completedOrder === 'latest' ? 'Latest First' : 'Oldest First'}
                        </Button>
                    )}
                </div>

                {/* Vertical Card List */}
                {totalCount === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground italic">{expandedData.emptyMessage}</p>
                    </div>
                ) : filteredCount === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground italic">No events in this group</p>
                    </div>
                ) : (
                    <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4 place-items-center md:place-items-stretch">
                        {/* Common matches first */}
                        {
                            filteredCommonMatches.map((match) => (
                                <div key={`common-${match.id}`} className="w-full flex justify-center md:block">
                                    <CommonMatchCard match={match} className="w-full max-w-[400px] md:!max-w-none md:!w-full" smallFlags={true} />
                                </div>
                            ))
                        }
                        {/* Regular arena matches */}
                        {filteredArenaMatches.map((match) => (
                            <div key={`arena-${match.id}`} className="w-full flex justify-center md:block">
                                <MatchCard match={match} className="w-full max-w-[400px] md:!max-w-none md:!w-full" />
                            </div>
                        ))}
                    </div>
                )
                }
            </div >
        );
    }

    // Default horizontal scrolling view
    return (
        <div className="py-6 space-y-8">

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-12">
                    <div className="animate-pulse text-muted-foreground">Loading matches...</div>
                </div>
            )}

            {/* LIVE Section */}
            {!isLoading && (
                <MatchSection
                    title="🔴 LIVE"
                    sectionKey="LIVE"
                    arenaMatches={liveArenaMatches}
                    commonMatches={liveCommonMatches}
                    emptyMessage="No live matches right now"
                    onExpand={() => setExpandedSection('LIVE')}
                />
            )}

            {/* UPCOMING Section */}
            {!isLoading && (
                <MatchSection
                    title="⏳ UPCOMING"
                    sectionKey="UPCOMING"
                    arenaMatches={upcomingArenaMatches}
                    commonMatches={upcomingCommonMatches}
                    emptyMessage="No upcoming matches scheduled"
                    onExpand={() => setExpandedSection('UPCOMING')}
                />
            )}

            {/* COMPLETED Section */}
            {!isLoading && (
                <MatchSection
                    title="🏆 COMPLETED"
                    sectionKey="COMPLETED"
                    arenaMatches={completedArenaMatches}
                    commonMatches={completedCommonMatches}
                    emptyMessage="No completed matches yet"
                    onExpand={() => setExpandedSection('COMPLETED')}
                />
            )}
        </div>
    );
};

// Match Section Component
interface MatchSectionProps {
    title: string;
    sectionKey: MatchStatus;
    arenaMatches: ArenaMatch[];
    commonMatches: CommonMatch[];
    emptyMessage: string;
    onExpand: () => void;
}

const MatchSection: React.FC<MatchSectionProps> = ({ title, sectionKey, arenaMatches, commonMatches, emptyMessage, onExpand }) => {
    const totalCount = arenaMatches.length + commonMatches.length;

    return (
        <section className="space-y-4">
            {/* Section Header with Expand Button */}
            <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-semibold">{title}</h2>
                {totalCount > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onExpand}
                        aria-label={`Expand ${title} section`}
                        className="text-primary hover:bg-primary/10"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                )}
            </div>

            {/* Empty State */}
            {totalCount === 0 ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground italic">{emptyMessage}</p>
                </div>
            ) : (
                /* Horizontal Scrolling Container */
                <div className="overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="flex flex-nowrap gap-4 px-4 w-max">
                        {/* Common matches first (all 5 houses) */}
                        {commonMatches.map((match) => (
                            <CommonMatchCard key={`common-${match.id}`} match={match} />
                        ))}
                        {/* Regular arena matches */}
                        {arenaMatches.map((match) => (
                            <MatchCard key={`arena-${match.id}`} match={match} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ArenaPage;
