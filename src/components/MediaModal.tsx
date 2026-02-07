/**
 * MediaModal Component - campus360
 * 
 * Fullscreen modal for viewing media (images/embedded videos).
 * Supports YouTube and Instagram embeds with iframe display.
 * Supports embedded polls on videos with auth-gated voting.
 * Uses shared PollContext for synchronized vote state across all pages.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Youtube, Instagram, BarChart3 } from 'lucide-react';
import type { MediaGridItem } from './MediaGrid';
import { cn } from '@/lib/utils';
import { usePollContext } from '@/contexts/PollContext';
import { useAuth } from '@/contexts/AuthContext';
import PollCard from './PollCard';
import LoginModal from './LoginModal';

interface MediaModalProps {
  media: MediaGridItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

/**
 * Fullscreen media viewer modal
 * Supports keyboard navigation and embedded videos
 */
const MediaModal: React.FC<MediaModalProps> = ({
  media,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) => {
  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasNext && onNext) onNext();
          break;
      }
    },
    [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]
  );

  // Attach keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // State for mobile caption expansion
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  // State for mobile poll expansion
  const [isPollExpanded, setIsPollExpanded] = useState(false);

  // State for login modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ pollId: string; option: string } | null>(null);

  // Fetch auth state
  const { user } = useAuth();

  // Fetch polls data from shared context (synchronized across all pages)
  const { polls, vote, hasVoted, getUserVote } = usePollContext();

  // Reset caption and poll expansion when media changes
  useEffect(() => {
    setIsCaptionExpanded(false);
    setIsPollExpanded(false);
  }, [media]);

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

  if (!isOpen || !media) return null;

  // Check if it's an embedded video
  const isEmbed = media.type === 'video' && !!media.embed_url;

  // Get the display caption
  const caption = media.caption || media.description;

  // Find the attached poll if any
  const attachedPoll = media.poll_id ? polls.find(p => p.id === media.poll_id) : null;

  /**
   * Enhance YouTube embed URL with mobile-friendly parameters
   * Uses youtube-nocookie.com for privacy-enhanced mode
   */
  const getEnhancedEmbedUrl = (embedUrl: string | undefined): string => {
    if (!embedUrl) return '';

    // Only enhance YouTube URLs
    if (embedUrl.includes('youtube.com/embed/')) {
      // Convert to youtube-nocookie.com for privacy-enhanced mode
      // This is an official YouTube domain that may help with some mobile restrictions
      let enhancedUrl = embedUrl.replace('www.youtube.com', 'www.youtube-nocookie.com');
      enhancedUrl = enhancedUrl.replace('youtube.com', 'www.youtube-nocookie.com');

      const separator = enhancedUrl.includes('?') ? '&' : '?';
      // Add parameters to improve mobile compatibility:
      // - playsinline=1: Allows inline playback on iOS
      // - rel=0: Don't show related videos at the end
      // - modestbranding=1: Minimal YouTube branding
      // - fs=1: Allow fullscreen
      return `${enhancedUrl}${separator}playsinline=1&rel=0&modestbranding=1&fs=1`;
    }

    return embedUrl;
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'animate-fade-in'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Open in new tab button for embeds */}


      {/* Navigation - Previous */}
      {hasPrevious && onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Navigation - Next */}
      {hasNext && onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Media Content with Side Caption */}
      <div className="relative z-0 flex flex-col md:flex-row max-h-[90vh] items-center justify-center gap-4 md:gap-6 animate-scale-in px-2 md:px-0">
        {/* Media */}
        <div className="flex-shrink-0 flex justify-center">
          {media.type === 'image' ? (
            // Image with caption overlay on mobile
            <div className="relative">
              <img
                src={media.image_url || media.url}
                alt={caption || 'Full size image'}
                className="max-h-[85vh] max-w-[95vw] md:max-w-[70vw] rounded-lg object-contain shadow-lg"
              />

              {/* Mobile overlay - gradient fade at bottom (only if caption exists) */}
              {caption && (
                <div className="md:hidden absolute bottom-0 left-0 right-0 pointer-events-none rounded-b-lg overflow-hidden">
                  <div
                    className="h-32"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }}
                  />
                </div>
              )}

              {/* Caption text - overlaid on image (mobile only) */}
              {caption && (
                <button
                  onClick={() => setIsCaptionExpanded(true)}
                  className={cn(
                    "md:hidden absolute bottom-3 left-3 right-3 z-10",
                    "text-left text-sm text-white leading-relaxed",
                    "line-clamp-2"
                  )}
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                >
                  {caption}
                </button>
              )}
            </div>
          ) : isEmbed ? (
            // Embedded video (YouTube/Instagram) - Full screen on mobile, centered on desktop
            <div className="relative">
              <div
                className="relative rounded-lg overflow-hidden shadow-lg w-[calc(100vw-16px)] md:w-[405px]"
                style={{ aspectRatio: '9/16' }}
              >
                <iframe
                  src={getEnhancedEmbedUrl(media.embed_url)}
                  title={caption || 'Embedded video'}
                  className="w-full h-full md:w-[405px] md:h-[720px]"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

                {/* Mobile overlay - gradient fade + caption + YouTube button */}
                <div className="md:hidden absolute bottom-0 left-0 right-0 pointer-events-none">
                  {/* Gradient fade for readability */}
                  <div
                    className="h-40"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }}
                  />
                </div>

                {/* Caption text - overlaid on video (mobile only) */}
                {caption && (
                  <button
                    onClick={() => setIsCaptionExpanded(true)}
                    className={cn(
                      "md:hidden absolute bottom-4 left-3 right-14 z-10",
                      "text-left text-sm text-white leading-relaxed",
                      "line-clamp-2"
                    )}
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                  >
                    {caption}
                  </button>
                )}

                {/* Mobile action buttons - right side column */}
                <div className="md:hidden absolute bottom-4 right-3 flex flex-col gap-2 z-10">
                  {/* Poll button - only if media has attached poll */}
                  {attachedPoll && (
                    <button
                      onClick={() => setIsPollExpanded(true)}
                      className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-colors"
                      aria-label="View Poll"
                    >
                      <BarChart3 className="h-5 w-5" />
                    </button>
                  )}

                  {/* YouTube/Instagram button */}
                  {media.original_url && (
                    <a
                      href={media.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors"
                      aria-label={media.platform === 'youtube' ? 'Watch on YouTube' : 'View on Instagram'}
                    >
                      {media.platform === 'youtube' ? (
                        <Youtube className="h-5 w-5" />
                      ) : media.platform === 'instagram' ? (
                        <Instagram className="h-5 w-5" />
                      ) : (
                        <Youtube className="h-5 w-5" />
                      )}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Regular video file
            <video
              src={media.url}
              controls
              autoPlay
              className="max-h-[85vh] max-w-[95vw] md:max-w-[70vw] rounded-lg shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Side Caption + Poll - Desktop only */}
        {(caption || attachedPoll) && (
          <div className="hidden md:flex flex-col justify-center max-w-[360px] gap-4 animate-fade-in">
            {/* Caption */}
            {caption && (
              <div className="rounded-xl bg-secondary/80 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  {caption}
                </p>
                {media.platform && (
                  <p className="text-xs text-muted-foreground mt-2 capitalize">
                    via {media.platform}
                  </p>
                )}
              </div>
            )}

            {/* Poll - Desktop */}
            {attachedPoll && (
              <div className="max-h-[400px] overflow-y-auto">
                <PollCard
                  poll={attachedPoll}
                  onVote={(option) => handleVote(attachedPoll.id, option)}
                  hasVoted={hasVoted(attachedPoll.id)}
                  userVote={getUserVote(attachedPoll.id)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Caption Expanded - Bottom sheet style, slides up from bottom */}
      {caption && isCaptionExpanded && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setIsCaptionExpanded(false)}
        >
          {/* Bottom sheet container - slides up */}
          <div
            className="w-full bg-black/60 backdrop-blur-md rounded-t-2xl px-4 py-4 max-h-[50vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>

            {/* Caption text */}
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {caption}
            </p>

            {/* Close hint */}
            <button
              onClick={() => setIsCaptionExpanded(false)}
              className="w-full text-xs text-white/50 mt-4 py-2"
            >
              Tap to close
            </button>
          </div>
        </div>
      )}

      {/* Mobile Poll Expanded - Bottom sheet style */}
      {attachedPoll && isPollExpanded && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setIsPollExpanded(false)}
        >
          {/* Bottom sheet container - slides up */}
          <div
            className="w-full bg-background rounded-t-2xl px-4 py-4 max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Poll Card */}
            <PollCard
              poll={attachedPoll}
              onVote={(option) => handleVote(attachedPoll.id, option)}
              hasVoted={hasVoted(attachedPoll.id)}
              userVote={getUserVote(attachedPoll.id)}
            />

            {/* Close button */}
            <button
              onClick={() => setIsPollExpanded(false)}
              className="w-full text-xs text-muted-foreground mt-4 py-2"
            >
              Tap to close
            </button>
          </div>
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

export default MediaModal;
