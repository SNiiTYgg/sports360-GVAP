/**
 * PollPage Component - campus360
 * 
 * Displays all active polls from Supabase in a responsive grid layout:
 * - 2 columns on desktop
 * - 1 column on mobile
 * - All cards have equal height on desktop
 * - Uses shared PollContext for synchronized vote state across all pages
 */

import React, { useState } from 'react';
import { usePollContext } from '@/contexts/PollContext';
import { useAuth } from '@/contexts/AuthContext';
import PollCard from './PollCard';
import LoginModal from './LoginModal';
import { PollsPageSkeleton } from './skeletons/LoadingSkeletons';

/**
 * Poll listing page with responsive grid and auth integration
 */
const PollPage: React.FC = () => {
  const { user } = useAuth();
  const { polls, loading, vote, hasVoted, getUserVote } = usePollContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ pollId: string; option: string } | null>(null);

  // Handle vote with auth check
  const handleVote = async (pollId: string, option: string) => {
    if (!user) {
      // Not logged in - show login modal and save pending vote
      setPendingVote({ pollId, option });
      setShowLoginModal(true);
      return { success: false, error: 'Login required' };
    }

    // User is logged in - proceed with vote
    return vote(pollId, option);
  };

  // Handle successful login - submit pending vote
  const handleLoginSuccess = async () => {
    setShowLoginModal(false);

    if (pendingVote) {
      // Small delay to allow auth state to propagate
      setTimeout(async () => {
        await vote(pendingVote.pollId, pendingVote.option);
        setPendingVote(null);
      }, 500);
    }
  };

  // Show skeleton while loading
  if (loading) {
    return <PollsPageSkeleton />;
  }

  return (
    <div className="animate-fade-in px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Polls
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vote on campus sports events and share your opinion
        </p>
      </div>

      {/* Poll Grid - 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {polls.map((poll, index) => (
          <div
            key={poll.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <PollCard
              poll={poll}
              onVote={(option) => handleVote(poll.id, option)}
              hasVoted={hasVoted(poll.id)}
              userVote={getUserVote(poll.id)}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {polls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No active polls
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back later for new polls
          </p>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingVote(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default PollPage;
