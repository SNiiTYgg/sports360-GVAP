/**
 * MediaGrid Component - campus360
 * 
 * 3-column media grid for house galleries.
 * Supports images and embedded videos (YouTube/Instagram).
 * Uses 9:16 aspect ratio for vertical content (shorts/reels).
 */

import React from 'react';
import { Play, Youtube, Instagram, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaGridItem {
  id: string;
  type: 'image' | 'video';
  url?: string;           // For uploaded images/videos
  embed_url?: string;     // For YouTube/Instagram embeds
  original_url?: string;  // Original URL for fallback link to platform
  image_url?: string;     // For uploaded images
  platform?: 'youtube' | 'instagram' | null;
  thumbnail?: string;     // For video thumbnails
  caption?: string;
  description?: string;
  poll_id?: string | null; // Associated poll ID
  is_pinned?: boolean;     // Whether the item is pinned to top
}

interface MediaGridProps {
  media: MediaGridItem[];
  onMediaClick: (media: MediaGridItem) => void;
}

/**
 * 3-column media grid with 9:16 aspect ratio
 * Supports both uploaded images and embedded videos
 */
const MediaGrid: React.FC<MediaGridProps> = ({ media, onMediaClick }) => {
  // Get the display URL for an item
  const getDisplayUrl = (item: MediaGridItem): string => {
    if (item.type === 'image') {
      return item.image_url || item.url || '';
    }
    return item.thumbnail || '';
  };

  // Check if item is an embedded video
  const isEmbed = (item: MediaGridItem): boolean => {
    return item.type === 'video' && !!item.embed_url;
  };

  return (
    <div className="border-t border-border">
      {/* Grid Header */}
      <div className="flex items-center justify-center border-b border-border py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Gallery
        </span>
      </div>

      {/* 3-Column Grid with 9:16 aspect ratio */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-2">
        {media.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onMediaClick(item)}
            className={cn(
              'group relative overflow-hidden bg-muted rounded-lg',
              'aspect-[9/16]', // Vertical 9:16 aspect ratio for shorts/reels
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            aria-label={item.caption || item.description || `View ${item.type}`}
          >
            {/* Media Content */}
            {item.type === 'image' ? (
              <img
                src={getDisplayUrl(item)}
                alt={item.caption || item.description || 'Gallery image'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : isEmbed(item) ? (
              // Embedded video - show thumbnail if available, otherwise placeholder
              item.thumbnail ? (
                <div className="relative h-full w-full">
                  <img
                    src={item.thumbnail}
                    alt={item.caption || item.description || 'Video thumbnail'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-3 backdrop-blur-sm">
                      <Play className="h-6 w-6 text-white" fill="currentColor" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted gap-3">
                  {item.platform === 'youtube' && (
                    <Youtube className="h-10 w-10 text-red-500" />
                  )}
                  {item.platform === 'instagram' && (
                    <Instagram className="h-10 w-10 text-pink-500" />
                  )}
                  <div className="rounded-full bg-foreground/80 p-2 text-background">
                    <Play className="h-5 w-5" fill="currentColor" />
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.platform}
                  </span>
                </div>
              )
            ) : (
              // Regular video with thumbnail
              <>
                <img
                  src={item.thumbnail || item.url}
                  alt={item.caption || item.description || 'Video thumbnail'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-foreground/80 p-2 text-background">
                    <Play className="h-5 w-5" fill="currentColor" />
                  </div>
                </div>
              </>
            )}

            {/* Pin Badge */}
            {item.is_pinned && (
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-primary rounded-full p-1.5 shadow-lg border border-primary-foreground/20">
                  <Pin className="h-3 w-3 text-primary-foreground fill-current" />
                </div>
              </div>
            )}

            {/* Platform badge for embedded videos */}
            {isEmbed(item) && item.platform && (
              <div className="absolute top-2 right-2 z-10">
                {item.platform === 'youtube' && (
                  <div className="bg-red-500 rounded-full p-1 shadow-sm">
                    <Youtube className="h-3 w-3 text-white" />
                  </div>
                )}
                {item.platform === 'instagram' && (
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 shadow-sm">
                    <Instagram className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/10" />
          </button>
        ))}
      </div>

      {/* Empty state */}
      {media.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No media yet</p>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
