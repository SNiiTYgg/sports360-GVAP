/**
 * Hook for fetching and updating app settings from Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppSetting {
    id: string;
    key: string;
    value: string;
    created_at: string;
    updated_at: string;
}

/**
 * Fetch a single setting by key
 */
export const getAppSetting = async (key: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when row doesn't exist

    if (error) {
        console.error('Error fetching setting:', error);
        return null;
    }

    return data?.value ?? null;
};

/**
 * Update or create a setting value (upsert)
 */
export const updateAppSetting = async (key: string, value: string): Promise<boolean> => {
    const { error } = await supabase
        .from('app_settings')
        .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
        );

    if (error) {
        console.error('Error updating setting:', error);
        return false;
    }

    return true;
};

/**
 * Hook to use a specific app setting
 */
export const useAppSetting = (key: string, defaultValue: string = '') => {
    const [value, setValue] = useState<string>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSetting = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAppSetting(key);
            if (result !== null) {
                setValue(result);
            }
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [key]);

    useEffect(() => {
        fetchSetting();
    }, [fetchSetting]);

    const update = useCallback(async (newValue: string): Promise<boolean> => {
        const success = await updateAppSetting(key, newValue);
        if (success) {
            setValue(newValue);
        }
        return success;
    }, [key]);

    return { value, loading, error, update, refetch: fetchSetting };
};

/**
 * Hook to fetch multiple app settings in a single query (batch)
 * More efficient than multiple useAppSetting calls
 */
export const useAppSettings = (keys: string[], defaultValues: Record<string, string> = {}) => {
    const [values, setValues] = useState<Record<string, string>>(defaultValues);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('app_settings')
                .select('key, value')
                .in('key', keys);

            if (fetchError) throw fetchError;

            // Build values map from returned data
            const result: Record<string, string> = { ...defaultValues };
            (data || []).forEach(item => {
                result[item.key] = item.value;
            });

            setValues(result);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [keys.join(',')]); // Use joined keys as dependency

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return { values, loading, error, refetch: fetchSettings };
};

export default useAppSetting;
