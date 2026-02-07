/**
 * Arena Filters Component
 * 
 * Shared filter component for filtering matches by sport.
 * Used by both the public Arena page and Admin Arena Manager.
 * 
 * Features:
 * - "All" button + dynamic sport buttons
 * - Active/inactive styling
 * - Optional badge showing match count per filter
 * - Horizontal scrolling for mobile
 */

import React from 'react';

interface ArenaFiltersProps {
    /** Current filter value (null = "All") */
    value: string | null;
    /** Callback when filter changes */
    onChange: (value: string | null) => void;
    /** List of sports to show as filter options */
    sports: string[];
    /** Optional: Match count per sport (displayed as badge) */
    matchCounts?: Record<string, number>;
    /** Optional: Total count for "All" filter */
    totalCount?: number;
    /** Optional: Show counts in badges */
    showCounts?: boolean;
}

export const ArenaFilters: React.FC<ArenaFiltersProps> = ({
    value,
    onChange,
    sports,
    matchCounts,
    totalCount,
    showCounts = false,
}) => {
    if (sports.length === 0) return null;

    return (
        <div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-desktop-only"
            style={{ WebkitOverflowScrolling: 'touch' }}
            role="tablist"
            aria-label="Filter by sport"
        >
            {/* "All" chip */}
            <button
                role="tab"
                aria-selected={value === null}
                onClick={() => onChange(null)}
                className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] border flex items-center gap-2 ${value === null
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                    }`}
            >
                All
                {showCounts && totalCount !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${value === null
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                        {totalCount}
                    </span>
                )}
            </button>

            {/* Sport chips */}
            {sports.map((sport) => {
                const count = matchCounts?.[sport];
                return (
                    <button
                        key={sport}
                        role="tab"
                        aria-selected={value === sport}
                        onClick={() => onChange(sport)}
                        className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] whitespace-nowrap border flex items-center gap-2 ${value === sport
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        {sport}
                        {showCounts && count !== undefined && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${value === sport
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-muted-foreground/20 text-muted-foreground'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ArenaFilters;
