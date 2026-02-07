/**
 * Common Match Manager Component
 * 
 * Admin panel for managing Common Matches (All 5 Houses Events like Relay).
 * Allows creating, editing, and deleting common matches with status control.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Users, AlertTriangle } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { cn } from '@/lib/utils';
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
import { logEntityChange } from '@/lib/adminActivityLog';

type CommonMatch = Tables<'common_matches'>;
type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';
type ResultType = 'POSITIONS' | 'DRAW' | 'NO_RESULT';

const houses = ['aakash', 'agni', 'jal', 'prithvi', 'vayu'] as const;

const houseLabels: Record<string, string> = {
    aakash: 'Aakash',
    agni: 'Agni',
    jal: 'Jal',
    prithvi: 'Prithvi',
    vayu: 'Vayu',
    // Non-house organizers for Common events
    council: 'Council',
    gvap: 'GVAP',
};

const statusColors: Record<MatchStatus, string> = {
    LIVE: 'bg-red-500 text-white',
    UPCOMING: 'bg-amber-500 text-white',
    COMPLETED: 'bg-green-500 text-white',
};

const CommonMatchManager: React.FC = () => {
    const { toast } = useToast();
    const [matches, setMatches] = useState<CommonMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showLiveConfirm, setShowLiveConfirm] = useState(false);
    const [pendingLiveData, setPendingLiveData] = useState<any>(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        sport: '',
        match_title: '',
        organizer_house_key: '' as string,
        status: 'UPCOMING' as MatchStatus,
        result_type: null as ResultType | null,
        winner_house_key: null as string | null,
        runner_up_house_key: null as string | null,
        sequence_number: 1,
    });

    // Fetch matches on mount
    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('common_matches')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch common matches',
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
            organizer_house_key: '',
            status: 'UPCOMING',
            result_type: null,
            winner_house_key: null,
            runner_up_house_key: null,
            sequence_number: 1,
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.sport || !formData.match_title || !formData.organizer_house_key) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields',
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

        // Validate POSITIONS result requires winner
        if (formData.result_type === 'POSITIONS' && !formData.winner_house_key) {
            toast({
                title: 'Validation Error',
                description: 'Please select a winner for POSITIONS result',
                variant: 'destructive',
            });
            return;
        }

        // NOTE: For Common events, winner and runner-up CAN be the same house
        // (for aggregate/points-based events where one house dominates)
        // No validation needed here - same house is allowed

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
            organizer_house_key: data.organizer_house_key,
            status: data.status,
            result_type: data.status === 'COMPLETED' ? data.result_type : null,
            winner_house_key: data.result_type === 'POSITIONS' ? data.winner_house_key : null,
            runner_up_house_key: data.result_type === 'POSITIONS' ? data.runner_up_house_key : null,
            sequence_number: data.sequence_number,
            // Set completed_at to now() when marking as COMPLETED (or re-editing a completed match)
            completed_at: isCompleting ? new Date().toISOString() : null,
        };

        if (editingId) {
            const oldMatch = matches.find(m => m.id === editingId);
            const { error } = await supabase
                .from('common_matches')
                .update(matchData)
                .eq('id', editingId);

            if (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to update match',
                    variant: 'destructive',
                });
            } else {
                await logEntityChange('update', 'common_match', data.match_title, oldMatch, matchData);
                toast({
                    title: 'Success',
                    description: 'Match updated successfully',
                });
                fetchMatches();
                resetForm();
            }
        } else {
            const { error } = await supabase
                .from('common_matches')
                .insert([matchData]);

            if (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to create match',
                    variant: 'destructive',
                });
            } else {
                await logEntityChange('insert', 'common_match', data.match_title, null, matchData);
                toast({
                    title: 'Success',
                    description: 'Match created successfully',
                });
                fetchMatches();
                resetForm();
            }
        }
    };

    const handleEdit = (match: CommonMatch) => {
        setFormData({
            sport: match.sport,
            match_title: match.match_title,
            organizer_house_key: match.organizer_house_key,
            status: match.status,
            result_type: match.result_type,
            winner_house_key: match.winner_house_key,
            runner_up_house_key: match.runner_up_house_key,
            sequence_number: match.sequence_number || 1,
        });
        setEditingId(match.id);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteTarget(id);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        const deletedMatch = matches.find(m => m.id === deleteTarget);
        setIsDeleting(true);
        const { error } = await supabase
            .from('common_matches')
            .delete()
            .eq('id', deleteTarget);

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete match',
                variant: 'destructive',
            });
        } else {
            await logEntityChange('delete', 'common_match', deletedMatch?.match_title || 'unknown', deletedMatch, null);
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

    // Group matches by status
    const liveMatches = matches.filter(m => m.status === 'LIVE');
    const upcomingMatches = matches.filter(m => m.status === 'UPCOMING').sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
    const completedMatches = matches.filter(m => m.status === 'COMPLETED');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">All House Events</h2>
                </div>
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Event
                </Button>
            </div>

            {/* Info Banner */}
            <div className="bg-muted/50 border rounded-lg p-4 text-sm text-muted-foreground">
                <strong>All House Events:</strong> For games like Relay, March Past where all 5 houses compete together.
                You can set Winner (1st place) and Runner-up (2nd place) when marking as completed.
            </div>

            {/* Form */}
            {isFormOpen && (
                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Event' : 'Create New All-House Event'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Sport & Match Title */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sport">Sport/Event *</Label>
                                <Input
                                    id="sport"
                                    placeholder="e.g. Relay, March Past, Tug of War"
                                    value={formData.sport}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="match_title">Event Title *</Label>
                                <Input
                                    id="match_title"
                                    placeholder="e.g. 4x100m Relay Final"
                                    value={formData.match_title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, match_title: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Organizer & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Organizer *</Label>
                                <Select
                                    value={formData.organizer_house_key}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, organizer_house_key: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Organizer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Houses */}
                                        {houses.map(house => (
                                            <SelectItem key={house} value={house}>
                                                {houseLabels[house]}
                                            </SelectItem>
                                        ))}
                                        {/* Separator */}
                                        <div className="my-1 border-t border-border" />
                                        {/* Non-house organizers */}
                                        <SelectItem value="council">🏛️ Council</SelectItem>
                                        <SelectItem value="gvap">🎓 GVAP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                                            runner_up_house_key: val === 'COMPLETED' ? prev.runner_up_house_key : null,
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
                        </div>

                        {/* Sequence Number (only for UPCOMING) */}
                        {formData.status === 'UPCOMING' && (
                            <div className="space-y-2">
                                <Label htmlFor="sequence_number">Sequence # *</Label>
                                <Input
                                    id="sequence_number"
                                    type="number"
                                    min={1}
                                    step={1}
                                    placeholder="1, 2, 3..."
                                    className="w-32"
                                    value={formData.sequence_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sequence_number: parseInt(e.target.value) || 1 }))}
                                    onFocus={(e) => e.target.select()}
                                />
                                <p className="text-xs text-muted-foreground">Lower number = shown first in public Arena</p>
                            </div>
                        )}

                        {/* Result section (only for COMPLETED) */}
                        {formData.status === 'COMPLETED' && (
                            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Event Result
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Result Type *</Label>
                                        <Select
                                            value={formData.result_type || ''}
                                            onValueChange={(val: ResultType) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    result_type: val,
                                                    winner_house_key: val !== 'POSITIONS' ? null : prev.winner_house_key,
                                                    runner_up_house_key: val !== 'POSITIONS' ? null : prev.runner_up_house_key,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select result" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="POSITIONS">🏆 POSITIONS (Winner/Runner-up)</SelectItem>
                                                <SelectItem value="DRAW">🤝 DRAW</SelectItem>
                                                <SelectItem value="NO_RESULT">❌ NO RESULT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {formData.result_type === 'POSITIONS' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>🥇 Winner (1st Place) *</Label>
                                                <Select
                                                    value={formData.winner_house_key || ''}
                                                    onValueChange={(val) => setFormData(prev => ({ ...prev, winner_house_key: val }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select winner" />
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
                                            <div className="space-y-2">
                                                <Label>🥈 Runner-up (2nd Place)</Label>
                                                <Select
                                                    value={formData.runner_up_house_key || ''}
                                                    onValueChange={(val) => setFormData(prev => ({ ...prev, runner_up_house_key: val }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select runner-up (optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* Allow same house as winner - common events can have same house in both positions */}
                                                        {houses.map(house => (
                                                            <SelectItem key={house} value={house}>
                                                                {houseLabels[house]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
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

            {/* Loading */}
            {loading && (
                <div className="text-center py-8 text-muted-foreground">
                    Loading events...
                </div>
            )}

            {/* Match Lists */}
            {!loading && (
                <div className="space-y-6">
                    {/* LIVE Events */}
                    <MatchSection
                        title="🔴 LIVE"
                        matches={liveMatches}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        emptyMessage="No live events"
                    />

                    {/* UPCOMING Events */}
                    <MatchSection
                        title="⏳ UPCOMING"
                        matches={upcomingMatches}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        emptyMessage="No upcoming events"
                    />

                    {/* COMPLETED Events */}
                    <MatchSection
                        title="🏆 COMPLETED"
                        matches={completedMatches}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        emptyMessage="No completed events"
                    />
                </div>
            )}

            {/* LIVE Confirmation Dialog */}
            <AlertDialog open={showLiveConfirm} onOpenChange={setShowLiveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Set Event as LIVE?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will immediately display the event as LIVE on the public Arena page.
                            Make sure this event is actually happening now.
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
                itemName="this event"
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </div>
    );
};

// Match Section Component
interface MatchSectionProps {
    title: string;
    matches: CommonMatch[];
    onEdit: (match: CommonMatch) => void;
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
    match: CommonMatch;
    onEdit: (match: CommonMatch) => void;
    onDelete: (id: string) => void;
}

const MatchRow: React.FC<MatchRowProps> = ({ match, onEdit, onDelete }) => {
    const getResultDisplay = () => {
        if (!match.result_type) return null;
        if (match.result_type === 'POSITIONS') {
            const parts = [];
            if (match.winner_house_key) parts.push(`🥇 ${houseLabels[match.winner_house_key]}`);
            if (match.runner_up_house_key) parts.push(`🥈 ${houseLabels[match.runner_up_house_key]}`);
            return parts.join(' • ');
        }
        if (match.result_type === 'DRAW') return '🤝 Draw';
        if (match.result_type === 'NO_RESULT') return '❌ No Result';
        return null;
    };

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
                <div className="flex items-center gap-1.5 ml-auto">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">All Houses</span>
                </div>
            </div>

            {/* Main Content: Sport & Title */}
            <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-base">{match.sport}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground text-sm">{match.match_title}</span>
                </div>
                {match.status === 'COMPLETED' && getResultDisplay() && (
                    <p className="text-sm text-muted-foreground">
                        {getResultDisplay()}
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

export default CommonMatchManager;
