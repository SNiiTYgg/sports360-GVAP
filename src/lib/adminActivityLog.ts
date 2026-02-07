/**
 * Admin Activity Log Utility
 * 
 * Centralized logging for all admin actions.
 * Logs to the existing audit_logs table.
 * 
 * Rules:
 * - Only logs when old_value !== new_value
 * - Booleans logged as true/false
 * - Null logged as null
 * - Timestamp generated server-side
 */

import { supabase } from '@/integrations/supabase/client';

export type ActionType = 'insert' | 'update' | 'delete';
export type EntityType =
    | 'toggle'
    | 'app_settings'
    | 'admin_role'
    | 'sport_event'
    | 'arena_match'
    | 'common_match'
    | 'poll'
    | 'house_media'
    | 'sports_settings'
    | 'house'
    | 'auth';

export type SourceType = 'admin-panel' | 'dashboard' | 'settings-page';

export interface LogAdminActionParams {
    action: ActionType;
    entityType: EntityType;
    featureName: string;        // Exact feature/setting name (e.g., 'live_voting', 'event_year')
    oldValue: any;              // Previous value (mandatory for updates)
    newValue: any;              // New value
    houseName?: string | null;  // Optional house context
    source?: SourceType;        // Where action was performed
}

/**
 * Log an admin action to audit_logs table
 * Skips logging if oldValue === newValue (no actual change)
 */
export async function logAdminAction({
    action,
    entityType,
    featureName,
    oldValue,
    newValue,
    houseName = null,
    source = 'admin-panel',
}: LogAdminActionParams): Promise<boolean> {
    try {
        // Skip logging if no actual change (for updates)
        if (action === 'update' && JSON.stringify(oldValue) === JSON.stringify(newValue)) {
            return true;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Build log entry
        const logEntry = {
            actor_user_id: user?.id || null,
            actor_email: user?.email || 'unknown',
            action,
            entity_type: entityType,
            entity_id: featureName,
            house_name: houseName,
            old_data: {
                value: oldValue,
                source,
            },
            new_data: {
                value: newValue,
                source,
            },
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert(logEntry);

        if (error) {
            console.error('[AdminLog] Failed to log action:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[AdminLog] Error logging action:', error);
        return false;
    }
}

/**
 * Helper for logging toggle changes
 */
export async function logToggleChange(
    featureName: string,
    oldValue: boolean,
    newValue: boolean,
    source: SourceType = 'admin-panel'
): Promise<boolean> {
    return logAdminAction({
        action: 'update',
        entityType: 'toggle',
        featureName,
        oldValue,
        newValue,
        source,
    });
}

/**
 * Helper for logging setting changes
 */
export async function logSettingChange(
    featureName: string,
    oldValue: string | number | null,
    newValue: string | number | null,
    source: SourceType = 'admin-panel'
): Promise<boolean> {
    return logAdminAction({
        action: 'update',
        entityType: 'app_settings',
        featureName,
        oldValue,
        newValue,
        source,
    });
}

/**
 * Helper for logging CRUD operations on entities
 */
export async function logEntityChange(
    action: ActionType,
    entityType: EntityType,
    entityName: string,
    oldData: any,
    newData: any,
    houseName?: string | null
): Promise<boolean> {
    return logAdminAction({
        action,
        entityType,
        featureName: entityName,
        oldValue: oldData,
        newValue: newData,
        houseName,
        source: 'admin-panel',
    });
}
