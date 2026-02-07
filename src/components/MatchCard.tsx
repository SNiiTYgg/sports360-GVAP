/**
 * Match Card Component
 * 
 * Displays a single match card for the Arena page.
 * Features house flags, status indicators, and animated borders for LIVE matches.
 * Supports "To Be Decided" teams with white flag placeholder.
 */

import React from 'react';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type ArenaMatch = Tables<'arena_matches'>;

interface MatchCardProps {
    match: ArenaMatch;
    className?: string;
}

// House display labels
const houseLabels: Record<string, string> = {
    aakash: 'Aakash',
    agni: 'Agni',
    jal: 'Jal',
    prithvi: 'Prithvi',
    vayu: 'Vayu',
    tbd: 'To Be Decided',
};

const MatchCard: React.FC<MatchCardProps> = ({ match, className }) => {
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';
    const isUpcoming = match.status === 'UPCOMING';

    // Check if this is a same-house (intra-house) match
    const isSameHouseMatch = match.house_a_key === match.house_b_key && !isTBD(match.house_a_key);

    // Check if a house is TBD
    function isTBD(houseKey: string) {
        return houseKey === 'tbd';
    }

    // Get display name with A/B suffix for same-house matches
    const getTeamDisplayName = (houseKey: string, isTeamA: boolean) => {
        const baseName = houseLabels[houseKey] || houseKey;
        if (isSameHouseMatch && !isTBD(houseKey)) {
            return `${baseName} ${isTeamA ? 'A' : 'B'}`;
        }
        return baseName;
    };

    // Get flag path for a house
    const getFlagPath = (houseKey: string) => `/flags/${houseKey}_flag.png`;

    // Check if a house is the winner
    const isWinner = (houseKey: string) => {
        return isCompleted && match.result_type === 'WIN' && match.winner_house_key === houseKey && !isTBD(houseKey);
    };

    // Get result text for draw/no result
    const getResultText = () => {
        if (!isCompleted || !match.result_type) return null;
        if (match.result_type === 'DRAW') return 'Draw';
        if (match.result_type === 'NO_RESULT') return 'No Result';
        return null;
    };

    // Render team display (flag + name)
    const renderTeam = (houseKey: string, isTeamA: boolean) => {
        if (isTBD(houseKey)) {
            return (
                <div className="flex flex-col items-center gap-2">
                    <div
                        className="arena-flag-container bg-muted/50 flex items-center justify-center"
                        aria-label="To Be Decided, opponent not finalized"
                    >
                        <span className="text-3xl" role="img" aria-label="White flag">🏳️</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">To Be Decided</span>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative">
                    {/* Winner label on top of flag */}
                    {isWinner(houseKey) && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                            <span className="text-xs font-bold uppercase tracking-wider gold-text">
                                Winner
                            </span>
                        </div>
                    )}
                    <div className={cn(
                        "arena-flag-container",
                        isWinner(houseKey) && "ring-2 ring-amber-400 ring-offset-2 ring-offset-card"
                    )}>
                        <img
                            src={getFlagPath(houseKey)}
                            alt={`${houseLabels[houseKey]} Flag`}
                            className="arena-flag"
                            loading="lazy"
                        />
                    </div>
                </div>
                <span className="text-sm font-medium">{getTeamDisplayName(houseKey, isTeamA)}</span>
            </div>
        );
    };

    return (
        <div
            className={cn(
                'relative flex-shrink-0 w-[260px] md:w-[300px] rounded-2xl bg-card border overflow-hidden transition-all duration-300',
                isLive && 'arena-card-live',
                !isLive && 'border-border hover:border-primary/30',
                className
            )}
        >
            {/* Status Badge - LIVE only with pulsing badge */}
            {isLive && (
                <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-medium animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-white"></span>
                        LIVE
                    </span>
                </div>
            )}

            {/* Card Content */}
            <div className="p-5 space-y-4">
                {/* Sport Name */}
                <div className="text-center pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {match.sport}
                    </span>
                </div>

                {/* Match Title */}
                <h3 className="text-lg font-bold text-center">{match.match_title}</h3>

                {/* Houses with Flags */}
                <div className="flex items-center justify-center gap-4">
                    {/* House A */}
                    {renderTeam(match.house_a_key, true)}

                    {/* VS Label */}
                    <div className="flex items-center justify-center">
                        <span className="text-xl font-bold text-muted-foreground">VS</span>
                    </div>

                    {/* House B */}
                    {renderTeam(match.house_b_key, false)}
                </div>

                {/* Organizer */}
                <div className="text-center">
                    <span className="text-xs text-muted-foreground">
                        Organized by: <span className="font-medium">{houseLabels[match.organizer_house_key]}</span>
                    </span>
                </div>

                {/* Draw/No Result text (for completed matches without a winner) */}
                {isCompleted && getResultText() && (
                    <div className="text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                            {getResultText()}
                        </span>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MatchCard;
