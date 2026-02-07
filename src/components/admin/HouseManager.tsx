/**
 * HouseManager Component - campus360 Admin
 * 
 * Allows admins to edit house descriptions and profile pictures.
 * Profile images are stored in Supabase Storage with fallback to local images.
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save, RefreshCw, Users, Instagram } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Tables } from '@/integrations/supabase/types';
import { logEntityChange } from '@/lib/adminActivityLog';

type House = Tables<'houses'>;

// Local fallback images mapping
const LOCAL_FALLBACK_IMAGES: Record<string, string> = {
    aakash: '/aakash_house_pp.png',
    agni: '/agni_house_pp.png',
    jal: '/jal_house_pp.png',
    prithvi: '/pirtvi_house_pp.png',
    vayu: '/vayu_house_pp.png',
};

// House color classes for styling
const HOUSE_COLORS: Record<string, string> = {
    aakash: 'border-sky-500 bg-sky-50 dark:bg-sky-950/30',
    agni: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
    jal: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
    prithvi: 'border-green-500 bg-green-50 dark:bg-green-950/30',
    vayu: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30',
};

interface HouseCardProps {
    house: House;
    onUpdate: (house: House) => void;
}

const HouseCard: React.FC<HouseCardProps> = ({ house, onUpdate }) => {
    const [description, setDescription] = useState(house.description);
    const [membersCount, setMembersCount] = useState(house.members_count);
    const [instagramUrl, setInstagramUrl] = useState((house as any).instagram_url || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Get the image URL with fallback logic
    const getImageUrl = () => {
        if (imageError || !house.profile_image_url) {
            return LOCAL_FALLBACK_IMAGES[house.slug] || '/placeholder.svg';
        }
        return house.profile_image_url;
    };

    // Handle image load error - fall back to local image
    const handleImageError = () => {
        setImageError(true);
    };

    // Reset image error when profile_image_url changes
    useEffect(() => {
        setImageError(false);
    }, [house.profile_image_url]);

    // Save description and member count to Supabase
    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('houses')
                .update({
                    description,
                    members_count: membersCount,
                    instagram_url: instagramUrl || null,
                    updated_at: new Date().toISOString()
                })
                .eq('slug', house.slug);

            if (error) throw error;

            toast({
                title: 'House updated',
                description: `${house.name} saved successfully.`,
            });


            await logEntityChange(
                'update',
                'house',
                house.name,
                {
                    description: house.description,
                    members_count: house.members_count,
                    instagram_url: (house as any).instagram_url
                },
                {
                    description,
                    members_count: membersCount,
                    instagram_url: instagramUrl || null
                },
                house.name
            );

            onUpdate({ ...house, description, members_count: membersCount, instagram_url: instagramUrl || null } as any);
        } catch (error: any) {
            toast({
                title: 'Error saving',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    // Upload new profile image
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please upload an image file.',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please upload an image smaller than 5MB.',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${house.slug}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('house-images')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('house-images')
                .getPublicUrl(fileName);

            // Update house record with new image URL
            const { error: updateError } = await supabase
                .from('houses')
                .update({
                    profile_image_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('slug', house.slug);

            if (updateError) throw updateError;

            toast({
                title: 'Image uploaded',
                description: `${house.name} profile picture updated successfully.`,
            });

            await logEntityChange(
                'update',
                'house',
                `${house.name}:profile_image`,
                { profile_image_url: house.profile_image_url },
                { profile_image_url: publicUrl },
                house.name
            );

            setImageError(false);
            onUpdate({ ...house, profile_image_url: publicUrl });
        } catch (error: any) {
            toast({
                title: 'Error uploading image',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Card className={`border-2 ${HOUSE_COLORS[house.slug] || ''}`}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                    {/* Profile Image with fallback */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                        <img
                            src={getImageUrl()}
                            alt={house.name}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                            loading="lazy"
                        />
                        {imageError && (
                            <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">Local</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{house.name}</h3>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Profile Image Upload */}
                <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id={`image-upload-${house.slug}`}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload New Image
                                </>
                            )}
                        </Button>
                        {imageError && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                Using local fallback
                            </span>
                        )}
                    </div>
                </div>

                {/* Member Count Editor */}
                <div className="space-y-2">
                    <Label htmlFor={`members-${house.slug}`} className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Member Count
                    </Label>
                    <Input
                        id={`members-${house.slug}`}
                        type="number"
                        min="0"
                        value={membersCount}
                        onChange={(e) => setMembersCount(parseInt(e.target.value) || 0)}
                        placeholder="Enter member count..."
                        className="w-full"
                    />
                </div>

                {/* Description Editor */}
                <div className="space-y-2">
                    <Label htmlFor={`desc-${house.slug}`}>Description</Label>
                    <Textarea
                        id={`desc-${house.slug}`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter house description..."
                        rows={4}
                        className="resize-none"
                    />
                </div>

                {/* Instagram URL Editor */}
                <div className="space-y-2">
                    <Label htmlFor={`instagram-${house.slug}`} className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram Profile URL
                    </Label>
                    <Input
                        id={`instagram-${house.slug}`}
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/house_handle"
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                        Add the full Instagram profile URL for this house
                    </p>
                </div>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={saving || (description === house.description && membersCount === house.members_count && instagramUrl === ((house as any).instagram_url || ''))}
                    className="w-full"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

const HouseManager: React.FC<{ restrictToHouse?: string | null }> = ({ restrictToHouse }) => {
    const [houses, setHouses] = useState<House[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch houses from Supabase
    const fetchHouses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('houses')
                .select('id, name, slug, color, description, profile_image_url, members_count, instagram_url')
                .order('name');

            if (error) throw error;

            setHouses((data || []) as House[]);
        } catch (error: any) {
            toast({
                title: 'Error loading houses',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHouses();
    }, []);

    // Handle house update
    const handleHouseUpdate = (updatedHouse: House) => {
        setHouses((prev) =>
            prev.map((h) => (h.slug === updatedHouse.slug ? updatedHouse : h))
        );
    };

    // Filter houses if restrictToHouse is set (for house_social admins)
    const displayHouses = restrictToHouse
        ? houses.filter(h => h.slug === restrictToHouse)
        : houses;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">House Management</h2>
                    <p className="text-muted-foreground">
                        Edit house descriptions and profile pictures
                    </p>
                </div>
                <Button variant="outline" onClick={fetchHouses}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Houses Grid */}
            {displayHouses.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                        No houses found. Please check your Supabase setup.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {displayHouses.map((house) => (
                        <HouseCard
                            key={house.slug}
                            house={house}
                            onUpdate={handleHouseUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HouseManager;

