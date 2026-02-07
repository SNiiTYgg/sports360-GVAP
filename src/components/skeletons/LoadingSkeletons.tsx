/**
 * Skeleton Loading Components - campus360
 * 
 * Provides skeleton loaders for different sections of the app.
 * Shows while data is loading to improve perceived performance.
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Poll Card Skeleton - Shows while polls are loading
 */
export const PollCardSkeleton: React.FC = () => (
    <div className="rounded-xl border bg-card p-5 space-y-4">
        {/* Question */}
        <Skeleton className="h-6 w-3/4" />

        {/* Options */}
        <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
        </div>
    </div>
);

/**
 * Polls Page Skeleton - Grid of poll skeletons
 */
export const PollsPageSkeleton: React.FC = () => (
    <div className="animate-fade-in px-4 py-6">
        {/* Header */}
        <div className="mb-6">
            <Skeleton className="h-7 w-24 mb-2" />
            <Skeleton className="h-4 w-64" />
        </div>

        {/* Poll Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PollCardSkeleton />
            <PollCardSkeleton />
            <PollCardSkeleton />
            <PollCardSkeleton />
        </div>
    </div>
);

/**
 * Scoreboard Row Skeleton
 */
const ScoreRowSkeleton: React.FC<{ isLeader?: boolean }> = ({ isLeader = false }) => (
    <div className={cn(
        "flex items-center gap-4 px-4 py-4",
        isLeader ? "bg-gradient-to-r from-[#1a2744] to-[#2a3a5c] rounded-2xl mb-2 p-5" : "bg-card border-b"
    )}>
        {/* Rank */}
        <Skeleton className={cn("rounded", isLeader ? "h-12 w-12 bg-gray-600" : "h-6 w-8")} />

        {/* House name + dot */}
        <div className="flex-1 flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className={cn(isLeader ? "h-8 w-32 bg-gray-600" : "h-5 w-28")} />
        </div>

        {/* Points */}
        <Skeleton className={cn(isLeader ? "h-8 w-16 bg-gray-600" : "h-5 w-12")} />
    </div>
);

/**
 * Scoreboard Page Skeleton
 */
export const ScoreboardSkeleton: React.FC = () => (
    <div className="py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
            <Skeleton className="h-10 w-48 mx-auto mb-2" />
            <Skeleton className="h-6 w-32 mx-auto" />
        </div>

        {/* Table Header */}
        <div className="hidden sm:flex items-center gap-8 px-6 py-3 mb-4 border-b">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-16 flex-1" />
            <Skeleton className="h-4 w-10" />
        </div>

        {/* Leader Card */}
        <ScoreRowSkeleton isLeader />

        {/* Other teams */}
        <div className="bg-card rounded-xl overflow-hidden border">
            <ScoreRowSkeleton />
            <ScoreRowSkeleton />
            <ScoreRowSkeleton />
            <ScoreRowSkeleton />
        </div>

        {/* Button */}
        <div className="mt-6">
            <Skeleton className="h-14 w-full rounded-xl" />
        </div>
    </div>
);

/**
 * Media Grid Skeleton - For house gallery loading
 */
export const MediaGridSkeleton: React.FC<{ count?: number }> = ({ count = 9 }) => (
    <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: count }).map((_, i) => (
            <Skeleton
                key={i}
                className="aspect-square rounded-sm"
                style={{ animationDelay: `${i * 50}ms` }}
            />
        ))}
    </div>
);

/**
 * House Profile Skeleton
 */
export const HouseProfileSkeleton: React.FC = () => (
    <div className="p-4 space-y-4">
        {/* Profile header */}
        <div className="flex items-center gap-4">
            {/* Avatar */}
            <Skeleton className="h-20 w-20 rounded-full" />

            {/* Stats */}
            <div className="flex-1 flex justify-around">
                <div className="text-center space-y-1">
                    <Skeleton className="h-5 w-8 mx-auto" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <div className="text-center space-y-1">
                    <Skeleton className="h-5 w-8 mx-auto" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <div className="text-center space-y-1">
                    <Skeleton className="h-5 w-8 mx-auto" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </div>
        </div>

        {/* House name & description */}
        <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
);

/**
 * House Page Skeleton - Complete house page loading state
 */
export const HousePageSkeleton: React.FC = () => (
    <div className="animate-fade-in">
        <HouseProfileSkeleton />
        <MediaGridSkeleton count={9} />
    </div>
);
