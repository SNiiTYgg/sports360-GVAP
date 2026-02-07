/**
 * Member Count Manager Component
 * 
 * Manage member counts for each house.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Users, Loader2 } from 'lucide-react';
import { houses } from '@/data/houses';

interface MemberCounts {
    [key: string]: number;
}

const STORAGE_KEY = 'house_member_counts';

const MemberCountManager: React.FC = () => {
    const [memberCounts, setMemberCounts] = useState<MemberCounts>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Load member counts from localStorage on mount
    useEffect(() => {
        const loadMemberCounts = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setMemberCounts(JSON.parse(stored));
                } else {
                    // Initialize with default values from houses data
                    const defaultCounts: MemberCounts = {};
                    houses.forEach((house) => {
                        defaultCounts[house.slug] = house.membersCount;
                    });
                    setMemberCounts(defaultCounts);
                }
            } catch (error) {
                console.error('Error loading member counts:', error);
                // Initialize with defaults on error
                const defaultCounts: MemberCounts = {};
                houses.forEach((house) => {
                    defaultCounts[house.slug] = house.membersCount;
                });
                setMemberCounts(defaultCounts);
            }
            setLoading(false);
        };

        loadMemberCounts();
    }, []);

    const handleCountChange = (slug: string, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setMemberCounts((prev) => ({
                ...prev,
                [slug]: numValue,
            }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memberCounts));
            toast({
                title: 'Success',
                description: 'Member counts saved successfully!',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save member counts',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        const defaultCounts: MemberCounts = {};
        houses.forEach((house) => {
            defaultCounts[house.slug] = house.membersCount;
        });
        setMemberCounts(defaultCounts);
        toast({
            title: 'Reset',
            description: 'Member counts reset to default values',
        });
    };

    // House color mapping for visual distinction
    const getHouseColor = (color: string) => {
        const colors: { [key: string]: string } = {
            aakash: 'bg-sky-500/10 border-sky-500/30 hover:border-sky-500/50',
            agni: 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50',
            jal: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50',
            prithvi: 'bg-green-500/10 border-green-500/30 hover:border-green-500/50',
            vayu: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50',
        };
        return colors[color] || 'bg-muted border-border';
    };

    const getTextColor = (color: string) => {
        const colors: { [key: string]: string } = {
            aakash: 'text-sky-500',
            agni: 'text-orange-500',
            jal: 'text-blue-500',
            prithvi: 'text-green-500',
            vayu: 'text-purple-500',
        };
        return colors[color] || 'text-foreground';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Manage Member Counts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Update the member count for each house. Changes will be saved locally and displayed on house profiles.
                    </p>
                </CardContent>
            </Card>

            {/* Houses Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {houses.map((house) => (
                    <Card
                        key={house.slug}
                        className={`border-2 transition-colors ${getHouseColor(house.color)}`}
                    >
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-base flex items-center gap-2 ${getTextColor(house.color)}`}>
                                <img
                                    src={house.profileImage}
                                    alt={house.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                    loading="lazy"
                                />
                                {house.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor={`count-${house.slug}`} className="text-sm">
                                    Member Count
                                </Label>
                                <Input
                                    id={`count-${house.slug}`}
                                    type="number"
                                    min="0"
                                    value={memberCounts[house.slug] ?? house.membersCount}
                                    onChange={(e) => handleCountChange(house.slug, e.target.value)}
                                    className="text-lg font-semibold"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {house.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Reset to Defaults
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MemberCountManager;
