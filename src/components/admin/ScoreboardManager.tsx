/**
 * Scoreboard Manager Component
 * 
 * Update house scores and add score events.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Trophy, Calendar, Save } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { houses } from '@/data/houses';
import { format } from 'date-fns';
import { useAppSetting } from '@/hooks/useAppSettings';
import { logEntityChange } from '@/lib/adminActivityLog';

interface ScoreboardEntry {
  id: string;
  house_slug: string;
  house_name: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

interface ScoreEvent {
  id: string;
  house_slug: string;
  event_name: string;
  points: number;
  event_date: string;
  day_label: string | null;
  created_at: string;
}

const ScoreboardManager: React.FC = () => {
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [events, setEvents] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // New event form
  const [selectedHouse, setSelectedHouse] = useState(houses[0].slug);
  const [eventName, setEventName] = useState('');
  const [points, setPoints] = useState('');
  const [dayLabel, setDayLabel] = useState('');
  const [adding, setAdding] = useState(false);

  // Event year settings
  const { value: eventYear, update: updateEventYear, loading: yearLoading } = useAppSetting('event_year', '2024-25');
  const [editingYear, setEditingYear] = useState('');
  const [savingYear, setSavingYear] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<ScoreEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize editing year when eventYear loads
  useEffect(() => {
    if (eventYear) {
      setEditingYear(eventYear);
    }
  }, [eventYear]);

  const { toast } = useToast();

  const fetchData = async () => {
    const [scoreRes, eventsRes] = await Promise.all([
      supabase.from('scoreboard').select('id, house_slug, house_name, points, wins, losses, draws').order('points', { ascending: false }),
      supabase.from('score_events').select('id, house_slug, event_name, points, event_date, day_label, created_at').order('created_at', { ascending: false }).limit(20),
    ]);

    if (scoreRes.error) {
      toast({ title: 'Error', description: scoreRes.error.message, variant: 'destructive' });
    } else {
      setScoreboard(scoreRes.data || []);
    }

    if (eventsRes.error) {
      toast({ title: 'Error', description: eventsRes.error.message, variant: 'destructive' });
    } else {
      setEvents(eventsRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEvent = async () => {
    const trimmedName = eventName.trim();
    const pointsNum = parseInt(points, 10);

    if (!trimmedName) {
      toast({ title: 'Error', description: 'Please enter event name', variant: 'destructive' });
      return;
    }

    if (isNaN(pointsNum)) {
      toast({ title: 'Error', description: 'Please enter valid points', variant: 'destructive' });
      return;
    }

    setAdding(true);

    try {
      // Add score event
      const { error: eventError } = await supabase.from('score_events').insert({
        house_slug: selectedHouse,
        event_name: trimmedName,
        points: pointsNum,
        day_label: dayLabel.trim() || null,
      });

      if (eventError) throw eventError;

      // Update scoreboard points
      const currentEntry = scoreboard.find(s => s.house_slug === selectedHouse);
      if (currentEntry) {
        const newPoints = currentEntry.points + pointsNum;
        const updates: Partial<ScoreboardEntry> = { points: newPoints };

        // Update wins/losses based on points
        if (pointsNum > 0) {
          updates.wins = currentEntry.wins + 1;
        } else if (pointsNum < 0) {
          updates.losses = currentEntry.losses + 1;
        }

        const { error: updateError } = await supabase
          .from('scoreboard')
          .update(updates)
          .eq('id', currentEntry.id);

        if (updateError) throw updateError;
      }

      toast({ title: 'Success', description: 'Score event added!' });
      setEventName('');
      setPoints('');
      setDayLabel('');
      setDayLabel('');
      fetchData();

      await logEntityChange(
        'insert',
        'sport_event',
        trimmedName,
        null,
        {
          house_slug: selectedHouse,
          event_name: trimmedName,
          points: pointsNum,
          day_label: dayLabel.trim() || null
        },
        houses.find(h => h.slug === selectedHouse)?.name
      );

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteClick = (event: ScoreEvent) => {
    setDeleteTarget(event);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // Revert points
      const currentEntry = scoreboard.find(s => s.house_slug === deleteTarget.house_slug);
      if (currentEntry) {
        const newPoints = currentEntry.points - deleteTarget.points;
        const updates: Partial<ScoreboardEntry> = { points: newPoints };

        if (deleteTarget.points > 0) {
          updates.wins = Math.max(0, currentEntry.wins - 1);
        } else if (deleteTarget.points < 0) {
          updates.losses = Math.max(0, currentEntry.losses - 1);
        }

        await supabase.from('scoreboard').update(updates).eq('id', currentEntry.id);
      }

      await supabase.from('score_events').delete().eq('id', deleteTarget.id);

      toast({ title: 'Deleted', description: 'Event removed and points reverted' });
      toast({ title: 'Deleted', description: 'Event removed and points reverted' });
      fetchData();

      await logEntityChange(
        'delete',
        'sport_event',
        deleteTarget.event_name,
        deleteTarget,
        null,
        houses.find(h => h.slug === deleteTarget.house_slug)?.name
      );
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSaveYear = async () => {
    if (!editingYear.trim()) {
      toast({ title: 'Error', description: 'Please enter an event year', variant: 'destructive' });
      return;
    }

    setSavingYear(true);
    try {
      const success = await updateEventYear(editingYear.trim());
      if (success) {
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

  return (
    <div className="space-y-6">
      {/* Event Year Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Year Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Current Event Year</Label>
              <Input
                value={editingYear}
                onChange={(e) => setEditingYear(e.target.value)}
                placeholder="e.g., 2024-25"
                disabled={yearLoading}
              />
              <p className="text-xs text-muted-foreground">
                This year is displayed in the detailed scoreboard title
              </p>
            </div>
            <Button
              onClick={handleSaveYear}
              disabled={savingYear || yearLoading || editingYear === eventYear}
            >
              <Save className="h-4 w-4 mr-2" />
              {savingYear ? 'Saving...' : 'Save Year'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Score Event */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Score Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>House</Label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.slug} value={house.slug}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Badminton Girls"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Points (+/-)</Label>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="e.g., 30 or -10"
              />
            </div>
            <div className="space-y-2">
              <Label>Day Label (optional)</Label>
              <Input
                value={dayLabel}
                onChange={(e) => setDayLabel(e.target.value)}
                placeholder="e.g., Day 3 of Sports"
              />
            </div>
          </div>

          <Button onClick={handleAddEvent} disabled={adding}>
            <Plus className="h-4 w-4 mr-2" />
            {adding ? 'Adding...' : 'Add Event'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Standings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Current Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-2">
              {scoreboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{entry.house_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {entry.wins}W / {entry.losses}L / {entry.draws}D
                    </span>
                    <span className="font-bold text-primary">{entry.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No events yet</div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.event_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                        {houses.find(h => h.slug === event.house_slug)?.name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                      {event.day_label && ` • ${event.day_label}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${event.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {event.points >= 0 ? '+' : ''}{event.points}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleDeleteClick(event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName="this score event"
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ScoreboardManager;
