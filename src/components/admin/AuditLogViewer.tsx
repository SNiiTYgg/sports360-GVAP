/**
 * Audit Log Viewer Component
 * 
 * Displays admin audit logs in a read-only table.
 * Shows: Time, Admin, Action, Entity, House
 * Features: Pagination with "Load More" button
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLog {
    id: string;
    actor_user_id?: string | null;
    actor_email: string | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    house_name: string | null;
    old_data: any;
    new_data: any;
    created_at: string;
}

const PAGE_SIZE = 15; // Load 15 logs at a time

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0); // Track current offset

    // Fetch logs with pagination
    const fetchLogs = async (loadMore = false) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setLogs([]); // Reset when not loading more
            setOffset(0); // Reset offset
        }

        try {
            // Calculate the range for this fetch
            const currentOffset = loadMore ? offset : 0;

            let query = supabase
                .from('audit_logs')
                .select('id, actor_email, action, entity_type, house_name, old_data, new_data, created_at')
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + PAGE_SIZE); // Fetch PAGE_SIZE + 1 to check for more

            if (filter !== 'all') {
                query = query.eq('entity_type', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            const newLogs = data || [];

            // Check if there are more logs (we fetched PAGE_SIZE + 1)
            const hasMoreLogs = newLogs.length > PAGE_SIZE;
            const logsToAdd = hasMoreLogs ? newLogs.slice(0, PAGE_SIZE) : newLogs;

            if (loadMore) {
                setLogs(prev => [...prev, ...logsToAdd]);
            } else {
                setLogs(logsToAdd);
            }

            setHasMore(hasMoreLogs);
            setOffset(currentOffset + logsToAdd.length);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    // Format date to IST
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Format action for display
    const formatAction = (action: string, entityType: string) => {
        const actionMap: Record<string, string> = {
            insert: 'Created',
            update: 'Updated',
            delete: 'Deleted',
        };
        const entityMap: Record<string, string> = {
            poll: 'Poll',
            house_media: 'Media',
            sport_event: 'Sport Event',
            house: 'House',
            app_settings: 'Settings',
            arena_match: 'Arena Match',
            common_match: 'All-House Event',
            toggle: 'Toggle',
            sports_settings: 'Sports Settings',
        };
        return `${actionMap[action] || action} ${entityMap[entityType] || entityType}`;
    };

    // Get action color
    const getActionColor = (action: string) => {
        switch (action) {
            case 'insert':
                return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
            case 'update':
                return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
            case 'delete':
                return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
            default:
                return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Audit Logs
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="poll">Polls</SelectItem>
                                    <SelectItem value="house_media">Media</SelectItem>
                                    <SelectItem value="sport_event">Sports</SelectItem>
                                    <SelectItem value="house">Houses</SelectItem>
                                    <SelectItem value="app_settings">Settings</SelectItem>
                                    <SelectItem value="arena_match">Arena</SelectItem>
                                    <SelectItem value="common_match">All-House</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => fetchLogs(false)} disabled={loading}>
                                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No audit logs yet</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Sr</th>
                                        <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Time (IST)</th>
                                        <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Admin</th>
                                        <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Action</th>
                                        <th className="text-left py-3 px-2 font-semibold text-muted-foreground">House</th>
                                        <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <React.Fragment key={log.id}>
                                            <tr className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-2 text-muted-foreground">{index + 1}</td>
                                                <td className="py-3 px-2 whitespace-nowrap">{formatDate(log.created_at)}</td>
                                                <td className="py-3 px-2">
                                                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                                                        {log.actor_email || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className={cn('text-xs px-2 py-1 rounded font-medium', getActionColor(log.action))}>
                                                        {formatAction(log.action, log.entity_type)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    {log.house_name ? (
                                                        <span className="capitalize">{log.house_name}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                    >
                                                        {expandedId === log.id ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                            {expandedId === log.id && (
                                                <tr className="bg-muted/30">
                                                    <td colSpan={6} className="p-4">
                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            {log.old_data && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Previous Data:</p>
                                                                    <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded-lg overflow-x-auto max-h-48">
                                                                        {JSON.stringify(log.old_data, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {log.new_data && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">New Data:</p>
                                                                    <pre className="text-xs bg-green-50 dark:bg-green-950/30 p-3 rounded-lg overflow-x-auto max-h-48">
                                                                        {JSON.stringify(log.new_data, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Load More Button - always visible */}
                    {!loading && logs.length > 0 && (
                        <div className="flex justify-center mt-4">
                            <Button
                                variant="outline"
                                onClick={() => fetchLogs(true)}
                                disabled={loadingMore || !hasMore}
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : hasMore ? (
                                    <>Load More</>
                                ) : (
                                    <>All Logs Loaded</>
                                )}
                            </Button>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        Showing {logs.length} logs • Read-only
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditLogViewer;
