/**
 * Poll Manager Component
 * 
 * Create and manage polls with:
 * - Pause/Resume functionality
 * - Permanent poll ending
 * - Vote counts derived from poll_votes table
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, X, Eye, EyeOff, StopCircle, PlayCircle, PauseCircle, Clock } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { logToggleChange, logEntityChange } from '@/lib/adminActivityLog';

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  is_active: boolean;
  show_results: boolean;
  ends_at: string | null;
  created_at: string;
}

const PollManager: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPolls = async () => {
    try {
      // Fetch polls first
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('id, question, options, is_active, show_results, ends_at, created_at')
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      // For each poll, get vote counts using count: 'exact' (no row limit!)
      const parsedPolls: Poll[] = await Promise.all(
        (pollsData || []).map(async (poll) => {
          const options = Array.isArray(poll.options) ? poll.options.map(String) : [];
          const votes: Record<string, number> = {};

          // Get vote count for each option using count: 'exact', head: true
          // This approach has NO row limit and doesn't fetch actual data
          await Promise.all(
            options.map(async (option) => {
              const { count, error: countError } = await supabase
                .from('poll_votes')
                .select('*', { count: 'exact', head: true })
                .eq('poll_id', poll.id)
                .eq('selected_option', option);

              if (countError) {
                console.error(`Error counting votes for ${option}:`, countError);
                votes[option] = 0;
              } else {
                votes[option] = count || 0;
              }
            })
          );

          return {
            id: poll.id,
            question: poll.question,
            is_active: poll.is_active,
            show_results: poll.show_results ?? false,
            ends_at: poll.ends_at,
            created_at: poll.created_at,
            options,
            votes,
          };
        })
      );

      setPolls(parsedPolls);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = async () => {
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map(o => o.trim()).filter(o => o);

    if (!trimmedQuestion) {
      toast({ title: 'Error', description: 'Please enter a question', variant: 'destructive' });
      return;
    }

    if (trimmedOptions.length < 2) {
      toast({ title: 'Error', description: 'Please add at least 2 options', variant: 'destructive' });
      return;
    }

    setCreating(true);

    try {
      const pollData = {
        question: trimmedQuestion,
        options: trimmedOptions,
        votes: {},
        is_active: true,
      };
      const { error } = await supabase.from('polls').insert(pollData);

      if (error) throw error;

      await logEntityChange('insert', 'poll', trimmedQuestion, null, pollData);
      toast({ title: 'Success', description: 'Poll created successfully!' });
      setQuestion('');
      setOptions(['', '']);
      fetchPolls();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (poll: Poll) => {
    // Don't allow toggling if poll has ended permanently
    if (isPollEnded(poll)) {
      toast({
        title: 'Cannot modify',
        description: 'This poll has ended permanently and cannot be resumed',
        variant: 'destructive'
      });
      return;
    }

    const oldValue = poll.is_active;
    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: !poll.is_active })
        .eq('id', poll.id);

      if (error) throw error;

      await logToggleChange(`poll_is_active:${poll.question}`, oldValue, !oldValue);
      toast({
        title: poll.is_active ? 'Poll paused' : 'Poll resumed',
        description: poll.is_active ? 'Voting is temporarily disabled' : 'Voting is now enabled',
      });
      fetchPolls();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleShowResults = async (poll: Poll) => {
    const oldValue = poll.show_results;
    try {
      const { error } = await supabase
        .from('polls')
        .update({ show_results: !poll.show_results })
        .eq('id', poll.id);

      if (error) throw error;
      await logToggleChange(`poll_show_results:${poll.question}`, oldValue, !oldValue);
      toast({
        title: poll.show_results ? 'Results hidden' : 'Results visible',
        description: `Vote counts are now ${poll.show_results ? 'hidden from' : 'visible to'} the public.`
      });
      fetchPolls();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEndPoll = async (poll: Poll) => {
    if (isPollEnded(poll)) return;

    try {
      const { error } = await supabase
        .from('polls')
        .update({ ends_at: new Date().toISOString(), is_active: false })
        .eq('id', poll.id);

      if (error) throw error;

      // Log poll end as distinct action
      await logEntityChange(
        'update',
        'poll',
        `end:${poll.question}`,
        { ends_at: null, is_active: poll.is_active },
        { ends_at: new Date().toISOString(), is_active: false }
      );

      toast({
        title: 'Poll ended',
        description: 'This poll has been permanently ended and cannot be resumed',
      });
      fetchPolls();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    const deletedPoll = polls.find(p => p.id === deleteTarget);
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('polls').delete().eq('id', deleteTarget);
      if (error) throw error;
      await logEntityChange('delete', 'poll', deletedPoll?.question || 'unknown', deletedPoll, null);
      toast({ title: 'Deleted', description: 'Poll removed successfully' });
      fetchPolls();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getTotalVotes = (votes: Record<string, number>) => {
    return Object.values(votes).reduce((sum, v) => sum + v, 0);
  };

  const isPollEnded = (poll: Poll): boolean => {
    return poll.ends_at !== null && new Date(poll.ends_at) <= new Date();
  };

  const getPollStatus = (poll: Poll): { label: string; icon: React.ReactNode; color: string } => {
    if (isPollEnded(poll)) {
      return { label: 'Ended', icon: <StopCircle className="h-3 w-3" />, color: 'text-destructive' };
    }
    if (!poll.is_active) {
      return { label: 'Paused', icon: <PauseCircle className="h-3 w-3" />, color: 'text-yellow-500' };
    }
    return { label: 'Active', icon: <PlayCircle className="h-3 w-3" />, color: 'text-green-500' };
  };

  return (
    <div className="space-y-6">
      {/* Create Poll */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Poll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <Button variant="outline" size="sm" onClick={handleAddOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Poll'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Polls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Polls</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : polls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No polls created yet</div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => {
                const status = getPollStatus(poll);
                const ended = isPollEnded(poll);

                return (
                  <div
                    key={poll.id}
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{poll.question}</h3>
                          <span className={`inline-flex items-center gap-1 text-xs ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {poll.options.map((opt, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                            >
                              {opt}: {poll.votes[opt] || 0}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total votes: {getTotalVotes(poll.votes)}
                          {ended && poll.ends_at && (
                            <span className="ml-2">
                              · Ended: {new Date(poll.ends_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Pause/Resume toggle - disabled for ended polls */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={poll.is_active}
                            onCheckedChange={() => handleToggleActive(poll)}
                            disabled={ended}
                          />
                          <span className={`text-xs ${ended ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                            {poll.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>

                        {/* Show Results toggle */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={poll.show_results}
                            onCheckedChange={() => handleToggleShowResults(poll)}
                          />
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {poll.show_results ? (
                              <><Eye className="h-3 w-3" /> Public</>
                            ) : (
                              <><EyeOff className="h-3 w-3" /> Hidden</>
                            )}
                          </span>
                        </div>

                        {/* End Poll button - only for non-ended polls */}
                        {!ended && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleEndPoll(poll)}
                          >
                            <StopCircle className="h-3 w-3 mr-1" />
                            End Poll
                          </Button>
                        )}

                        {/* Delete button */}
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => handleDeleteClick(poll.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName="this poll"
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default PollManager;
