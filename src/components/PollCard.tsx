/**
 * PollCard Component - campus360
 * 
 * Instagram-style poll card with:
 * - Question at top
 * - Options below with vote functionality
 * - Results display after voting (respects showResults flag)
 * - One vote per user via Supabase
 * - Support for ended polls
 */

import React, { useState, useEffect } from 'react';
import { Check, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicPoll } from '@/contexts/PollContext';
import { useToast } from '@/hooks/use-toast';

interface PollCardProps {
  poll: PublicPoll;
  onVote: (option: string) => Promise<{ success: boolean; error?: string }>;
  hasVoted: boolean;
  userVote: string | null;
}

/**
 * Individual poll card with voting functionality
 */
const PollCard: React.FC<PollCardProps> = ({ poll, onVote, hasVoted, userVote }) => {
  const [voted, setVoted] = useState(hasVoted);
  const [selectedOption, setSelectedOption] = useState<string | null>(userVote);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>(poll.votes);
  const [voting, setVoting] = useState(false);
  const { toast } = useToast();

  // Update state when props change
  useEffect(() => {
    setVoted(hasVoted);
    setSelectedOption(userVote);
    setLocalVotes(poll.votes);
    // Reset pending selection if user already voted
    if (hasVoted) {
      setPendingSelection(null);
    }
  }, [hasVoted, userVote, poll.votes]);

  // Check if poll has ended
  const isPollEnded = poll.hasEnded || (poll.endsAt && new Date(poll.endsAt) <= new Date());

  // Check if poll is paused/stopped (not active but not ended)
  const isPollPaused = !poll.isActive && !isPollEnded;

  // Handle option selection (not submission)
  const handleSelectOption = (option: string) => {
    if (voted || voting || isPollEnded || isPollPaused) return;
    // Toggle selection: if already selected, deselect; otherwise select
    setPendingSelection((prev) => (prev === option ? null : option));
  };

  // Handle vote submission
  const handleSubmitVote = async () => {
    if (!pendingSelection || voted || voting || isPollEnded || isPollPaused) return;

    setVoting(true);
    const result = await onVote(pendingSelection);

    if (result.success) {
      setVoted(true);
      setSelectedOption(pendingSelection);
      setLocalVotes((prev) => ({
        ...prev,
        [pendingSelection]: (prev[pendingSelection] || 0) + 1,
      }));
      setPendingSelection(null);
    } else if (result.error) {
      toast({
        title: 'Unable to vote',
        description: result.error,
        variant: 'destructive',
      });
    }
    setVoting(false);
  };

  // Calculate total votes for percentage display
  const totalVotes = Object.values(localVotes).reduce((sum, v) => sum + v, 0);

  // Get percentage for an option
  const getPercentage = (option: string): number => {
    if (totalVotes === 0) return 0;
    return Math.round((localVotes[option] / totalVotes) * 100);
  };

  // Should we show results? Only if user has voted AND showResults is enabled (or always show for voter's own choice)
  const canSeeResults = voted && (poll.showResults || selectedOption !== null);

  // Show Instagram-style results when poll ended (always show results for ended polls)
  const showFinalResults = isPollEnded;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Poll Header / Question */}
      <div className="flex-shrink-0 border-b border-border bg-secondary/30 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {poll.question}
          </h3>
          {isPollEnded && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Ended
            </span>
          )}
          {isPollPaused && (
            <div className="group relative">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground cursor-help">
                Stopped
              </span>
              {/* Tooltip message - appears on hover */}
              <div className="absolute right-0 top-full mt-2 z-10 w-64 rounded-lg bg-popover border border-border p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <p className="text-sm text-foreground font-medium">
                  Polling is stopped for this poll.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vote on another one. Results will be revealed or poll will be activated again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Poll Options / Results */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {showFinalResults ? (
          /* Instagram-style Final Results Display */
          poll.options.map((option) => {
            const percentage = getPercentage(option);
            const voteCount = localVotes[option] || 0;
            const isSelected = selectedOption === option;

            return (
              <div key={option} className="relative h-12 md:h-16">
                {/* Background track */}
                <div className="absolute inset-0 overflow-hidden rounded-lg bg-muted/30" />
                {/* Filled progress bar - Blue/indigo color */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out",
                    isSelected ? "bg-poll-voted" : "bg-poll-unvoted"
                  )}
                  style={{
                    width: `${Math.max(percentage, 8)}%`
                  }}
                />
                {/* Content overlay - always on top */}
                <div className="absolute inset-0 flex items-center justify-between px-4 md:px-6">
                  <span className={cn(
                    "text-sm md:text-base font-medium drop-shadow-sm",
                    isSelected ? "text-white" : "text-foreground"
                  )}>
                    {option}
                    <span className={cn(
                      "ml-1",
                      isSelected
                        ? "text-white/80"
                        : "text-gray-500 dark:text-gray-300"
                    )}>({voteCount} vote{voteCount !== 1 ? 's' : ''})</span>
                    {isSelected && (
                      <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className={cn(
                    "text-sm md:text-base font-bold",
                    isSelected ? "text-white" : "text-foreground"
                  )}>
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          /* Normal Voting UI */
          <>
            {poll.options.map((option) => {
              const percentage = getPercentage(option);
              const isSelected = selectedOption === option;
              const isPending = pendingSelection === option;

              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  disabled={voted || voting || isPollEnded}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border text-left transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    voted || isPollEnded || isPollPaused
                      ? 'cursor-default border-border opacity-60'
                      : isPending
                        ? 'cursor-pointer border-primary ring-2 ring-primary/30 bg-primary/5'
                        : 'cursor-pointer border-border hover:border-primary/50 hover:bg-secondary/50'
                  )}
                >
                  {/* Progress bar background (shown after voting if results visible) */}
                  {canSeeResults && poll.showResults && (
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-r-lg transition-all duration-500",
                        isSelected ? "bg-poll-voted" : "bg-poll-unvoted"
                      )}
                      style={{
                        width: `${percentage}%`
                      }}
                    />
                  )}

                  {/* Option content */}
                  <div className="relative flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
                    <span
                      className={cn(
                        'text-sm md:text-base font-medium',
                        canSeeResults && poll.showResults && isSelected ? 'text-white' : isPending ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {option}
                    </span>

                    {/* Vote indicator / percentage */}
                    <div className="flex items-center gap-2">
                      {canSeeResults && poll.showResults && (
                        <span
                          className={cn(
                            'text-sm md:text-base font-semibold',
                            isSelected ? 'text-white' : 'text-muted-foreground'
                          )}
                        >
                          {percentage}%
                        </span>
                      )}
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {isPending && !voted && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-transparent">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Submit Vote Button */}
            {!voted && !isPollEnded && !isPollPaused && (
              <button
                onClick={handleSubmitVote}
                disabled={!pendingSelection || voting}
                className={cn(
                  'mt-2 flex items-center justify-center gap-2 rounded-lg px-4 py-3 md:px-6 md:py-4 font-medium md:text-lg transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  pendingSelection
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {voting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Vote
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Poll Footer */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {isPollEnded ? (
            <>
              Poll ended · {totalVotes.toLocaleString()} vote{totalVotes !== 1 ? 's' : ''}
              {voted && ' · You voted'}
            </>
          ) : poll.showResults ? (
            <>
              {totalVotes.toLocaleString()} vote{totalVotes !== 1 ? 's' : ''}
              {voted && ' · You voted'}
            </>
          ) : voted ? (
            'You voted · Results will be revealed later'
          ) : (
            'Vote to participate'
          )}
        </p>
      </div>
    </div>
  );
};

export default PollCard;
