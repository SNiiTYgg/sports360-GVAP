/**
 * WinnerManager Component
 * 
 * Admin panel for managing winner reveal settings:
 * - Sports Winner toggle (ON/OFF)
 * - Overall Winner toggle (ON/OFF)
 * - Celebration window hours setting
 * - Display active reveal timestamps
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Medal, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logToggleChange, logSettingChange } from '@/lib/adminActivityLog';

interface SportsSettings {
    id: string;
    sports_reveal_on: boolean;
    sports_reveal_started_at: string | null;
    overall_reveal_on: boolean;
    overall_reveal_started_at: string | null;
    celebration_window_hours: number;
}

const WinnerManager: React.FC = () => {
    const [settings, setSettings] = useState<SportsSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [windowHours, setWindowHours] = useState(24);
    const { toast } = useToast();

    // Fetch settings
    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('sports_settings')
                .select('id, sports_reveal_on, sports_reveal_started_at, overall_reveal_on, overall_reveal_started_at, celebration_window_hours')
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSettings(data as SportsSettings);
                setWindowHours(data.celebration_window_hours || 24);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Toggle Sports Winner
    const handleSportsToggle = async (checked: boolean) => {
        if (!settings) return;
        setSaving(true);
        const oldValue = settings.sports_reveal_on;

        try {
            const updateData = checked
                ? { sports_reveal_on: true, sports_reveal_started_at: new Date().toISOString() }
                : { sports_reveal_on: false, sports_reveal_started_at: null };

            const { error } = await supabase
                .from('sports_settings')
                .update(updateData)
                .eq('id', settings.id);

            if (error) throw error;

            await logToggleChange('sports_reveal_on', oldValue, checked);
            toast({
                title: checked ? '🥇 Sports Winner Revealed!' : 'Sports Winner Hidden',
                description: checked ? 'Celebration will play for new visitors.' : 'Celebration removed.',
            });

            fetchSettings();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Toggle Overall Winner
    const handleOverallToggle = async (checked: boolean) => {
        if (!settings) return;
        setSaving(true);
        const oldValue = settings.overall_reveal_on;

        try {
            const updateData = checked
                ? { overall_reveal_on: true, overall_reveal_started_at: new Date().toISOString() }
                : { overall_reveal_on: false, overall_reveal_started_at: null };

            const { error } = await supabase
                .from('sports_settings')
                .update(updateData)
                .eq('id', settings.id);

            if (error) throw error;

            await logToggleChange('overall_reveal_on', oldValue, checked);
            toast({
                title: checked ? '🏆 Overall Winner Revealed!' : 'Overall Winner Hidden',
                description: checked ? 'Grand celebration will play for new visitors.' : 'Celebration removed.',
            });

            fetchSettings();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Update window hours
    const handleWindowUpdate = async () => {
        if (!settings) return;
        setSaving(true);
        const oldValue = settings.celebration_window_hours;

        try {
            const { error } = await supabase
                .from('sports_settings')
                .update({ celebration_window_hours: windowHours })
                .eq('id', settings.id);

            if (error) throw error;

            await logSettingChange('celebration_window_hours', oldValue, windowHours);
            toast({ title: 'Updated', description: `Celebration window set to ${windowHours} hours.` });
            fetchSettings();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Format timestamp for display
    const formatTimestamp = (timestamp: string | null) => {
        if (!timestamp) return 'Not active';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Calculate time remaining in window
    const getTimeRemaining = (startedAt: string | null, windowHours: number) => {
        if (!startedAt) return null;
        const endTime = new Date(startedAt).getTime() + windowHours * 60 * 60 * 1000;
        const remaining = endTime - Date.now();
        if (remaining <= 0) return 'Expired';
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h ${minutes}m remaining`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading settings...</div>
            </div>
        );
    }

    if (!settings) {
        return (
            <Card className="border-destructive">
                <CardContent className="py-6">
                    <div className="flex items-center gap-3 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <p>sports_settings table not found. Please run the SQL migration first.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Winner Celebration Controls
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={saving}>
                            <RefreshCw className={cn("h-4 w-4 mr-2", saving && "animate-spin")} />
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Toggle winner reveals to show celebrations on the scoreboard.
                        Overall Winner takes priority over Sports Winner.
                    </p>
                </CardContent>
            </Card>

            {/* Sports Winner Toggle */}
            <Card className={cn(settings.sports_reveal_on && "border-yellow-500/50 bg-yellow-500/5")}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Medal className="h-5 w-5 text-amber-500" />
                        Sports Winner
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Enable Sports Winner Reveal</Label>
                            <p className="text-sm text-muted-foreground">
                                Shows medal celebration for the leading house
                            </p>
                        </div>
                        <Switch
                            checked={settings.sports_reveal_on}
                            onCheckedChange={handleSportsToggle}
                            disabled={saving}
                        />
                    </div>

                    {settings.sports_reveal_on && (
                        <div className="pt-3 border-t space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Started:</span>
                                <span className="font-medium">{formatTimestamp(settings.sports_reveal_started_at)}</span>
                            </div>
                            <div className="text-sm text-amber-600 dark:text-amber-400">
                                {getTimeRemaining(settings.sports_reveal_started_at, settings.celebration_window_hours)}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Overall Winner Toggle */}
            <Card className={cn(settings.overall_reveal_on && "border-yellow-500 bg-yellow-500/10")}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Overall Winner (Grand Celebration)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Enable Overall Winner Reveal</Label>
                            <p className="text-sm text-muted-foreground">
                                Shows countdown + confetti + trophy celebration
                            </p>
                        </div>
                        <Switch
                            checked={settings.overall_reveal_on}
                            onCheckedChange={handleOverallToggle}
                            disabled={saving}
                        />
                    </div>

                    {settings.overall_reveal_on && (
                        <div className="pt-3 border-t space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Started:</span>
                                <span className="font-medium">{formatTimestamp(settings.overall_reveal_started_at)}</span>
                            </div>
                            <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                {getTimeRemaining(settings.overall_reveal_started_at, settings.celebration_window_hours)}
                            </div>
                        </div>
                    )}

                    {settings.overall_reveal_on && settings.sports_reveal_on && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                            <AlertTriangle className="h-4 w-4" />
                            Overall Winner is taking priority. Sports Winner celebration is hidden.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Celebration Window Setting */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Celebration Window
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>Window Duration (Hours)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={168}
                                value={windowHours}
                                onChange={(e) => setWindowHours(parseInt(e.target.value) || 24)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Celebration plays for new visitors within this time after toggle ON.
                            </p>
                        </div>
                        <Button
                            onClick={handleWindowUpdate}
                            disabled={saving || windowHours === settings.celebration_window_hours}
                        >
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WinnerManager;
