/**
 * useHouseMedia Hook - campus360
 * 
 * Hook for fetching house media (images + embedded videos) from Supabase.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HouseMediaItem {
    id: string;
    house: string;
    media_type: 'image' | 'video';
    platform: 'youtube' | 'instagram' | null;
    original_url: string | null;
    embed_url: string | null;
    image_url: string | null;
    thumbnail_url: string | null;
    description: string | null;
    poll_id: string | null;
    is_pinned: boolean;
    created_at: string;
}

interface UseHouseMediaResult {
    media: HouseMediaItem[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Fetch media for a specific house from Supabase
 * @param houseSlug - The house slug (agni, jal, prithvi, vayu, aakash)
 */
export const useHouseMedia = (houseSlug?: string): UseHouseMediaResult => {
    const [media, setMedia] = useState<HouseMediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Try fetching with is_pinned sorting first
            const fullQuery = supabase
                .from('house_media')
                .select('id, house, media_type, platform, original_url, embed_url, image_url, thumbnail_url, description, poll_id, is_pinned, created_at')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (houseSlug) fullQuery.eq('house', houseSlug);

            const { data: fullData, error: fullError } = await fullQuery;

            if (fullError) {
                // If column 'is_pinned' doesn't exist, Supabase returns a 400/PGRST204 or specific message
                if (fullError.message.includes('is_pinned') || fullError.code === '42703' || fullError.code === 'PGRST204') {
                    console.warn("Column 'is_pinned' not found in database. Falling back to standard query.");

                    const fallbackQuery = supabase
                        .from('house_media')
                        .select('id, house, media_type, platform, original_url, embed_url, image_url, thumbnail_url, description, poll_id, created_at')
                        .order('created_at', { ascending: false });

                    if (houseSlug) fallbackQuery.eq('house', houseSlug);

                    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
                    if (fallbackError) throw fallbackError;

                    const typedMedia = (fallbackData || []).map(item => ({
                        ...item,
                        is_pinned: false, // Default to false
                        media_type: item.media_type as 'image' | 'video',
                        platform: item.platform as 'youtube' | 'instagram' | null,
                    }));
                    setMedia(typedMedia);
                    return;
                }
                throw fullError;
            }

            const typedMedia = (fullData || []).map(item => ({
                ...item,
                media_type: item.media_type as 'image' | 'video',
                platform: item.platform as 'youtube' | 'instagram' | null,
            }));

            setMedia(typedMedia);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch media');
        } finally {
            setLoading(false);
        }
    }, [houseSlug]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    return { media, loading, error, refetch: fetchMedia };
};

/**
 * Parse YouTube Shorts URL to get embed URL
 * Input: https://youtube.com/shorts/VIDEO_ID or https://www.youtube.com/shorts/VIDEO_ID
 * Also handles URLs with query parameters like ?si=xxx
 * Output: https://www.youtube.com/embed/VIDEO_ID
 */
export const parseYouTubeUrl = (url: string): string | null => {
    // First, try to extract video ID from various YouTube URL formats
    // These patterns capture the video ID and ignore any trailing query parameters
    const patterns = [
        // YouTube Shorts: youtube.com/shorts/VIDEO_ID or youtube.com/shorts/VIDEO_ID?si=xxx
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)(?:\?|&|$)/,
        // youtu.be short links: youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?si=xxx
        /youtu\.be\/([a-zA-Z0-9_-]+)(?:\?|&|$)/,
        // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
        // watch URLs with v param not first: youtube.com/watch?feature=share&v=VIDEO_ID
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/,
        // Embed URLs (in case someone pastes an embed URL)
        /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
    }
    return null;
};

/**
 * Parse Instagram Reel/Post URL to get embed URL
 * Input: https://www.instagram.com/reel/XYZ/ or https://www.instagram.com/p/XYZ/
 * Output: https://www.instagram.com/reel/XYZ/embed or https://www.instagram.com/p/XYZ/embed
 */
export const parseInstagramUrl = (url: string): string | null => {
    const patterns = [
        /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
        /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            // Determine if it's a reel or post
            const isReel = url.includes('/reel/');
            const type = isReel ? 'reel' : 'p';
            return `https://www.instagram.com/${type}/${match[1]}/embed`;
        }
    }
    return null;
};

/**
 * Validate URL for supported platforms
 * Returns the platform and embed URL if valid
 */
export const validateAndParseUrl = (url: string, platform: 'youtube' | 'instagram'): {
    isValid: boolean;
    embedUrl: string | null;
    error?: string;
} => {
    if (platform === 'youtube') {
        const embedUrl = parseYouTubeUrl(url);
        if (embedUrl) {
            return { isValid: true, embedUrl };
        }
        return {
            isValid: false,
            embedUrl: null,
            error: 'Invalid YouTube URL. Use a YouTube Shorts, watch, or youtu.be link.'
        };
    }

    if (platform === 'instagram') {
        // Check if it's a profile link (not allowed)
        if (/instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(url) && !url.includes('/p/') && !url.includes('/reel/')) {
            return {
                isValid: false,
                embedUrl: null,
                error: 'Instagram profile links cannot be embedded. Use a Reel or Post link.'
            };
        }

        const embedUrl = parseInstagramUrl(url);
        if (embedUrl) {
            return { isValid: true, embedUrl };
        }
        return {
            isValid: false,
            embedUrl: null,
            error: 'Invalid Instagram URL. Use a Reel or Post link.'
        };
    }

    return { isValid: false, embedUrl: null, error: 'Unsupported platform' };
};

export default useHouseMedia;
