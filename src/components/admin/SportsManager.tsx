/**
 * Sports Manager Component
 * 
 * CRUD operations for managing sports events and house points.
 * Data is stored in Supabase for persistence.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Trophy, RefreshCw, Settings, ChevronDown, Eye, EyeOff } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { cn } from '@/lib/utils';
import { useAppSetting } from '@/hooks/useAppSettings';
import { Switch } from '@/components/ui/switch';
import { logToggleChange, logSettingChange, logEntityChange } from '@/lib/adminActivityLog';

export interface SportEvent {
    id: string;
    game: string;
    category: 'Boys' | 'Girls';
    vayu: number;
    aakash: number;
    prithvi: number;
    agni: number;
    jal: number;
}

const houses = ['vayu', 'aakash', 'prithvi', 'agni', 'jal'] as const;

const houseColors: Record<string, string> = {
    vayu: 'text-purple-600 dark:text-purple-400',
    aakash: 'text-sky-600 dark:text-sky-400',
    prithvi: 'text-green-600 dark:text-green-400',
    agni: 'text-orange-600 dark:text-orange-400',
    jal: 'text-blue-600 dark:text-blue-400',
};

const SportsManager: React.FC = () => {
    const [events, setEvents] = useState<SportEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { toast } = useToast();

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Event settings
    const { value: eventYear, update: updateEventYear, loading: yearLoading } = useAppSetting('event_year', '2024-25');
    const { value: eventName, update: updateEventName, loading: nameLoading } = useAppSetting('event_name', '');

    // Visibility toggles
    const { value: eventNameVisible, update: updateEventNameVisible, loading: eventNameVisibleLoading } = useAppSetting('event_name_visible', 'true');
    const { value: eventYearVisible, update: updateEventYearVisible, loading: eventYearVisibleLoading } = useAppSetting('event_year_visible', 'true');

    const [editingYear, setEditingYear] = useState('');
    const [editingName, setEditingName] = useState('');
    const [savingYear, setSavingYear] = useState(false);
    const [savingName, setSavingName] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Omit<SportEvent, 'id'>>({
        game: '',
        category: 'Boys',
        vayu: 0,
        aakash: 0,
        prithvi: 0,
        agni: 0,
        jal: 0,
    });

    // Initialize editing values when settings load
    useEffect(() => {
        if (eventYear) {
            setEditingYear(eventYear);
        }
    }, [eventYear]);

    useEffect(() => {
        if (eventName) {
            setEditingName(eventName);
        }
    }, [eventName]);

    // Handle save year
    const handleSaveYear = async () => {
        if (!editingYear.trim()) {
            toast({ title: 'Error', description: 'Please enter an event year', variant: 'destructive' });
            return;
        }

        setSavingYear(true);
        const oldYear = eventYear;
        try {
            const success = await updateEventYear(editingYear.trim());
            if (success) {
                await logSettingChange('event_year', oldYear, editingYear.trim());
                toast({ title: 'Success', description: 'Event year updated!' });
            } else {
                throw new Error('Failed to update event year');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSavingYear(false);
        }
    };

    // Handle save event name
    const handleSaveName = async () => {
        setSavingName(true);
        const oldName = eventName;
        try {
            const success = await updateEventName(editingName.trim());
            if (success) {
                await logSettingChange('event_name', oldName, editingName.trim());
                toast({ title: 'Success', description: 'Event name updated!' });
            } else {
                throw new Error('Failed to update event name');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSavingName(false);
        }
    };

    // Toggle Event Name visibility
    const handleToggleEventNameVisible = async () => {
        const oldValue = eventNameVisible === 'true';
        const newValue = eventNameVisible === 'true' ? 'false' : 'true';
        await updateEventNameVisible(newValue);
        await logToggleChange('event_name_visible', oldValue, newValue === 'true');
        toast({
            title: 'Success',
            description: `Event name is now ${newValue === 'true' ? 'visible' : 'hidden'}`
        });
    };

    // Toggle Event Year visibility
    const handleToggleEventYearVisible = async () => {
        const oldValue = eventYearVisible === 'true';
        const newValue = eventYearVisible === 'true' ? 'false' : 'true';
        await updateEventYearVisible(newValue);
        await logToggleChange('event_year_visible', oldValue, newValue === 'true');
        toast({
            title: 'Success',
            description: `Event year is now ${newValue === 'true' ? 'visible' : 'hidden'}`
        });
    };

    // Fetch events from Supabase
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('sport_events')
                .select('id, game, category, vayu, aakash, prithvi, agni, jal, created_at')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const parsedEvents: SportEvent[] = (data || []).map(e => ({
                id: e.id,
                game: e.game,
                category: e.category as 'Boys' | 'Girls',
                vayu: e.vayu || 0,
                aakash: e.aakash || 0,
                prithvi: e.prithvi || 0,
                agni: e.agni || 0,
                jal: e.jal || 0,
            }));

            setEvents(parsedEvents);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Reset form
    const resetForm = () => {
        setFormData({
            game: '',
            category: 'Boys',
            vayu: 0,
            aakash: 0,
            prithvi: 0,
            agni: 0,
            jal: 0,
        });
        setEditingId(null);
        setShowAddForm(false);
    };

    // Add new event
    const handleAdd = async () => {
        if (!formData.game.trim()) {
            toast({ title: 'Error', description: 'Please enter a game name', variant: 'destructive' });
            return;
        }

        try {
            const newEventData = {
                game: formData.game.trim(),
                category: formData.category,
                vayu: formData.vayu,
                aakash: formData.aakash,
                prithvi: formData.prithvi,
                agni: formData.agni,
                jal: formData.jal,
            };
            const { error } = await supabase.from('sport_events').insert(newEventData);

            if (error) throw error;

            await logEntityChange('insert', 'sport_event', formData.game.trim(), null, newEventData);
            toast({ title: 'Success', description: 'Sport event added successfully!' });
            resetForm();
            fetchEvents();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // Update event
    const handleUpdate = async () => {
        if (!editingId || !formData.game.trim()) return;

        // Get old data before update
        const oldEvent = events.find(e => e.id === editingId);

        try {
            const newEventData = {
                game: formData.game.trim(),
                category: formData.category,
                vayu: formData.vayu,
                aakash: formData.aakash,
                prithvi: formData.prithvi,
                agni: formData.agni,
                jal: formData.jal,
            };
            const { error } = await supabase
                .from('sport_events')
                .update(newEventData)
                .eq('id', editingId);

            if (error) throw error;

            await logEntityChange('update', 'sport_event', formData.game.trim(), oldEvent, newEventData);
            toast({ title: 'Success', description: 'Sport event updated successfully!' });
            resetForm();
            fetchEvents();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // Delete event - open confirmation
    const handleDeleteClick = (id: string) => {
        setDeleteTarget(id);
    };

    // Delete event - confirmed
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        // Get old data before delete
        const deletedEvent = events.find(e => e.id === deleteTarget);

        setIsDeleting(true);
        try {
            const { error } = await supabase.from('sport_events').delete().eq('id', deleteTarget);
            if (error) throw error;
            await logEntityChange('delete', 'sport_event', deletedEvent?.game || 'unknown', deletedEvent, null);
            toast({ title: 'Deleted', description: 'Sport event removed successfully' });
            fetchEvents();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    // Start editing
    const startEdit = (event: SportEvent) => {
        setFormData({
            game: event.game,
            category: event.category,
            vayu: event.vayu,
            aakash: event.aakash,
            prithvi: event.prithvi,
            agni: event.agni,
            jal: event.jal,
        });
        setEditingId(event.id);
        setShowAddForm(true);
    };

    // Handle point change
    const handlePointChange = (house: string, value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setFormData((prev) => ({ ...prev, [house]: numValue }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    const boysEvents = events.filter((e) => e.category === 'Boys');
    const girlsEvents = events.filter((e) => e.category === 'Girls');

    return (
        <div className="space-y-6">
            {/* Event Settings - Collapsible */}
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Event Settings
                                </div>
                                <ChevronDown className={cn(
                                    "h-5 w-5 transition-transform duration-200",
                                    settingsOpen && "rotate-180"
                                )} />
                            </CardTitle>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-6 pt-0">
                            {/* Visibility Toggles - at the top */}
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">Visibility Settings</Label>

                                {/* Event Name Visibility Toggle */}
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {eventNameVisible === 'true' ? (
                                            <Eye className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="font-medium">Event Name Visibility</p>
                                            <p className="text-sm text-muted-foreground">
                                                {eventNameVisible === 'true' ? 'Event name is visible on the scoreboard' : 'Event name is hidden from the scoreboard'}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={eventNameVisible === 'true'}
                                        onCheckedChange={handleToggleEventNameVisible}
                                        disabled={eventNameVisibleLoading}
                                    />
                                </div>

                                {/* Event Year Visibility Toggle */}
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {eventYearVisible === 'true' ? (
                                            <Eye className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="font-medium">Event Year Visibility</p>
                                            <p className="text-sm text-muted-foreground">
                                                {eventYearVisible === 'true' ? 'Event year is visible on the scoreboard' : 'Event year is hidden from the scoreboard'}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={eventYearVisible === 'true'}
                                        onCheckedChange={handleToggleEventYearVisible}
                                        disabled={eventYearVisibleLoading}
                                    />
                                </div>
                            </div>

                            <hr className="border-border" />

                            {/* Event Name */}
                            <div className="space-y-3">
                                <div className="flex items-end gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label>Event Name</Label>
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            placeholder="e.g., Annual Sports Meet"
                                            disabled={nameLoading}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Displayed as a banner above the scoreboard. Leave empty to hide.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleSaveName}
                                        disabled={savingName || nameLoading || editingName === eventName}
                                        size="sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {savingName ? 'Saving...' : 'Save Name'}
                                    </Button>
                                </div>
                            </div>

                            <hr className="border-border" />

                            {/* Event Year */}
                            <div className="space-y-3">
                                <div className="flex items-end gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label>Event Year</Label>
                                        <Input
                                            value={editingYear}
                                            onChange={(e) => setEditingYear(e.target.value)}
                                            placeholder="e.g., 2024-25"
                                            disabled={yearLoading}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Displayed in the detailed scoreboard title
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleSaveYear}
                                        disabled={savingYear || yearLoading || editingYear === eventYear}
                                        size="sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {savingYear ? 'Saving...' : 'Save Year'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            Manage Sports & Points
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchEvents}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Add, edit, or remove sports events and assign points to each house.
                    </p>
                    {!showAddForm && (
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Sport
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Form */}
            {showAddForm && (
                <Card className="border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-base">
                            {editingId ? 'Edit Sport Event' : 'Add New Sport Event'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Game Name</Label>
                                <Input
                                    value={formData.game}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, game: e.target.value }))}
                                    placeholder="e.g., Basketball, Chess..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value: 'Boys' | 'Girls') =>
                                        setFormData((prev) => ({ ...prev, category: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Boys">Boys</SelectItem>
                                        <SelectItem value="Girls">Girls</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* House Points */}
                        <div className="space-y-2">
                            <Label>Points for Each House</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {houses.map((house) => (
                                    <div key={house} className="space-y-1">
                                        <Label className={cn('text-xs uppercase', houseColors[house])}>
                                            {house}
                                        </Label>
                                        <Input
                                            type="number"
                                            value={formData[house]}
                                            onChange={(e) => handlePointChange(house, e.target.value)}
                                            className="text-center"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button onClick={editingId ? handleUpdate : handleAdd}>
                                <Save className="h-4 w-4 mr-2" />
                                {editingId ? 'Update' : 'Save'}
                            </Button>
                            <Button variant="outline" onClick={resetForm}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Boys Events */}
            <Card>
                <CardHeader className="bg-rose-50 dark:bg-rose-950/30">
                    <CardTitle className="text-base text-rose-700 dark:text-rose-300">
                        Boys Events ({boysEvents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {boysEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4">No boys events added yet</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {boysEvents.map((event) => (
                                <EventRow
                                    key={event.id}
                                    event={event}
                                    onEdit={() => startEdit(event)}
                                    onDelete={() => handleDeleteClick(event.id)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Girls Events */}
            <Card>
                <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
                    <CardTitle className="text-base text-blue-700 dark:text-blue-300">
                        Girls Events ({girlsEvents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {girlsEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4">No girls events added yet</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {girlsEvents.map((event) => (
                                <EventRow
                                    key={event.id}
                                    event={event}
                                    onEdit={() => startEdit(event)}
                                    onDelete={() => handleDeleteClick(event.id)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName="this sport event"
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </div>
    );
};

/**
 * Event Row Component
 */
const EventRow: React.FC<{
    event: SportEvent;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ event, onEdit, onDelete }) => {
    return (
        <div className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
                <p className="font-medium text-sm">{event.game}</p>
                <div className="flex gap-3 mt-1 text-xs">
                    <span className={houseColors.vayu}>V: {event.vayu}</span>
                    <span className={houseColors.aakash}>A: {event.aakash}</span>
                    <span className={houseColors.prithvi}>P: {event.prithvi}</span>
                    <span className={houseColors.agni}>Ag: {event.agni}</span>
                    <span className={houseColors.jal}>J: {event.jal}</span>
                </div>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                    <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default SportsManager;

// Export helper to get events for scoreboard (fetches from Supabase)
export const getSportsEvents = async (): Promise<SportEvent[]> => {
    try {
        const { data, error } = await supabase
            .from('sport_events')
            .select('id, game, category, vayu, aakash, prithvi, agni, jal, created_at')
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(e => ({
            id: e.id,
            game: e.game,
            category: e.category as 'Boys' | 'Girls',
            vayu: e.vayu || 0,
            aakash: e.aakash || 0,
            prithvi: e.prithvi || 0,
            agni: e.agni || 0,
            jal: e.jal || 0,
        }));
    } catch (error) {
        console.error('Error loading sports events:', error);
        return [];
    }
};
