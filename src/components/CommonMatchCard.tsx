/**
 * Common Match Card Component
 * 
 * Displays a single common match card for the Arena page.
 * Shows all 5 houses competing together with winner/runner-up highlighting.
 */

import React from 'react';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type CommonMatch = Tables<'common_matches'>;

interface CommonMatchCardProps {
    match: CommonMatch;
    className?: string;
    smallFlags?: boolean;
}

// House and organizer display labels
const houseLabels: Record<string, string> = {
    aakash: 'Aakash',
    agni: 'Agni',
    jal: 'Jal',
    prithvi: 'Prithvi',
    vayu: 'Vayu',
    // Non-house organizers
    council: 'Council',
    gvap: 'GVAP',
};

// All houses in display order
const houses = ['aakash', 'agni', 'jal', 'prithvi', 'vayu'] as const;

const CommonMatchCard: React.FC<CommonMatchCardProps> = ({ match, className, smallFlags = false }) => {
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';

    // Get flag path for a house
    const getFlagPath = (houseKey: string) => `/flags/${houseKey}_flag.png`;

    // Check if a house is the winner (1st place)
    const isWinner = (houseKey: string) => {
        return isCompleted && match.result_type === 'POSITIONS' && match.winner_house_key === houseKey;
    };

    // Check if a house is the runner-up (2nd place)
    const isRunnerUp = (houseKey: string) => {
        return isCompleted && match.result_type === 'POSITIONS' && match.runner_up_house_key === houseKey;
    };

    // Get result text for draw/no result
    const getResultText = () => {
        if (!isCompleted || !match.result_type) return null;
        if (match.result_type === 'DRAW') return 'Draw';
        if (match.result_type === 'NO_RESULT') return 'No Result';
        return null;
    };

    return (
        <div
            className={cn(
                'relative flex-shrink-0 w-[320px] md:w-[380px] rounded-2xl bg-card border overflow-hidden transition-all duration-300',
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

            {/* All Houses Badge */}
            <div className="absolute top-2 right-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
                    All Houses
                </span>
            </div>

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

                {/* All 5 Houses with Flags */}
                <div className="flex items-start justify-center gap-2 flex-nowrap pt-2">
                    {houses.map((house) => (
                        <div key={house} className="flex flex-col items-center gap-1">
                            {/* Flag Container */}
                            <div className={cn(
                                "arena-flag-container",
                                smallFlags ? "!w-8 !h-8 md:!w-10 md:!h-10" : "!w-10 !h-10 md:!w-14 md:!h-14",
                                isWinner(house) && "ring-2 ring-amber-400 ring-offset-1 ring-offset-card",
                                isRunnerUp(house) && "ring-2 ring-slate-400 ring-offset-1 ring-offset-card"
                            )}>
                                <img
                                    src={getFlagPath(house)}
                                    alt={`${houseLabels[house]} Flag`}
                                    className="arena-flag"
                                    loading="lazy"
                                />
                            </div>

                            {/* House Name */}
                            <span className={cn(
                                "text-[10px] font-medium",
                                isWinner(house) && "text-amber-500 font-bold",
                                isRunnerUp(house) && "text-slate-400 font-semibold"
                            )}>
                                {houseLabels[house]}
                            </span>

                            {/* Rank Badge - BELOW team name (NEW POSITION) */}
                            {isWinner(house) && (
                                <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                    aria-label={`${houseLabels[house]}, First Place`}
                                >
                                    🥇 1st
                                </span>
                            )}
                            {isRunnerUp(house) && (
                                <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                    aria-label={`${houseLabels[house]}, Second Place`}
                                >
                                    🥈 2nd
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Organizer */}
                <div className="text-center">
                    <span className="text-xs text-muted-foreground">
                        Organized by: <span className="font-medium">{houseLabels[match.organizer_house_key]}</span>
                    </span>
                </div>

                {/* Draw/No Result text (for completed matches without positions) */}
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

export default CommonMatchCard;
