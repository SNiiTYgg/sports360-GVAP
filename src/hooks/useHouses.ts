/**
 * useHouses Hook - campus360
 * 
 * Fetches houses from Supabase with fallback to local data.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { houses as localHouses, type House } from '@/data/houses';

// Local fallback images mapping
const LOCAL_FALLBACK_IMAGES: Record<string, string> = {
    aakash: '/aakash_house_pp.png',
    agni: '/agni_house_pp.png',
    jal: '/jal_house_pp.png',
    prithvi: '/pirtvi_house_pp.png',
    vayu: '/vayu_house_pp.png',
};

export interface SupabaseHouse {
    id: string;
    slug: string;
    name: string;
    color: 'aakash' | 'agni' | 'jal' | 'prithvi' | 'vayu';
    description: string;
    profileImage: string;
    membersCount: number;
    instagramUrl?: string | null;
}

export const useHouses = () => {
    const [houses, setHouses] = useState<House[]>(localHouses);
    const [instagramUrls, setInstagramUrls] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHouses = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('houses')
                    .select('id, name, slug, color, description, profile_image_url, members_count, instagram_url')
                    .order('name');

                if (fetchError) throw fetchError;

                if (data && data.length > 0) {
                    // Build instagram URLs map
                    const urlsMap: Record<string, string | null> = {};

                    // Map Supabase data to House interface
                    const mappedHouses: House[] = data.map((h) => {
                        // Get local house data for media (we're not syncing media yet)
                        const localHouse = localHouses.find((lh) => lh.slug === h.slug);

                        // Store instagram URL
                        urlsMap[h.slug] = (h as any).instagram_url || null;

                        return {
                            id: h.id,
                            name: h.name,
                            slug: h.slug,
                            color: h.color as House['color'],
                            // Use Supabase image if available, otherwise fallback to local
                            profileImage: h.profile_image_url || LOCAL_FALLBACK_IMAGES[h.slug] || '/placeholder.svg',
                            membersCount: h.members_count || 0,
                            description: h.description || '',
                            // Keep local media for now (not syncing gallery yet)
                            media: localHouse?.media || [],
                        };
                    });

                    setHouses(mappedHouses);
                    setInstagramUrls(urlsMap);
                }
            } catch (err: any) {
                console.error('Error fetching houses:', err);
                setError(err.message);
                // Keep using local data on error
            } finally {
                setLoading(false);
            }
        };

        fetchHouses();
    }, []);

    // Helper to get house by slug
    const getHouseBySlug = (slug: string): House | undefined => {
        return houses.find((h) => h.slug === slug);
    };

    // Helper to get Instagram URL by slug
    const getInstagramUrl = (slug: string): string | null => {
        return instagramUrls[slug] || null;
    };

    return { houses, loading, error, getHouseBySlug, instagramUrls, getInstagramUrl };
};

export default useHouses;
