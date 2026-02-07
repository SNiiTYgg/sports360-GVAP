/**
 * Arena Manager Component
 * 
 * Admin panel for managing Arena matches (LIVE/UPCOMING/COMPLETED).
 * Allows creating, editing, and deleting matches with status control.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Swords, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tables } from '@/integrations/supabase/types';
import { logToggleChange, logEntityChange } from '@/lib/adminActivityLog';
import { ArenaFilters } from '@/components/ArenaFilters';

type ArenaMatch = Tables<'arena_matches'>;
type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';
type ResultType = 'WIN' | 'DRAW' | 'NO_RESULT';

const houses = ['aakash', 'agni', 'jal', 'prithvi', 'vayu'] as const;
const housesWithTBD = ['tbd', 'aakash', 'agni', 'jal', 'prithvi', 'vayu'] as const;

const houseLabels: Record<string, string> = {
    tbd: '🏳️ To Be Decided',
    aakash: 'Aakash',
    agni: 'Agni',
    jal: 'Jal',
    prithvi: 'Prithvi',
    vayu: 'Vayu',
};

const statusColors: Record<MatchStatus, string> = {
    LIVE: 'bg-red-500 text-white',
    UPCOMING: 'bg-amber-500 text-white',
    COMPLETED: 'bg-green-500 text-white',
};

const ArenaManager: React.FC = () => {
    const { toast } = useToast();
    const [matches, setMatches] = useState<ArenaMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showLiveConfirm, setShowLiveConfirm] = useState(false);
    const [pendingLiveData, setPendingLiveData] = useState<any>(null);
    const [arenaVisible, setArenaVisible] = useState(true);
    const [visibilityLoading, setVisibilityLoading] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // Ref for scrolling to edit form
    const editFormRef = useRef<HTMLDivElement>(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        sport: '',
        match_title: '',
        house_a_key: '' as string,
        house_b_key: '' as string,
        organizer_house_key: '' as string,
        status: 'UPCOMING' as MatchStatus,
        result_type: null as ResultType | null,
        winner_house_key: null as string | null,
        sequence_number: 1,
    });

    // Fetch matches on mount
    useEffect(() => {
        fetchMatches();
        fetchVisibility();
    }, []);

    const fetchVisibility = async () => {
        const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'arena_visible')
            .single();
        if (data) {
            setArenaVisible(data.value === 'true');
        }
    };

    const toggleVisibility = async () => {
        setVisibilityLoading(true);
        const oldValue = arenaVisible;
        const newValue = !arenaVisible;
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'arena_visible', value: String(newValue) }, { onConflict: 'key' });
        if (error) {
            toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' });
        } else {
            await logToggleChange('arena_visible', oldValue, newValue);
            setArenaVisible(newValue);
            toast({ title: 'Success', description: `Arena tab is now ${newValue ? 'visible' : 'hidden'}` });
        }
        setVisibilityLoading(false);
    };

    const fetchMatches = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('arena_matches')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch matches',
                variant: 'destructive',
            });
        } else {
            setMatches(data || []);
        }
        setLoading(false);
    };

    const resetForm = () => {
        setFormData({
            sport: '',
            match_title: '',
            house_a_key: '',
            house_b_key: '',
            organizer_house_key: '',
            status: 'UPCOMING',
            result_type: null,
            winner_house_key: null,
            sequence_number: 1,
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.sport || !formData.match_title || !formData.house_a_key ||
            !formData.house_b_key || !formData.organizer_house_key) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        // Note: Same house vs same house is allowed for intra-house matches
        // Display will automatically add "A" and "B" suffix when houses are the same

        // Validate that both houses cannot be TBD
        if (formData.house_a_key === 'tbd' && formData.house_b_key === 'tbd') {
            toast({
                title: 'Validation Error',
                description: 'At least one team must be confirmed. Both cannot be "To Be Decided".',
                variant: 'destructive',
            });
            return;
        }

        // Validate sequence number for UPCOMING status
        if (formData.status === 'UPCOMING' && (!formData.sequence_number || formData.sequence_number < 1 || !Number.isInteger(formData.sequence_number))) {
            toast({
                title: 'Validation Error',
                description: 'Sequence number must be a positive integer (1, 2, 3...)',
                variant: 'destructive',
            });
            return;
        }

        // Check for duplicate sequence number in UPCOMING matches
        if (formData.status === 'UPCOMING') {
            const duplicateMatch = matches.find(
                m => m.status === 'UPCOMING' &&
                    m.sequence_number === formData.sequence_number &&
                    m.id !== editingId
            );
            if (duplicateMatch) {
                toast({
                    title: 'Duplicate Sequence Number',
                    description: `Sequence #${formData.sequence_number} is already used by "${duplicateMatch.match_title}". Please choose a different number.`,
                    variant: 'destructive',
                });
                return;
            }
        }

        // Validate completed status requires result
        if (formData.status === 'COMPLETED' && !formData.result_type) {
            toast({
                title: 'Validation Error',
                description: 'Please select a result type for completed matches',
                variant: 'destructive',
            });
            return;
        }

        // Validate WIN result requires winner
        if (formData.result_type === 'WIN' && !formData.winner_house_key) {
            toast({
                title: 'Validation Error',
                description: 'Please select a winner for WIN result',
                variant: 'destructive',
            });
            return;
        }

        // Show confirmation for LIVE status
        if (formData.status === 'LIVE' && !editingId) {
            setPendingLiveData(formData);
            setShowLiveConfirm(true);
            return;
        }

        // Check if changing to LIVE from non-LIVE
        if (formData.status === 'LIVE' && editingId) {
            const existingMatch = matches.find(m => m.id === editingId);
            if (existingMatch && existingMatch.status !== 'LIVE') {
                setPendingLiveData(formData);
                setShowLiveConfirm(true);
                return;
            }
        }

        await saveMatch(formData);
    };

    const saveMatch = async (data: typeof formData) => {
        // Set completed_at when status is COMPLETED (new completion or re-edit)
        const isCompleting = data.status === 'COMPLETED';

        const matchData = {
            sport: data.sport,
            match_title: data.match_title,
            house_a_key: data.house_a_key,
            house_b_key: data.house_b_key,
            organizer_house_key: data.organizer_house_key,
            status: data.status,
            result_type: data.status === 'COMPLETED' ? data.result_type : null,
            winner_house_key: data.result_type === 'WIN' ? data.winner_house_key : null,
            sequence_number: data.sequence_number,
            // Set completed_at to now() when marking as COMPLETED (or re-editing a completed match)
            completed_at: isCompleting ? new Date().toISOString() : null,
        };

        if (editingId) {
            const oldMatch = matches.find(m => m.id === editingId);
            const { error } = await supabase
                .from('arena_matches')
                .update(matchData)
                .eq('id', editingId);

            if (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to update match',
                    variant: 'destructive',
                });
            } else {
                await logEntityChange('update', 'arena_match', data.match_title, oldMatch, matchData);
                toast({
                    title: 'Success',
                    description: 'Match updated successfully',
                });
                fetchMatches();
                resetForm();
            }
        } else {
            const { error } = await supabase
                .from('arena_matches')
                .insert([matchData]);

            if (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to create match',
                    variant: 'destructive',
                });
            } else {
                await logEntityChange('insert', 'arena_match', data.match_title, null, matchData);
                toast({
                    title: 'Success',
                    description: 'Match created successfully',
                });
                fetchMatches();
                resetForm();
            }
        }
    };

    const handleEdit = (match: ArenaMatch) => {
        setFormData({
            sport: match.sport,
            match_title: match.match_title,
            house_a_key: match.house_a_key,
            house_b_key: match.house_b_key,
            organizer_house_key: match.organizer_house_key,
            status: match.status,
            result_type: match.result_type,
            winner_house_key: match.winner_house_key,
            sequence_number: match.sequence_number || 1,
        });
        setEditingId(match.id);
        setIsFormOpen(true);

        // Scroll to edit form after state updates
        setTimeout(() => {
            editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteTarget(id);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        const deletedMatch = matches.find(m => m.id === deleteTarget);
        setIsDeleting(true);
        const { error } = await supabase
            .from('arena_matches')
            .delete()
            .eq('id', deleteTarget);

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete match',
                variant: 'destructive',
            });
        } else {
            await logEntityChange('delete', 'arena_match', deletedMatch?.match_title || 'unknown', deletedMatch, null);
            toast({
                title: 'Success',
                description: 'Match deleted successfully',
            });
            fetchMatches();
        }
        setIsDeleting(false);
        setDeleteTarget(null);
    };

    const confirmLive = async () => {
        if (pendingLiveData) {
            await saveMatch(pendingLiveData);
            setPendingLiveData(null);
        }
        setShowLiveConfirm(false);
    };

    // Get unique sports for filter
    const uniqueSports = useMemo(() => {
        const sports = new Set<string>();
        matches.forEach(m => m.sport && sports.add(m.sport));
        return Array.from(sports).sort();
    }, [matches]);

    // Calculate match counts per sport
    const matchCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        matches.forEach(m => {
            if (m.sport) {
                counts[m.sport] = (counts[m.sport] || 0) + 1;
            }
        });
        return counts;
    }, [matches]);

    // Filter matches based on selected filter
    const filteredMatches = useMemo(() => {
        if (!selectedFilter) return matches;
        return matches.filter(m => m.sport === selectedFilter);
    }, [matches, selectedFilter]);

    // Group filtered matches by status
    const liveMatches = filteredMatches.filter(m => m.status === 'LIVE');
    const upcomingMatches = filteredMatches.filter(m => m.status === 'UPCOMING').sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
    const completedMatches = filteredMatches.filter(m => m.status === 'COMPLETED');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Swords className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Arena Matches</h2>
                </div>
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Match
                </Button>
            </div>

            {/* Visibility Toggle */}
            <Card className="bg-muted/30">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {arenaVisible ? <Eye className="h-5 w-5 text-green-500" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
                            <div>
                                <p className="font-medium">Arena Tab Visibility</p>
                                <p className="text-sm text-muted-foreground">
                                    {arenaVisible ? 'Arena tab is visible on public navigation' : 'Arena tab is hidden from public navigation'}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={arenaVisible}
                            onCheckedChange={toggleVisibility}
                            disabled={visibilityLoading}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Sport Filters */}
            {!loading && matches.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Filter by Sport</h3>
                    <ArenaFilters
                        value={selectedFilter}
                        onChange={setSelectedFilter}
                        sports={uniqueSports}
                        matchCounts={matchCounts}
                        totalCount={matches.length}
                        showCounts={true}
                    />
                </div>
            )}

            {/* Form */}
            <div ref={editFormRef}>
                {isFormOpen && (
                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle>{editingId ? 'Edit Match' : 'Create New Match'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Sport & Match Title */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sport">Sport *</Label>
                                    <Input
                                        id="sport"
                                        placeholder="e.g. Cricket, Football"
                                        value={formData.sport}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="match_title">Match Title *</Label>
                                    <Input
                                        id="match_title"
                                        placeholder="e.g. 1st Match, Semi Final"
                                        value={formData.match_title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, match_title: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Houses */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>House A *</Label>
                                    <Select
                                        value={formData.house_a_key}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, house_a_key: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select House A" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {housesWithTBD.map(house => (
                                                <SelectItem key={house} value={house}>
                                                    {houseLabels[house]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>House B *</Label>
                                    <Select
                                        value={formData.house_b_key}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, house_b_key: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select House B" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {housesWithTBD.map(house => (
                                                <SelectItem key={house} value={house}>
                                                    {houseLabels[house]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Organizer House *</Label>
                                    <Select
                                        value={formData.organizer_house_key}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, organizer_house_key: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Organizer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {houses.map(house => (
                                                <SelectItem key={house} value={house}>
                                                    {houseLabels[house]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Status *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val: MatchStatus) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                status: val,
                                                // Reset result fields if not completed
                                                result_type: val === 'COMPLETED' ? prev.result_type : null,
                                                winner_house_key: val === 'COMPLETED' ? prev.winner_house_key : null,
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UPCOMING">⏳ UPCOMING</SelectItem>
                                            <SelectItem value="LIVE">🔴 LIVE</SelectItem>
                                            <SelectItem value="COMPLETED">🏆 COMPLETED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.status === 'UPCOMING' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="sequence_number">Sequence # *</Label>
                                        <Input
                                            id="sequence_number"
                                            type="number"
                                            min={1}
                                            step={1}
                                            placeholder="1, 2, 3..."
                                            value={formData.sequence_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sequence_number: parseInt(e.target.value) || 1 }))}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <p className="text-xs text-muted-foreground">Lower number = shown first</p>
                                    </div>
                                )}
                            </div>

                            {/* Result section (only for COMPLETED) */}
                            {formData.status === 'COMPLETED' && (
                                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        Match Result
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Result Type *</Label>
                                            <Select
                                                value={formData.result_type || ''}
                                                onValueChange={(val: ResultType) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        result_type: val,
                                                        winner_house_key: val !== 'WIN' ? null : prev.winner_house_key,
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select result" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="WIN">🏆 WIN</SelectItem>
                                                    <SelectItem value="DRAW">🤝 DRAW</SelectItem>
                                                    <SelectItem value="NO_RESULT">❌ NO RESULT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {formData.result_type === 'WIN' && (
                                            <div className="space-y-2">
                                                <Label>Winner House *</Label>
                                                <Select
                                                    value={formData.winner_house_key || ''}
                                                    onValueChange={(val) => setFormData(prev => ({ ...prev, winner_house_key: val }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select winner" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {formData.house_a_key && (
                                                            <SelectItem value={formData.house_a_key}>
                                                                {houseLabels[formData.house_a_key]} (House A)
                                                            </SelectItem>
                                                        )}
                                                        {formData.house_b_key && (
                                                            <SelectItem value={formData.house_b_key}>
                                                                {houseLabels[formData.house_b_key]} (House B)
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={resetForm}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingId ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-8 text-muted-foreground">
                    Loading matches...
                </div>
            )}

            {/* Match Lists */}
            {!loading && (
                <div className="space-y-6">
                    {/* LIVE Matches */}
                    <MatchSection
                        title="🔴 LIVE"
                        matches={liveMatches}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        emptyMessage="No live matches"
                    />

                    {/* UPCOMING Matches */}
                    <MatchSection
                        title="⏳ UPCOMING"
                        matches={upcomingMatches}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        emptyMessage="No upcoming matches"
                    />

                    {/* COMPLETED Matches */}
                    <MatchSection
                        title="🏆 COMPLETED"
                        matches={completedMatches}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        emptyMessage="No completed matches"
                    />
                </div>
            )}

            {/* LIVE Confirmation Dialog */}
            <AlertDialog open={showLiveConfirm} onOpenChange={setShowLiveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Set Match as LIVE?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will immediately display the match as LIVE on the public Arena page.
                            Make sure this match is actually happening now.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingLiveData(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmLive} className="bg-red-500 hover:bg-red-600">
                            Yes, Set as LIVE
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName="this match"
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </div>
    );
};

// Match Section Component
interface MatchSectionProps {
    title: string;
    matches: ArenaMatch[];
    onEdit: (match: ArenaMatch) => void;
    onDelete: (id: string) => void;
    emptyMessage: string;
}

const MatchSection: React.FC<MatchSectionProps> = ({ title, matches, onEdit, onDelete, emptyMessage }) => {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold">{title} ({matches.length})</h3>
            {matches.length === 0 ? (
                <p className="text-muted-foreground text-sm italic py-2">{emptyMessage}</p>
            ) : (
                <div className="space-y-2">
                    {matches.map(match => (
                        <MatchRow key={match.id} match={match} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Match Row Component
interface MatchRowProps {
    match: ArenaMatch;
    onEdit: (match: ArenaMatch) => void;
    onDelete: (id: string) => void;
}

const MatchRow: React.FC<MatchRowProps> = ({ match, onEdit, onDelete }) => {
    return (
        <div className="p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors space-y-3">
            {/* Top Row: Status & Sequence Badges */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium shrink-0',
                    statusColors[match.status]
                )}>
                    {match.status}
                </span>
                {match.status === 'UPCOMING' && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shrink-0">
                        #{match.sequence_number || 0}
                    </span>
                )}
            </div>

            {/* Main Content: Sport, Title, Teams */}
            <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-base">{match.sport}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground text-sm">{match.match_title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="font-medium capitalize">
                        {houseLabels[match.house_a_key]}
                        {match.house_a_key === match.house_b_key && match.house_a_key !== 'tbd' && ' A'}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium capitalize">
                        {houseLabels[match.house_b_key]}
                        {match.house_a_key === match.house_b_key && match.house_b_key !== 'tbd' && ' B'}
                    </span>
                </div>
                {match.status === 'COMPLETED' && match.result_type && (
                    <p className="text-sm text-muted-foreground">
                        {match.result_type === 'WIN' && match.winner_house_key
                            ? `Winner: ${houseLabels[match.winner_house_key]}`
                            : match.result_type === 'DRAW'
                                ? 'Draw'
                                : 'No Result'}
                    </p>
                )}
            </div>

            {/* Footer Row: Organizer & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                    Organized by: <span className="capitalize font-medium">{houseLabels[match.organizer_house_key]}</span>
                </span>
                <div className="flex items-center gap-3">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(match)}
                        className="h-11 w-11 shrink-0"
                    >
                        <Edit2 className="h-5 w-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => onDelete(match.id)}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ArenaManager;
