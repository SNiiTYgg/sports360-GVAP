/**
 * HousePage Component - campus360
 * 
 * Complete house view combining profile and media grid.
 * Fetches media from Supabase and manages modal state.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { House } from '@/data/houses';
import HouseProfile from './HouseProfile';
import MediaGrid, { type MediaGridItem } from './MediaGrid';
import MediaModal from './MediaModal';
import { useHouseMedia } from '@/hooks/useHouseMedia';
import { useHouses } from '@/hooks/useHouses';
import { MediaGridSkeleton } from './skeletons/LoadingSkeletons';

interface HousePageProps {
  house: House;
}

/**
 * Complete house page with profile, media grid, and modal
 * Fetches media from Supabase database
 */
const HousePage: React.FC<HousePageProps> = ({ house }) => {
  // Fetch media from Supabase
  const { media: houseMedia, loading } = useHouseMedia(house.slug);

  // Get Instagram URL for this house
  const { getInstagramUrl } = useHouses();
  const instagramUrl = getInstagramUrl(house.slug);

  // Convert Supabase media to MediaGridItem format
  const media: MediaGridItem[] = useMemo(() => {
    return houseMedia.map(item => ({
      id: item.id,
      type: item.media_type as 'image' | 'video',
      url: item.image_url || undefined,
      embed_url: item.embed_url || undefined,
      original_url: item.original_url || undefined,
      image_url: item.image_url || undefined,
      thumbnail: item.thumbnail_url || undefined,
      platform: item.platform as 'youtube' | 'instagram' | null,
      caption: item.description || undefined,
      description: item.description || undefined,
      poll_id: item.poll_id || undefined,
      is_pinned: item.is_pinned || undefined,
    }));
  }, [houseMedia]);

  // Modal state
  const [selectedMedia, setSelectedMedia] = useState<MediaGridItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Handle media click - open modal
  const handleMediaClick = useCallback(
    (mediaItem: MediaGridItem) => {
      const index = media.findIndex((m) => m.id === mediaItem.id);
      setSelectedMedia(mediaItem);
      setSelectedIndex(index);
    },
    [media]
  );

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedMedia(null);
    setSelectedIndex(-1);
  }, []);

  // Navigate to previous media
  const handlePrevious = useCallback(() => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedMedia(media[newIndex]);
      setSelectedIndex(newIndex);
    }
  }, [selectedIndex, media]);

  // Navigate to next media
  const handleNext = useCallback(() => {
    if (selectedIndex < media.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedMedia(media[newIndex]);
      setSelectedIndex(newIndex);
    }
  }, [selectedIndex, media]);

  return (
    <>
      {/* House Profile Section */}
      <HouseProfile house={house} instagramUrl={instagramUrl} />

      {/* Loading state - Show skeleton grid */}
      {loading ? (
        <div className="px-1">
          <MediaGridSkeleton count={9} />
        </div>
      ) : (
        /* Media Grid Section */
        <MediaGrid media={media} onMediaClick={handleMediaClick} />
      )}

      {/* Fullscreen Media Modal */}
      <MediaModal
        media={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={handleCloseModal}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={selectedIndex > 0}
        hasNext={selectedIndex < media.length - 1}
      />
    </>
  );
};

export default HousePage;
