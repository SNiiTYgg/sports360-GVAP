/**
 * usePersistentTab Hook
 * 
 * A reusable hook for URL-based tab state persistence.
 * Ensures users stay on the same tab after page reload.
 * 
 * Features:
 * - Reads tab from URL query parameter on mount
 * - Updates URL when tab changes (without page reload)
 * - Validates tab against allowed values
 * - Falls back to default if invalid or missing
 * - Type-safe with generic tab type
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Hook for managing persistent tab state via URL
 * 
 * @param defaultTab - The default tab to use if none in URL or invalid
 * @param validTabs - Array of valid tab values for validation
 * @param paramName - URL query parameter name (default: 'tab')
 * @returns [activeTab, setActiveTab] - Current tab and setter function
 * 
 * @example
 * const validTabs = ['home', 'settings', 'profile'] as const;
 * const [activeTab, setActiveTab] = usePersistentTab('home', validTabs);
 */
export function usePersistentTab<T extends string>(
    defaultTab: T,
    validTabs: readonly T[],
    paramName: string = 'tab'
): [T, (tab: T) => void] {
    const [searchParams, setSearchParams] = useSearchParams();

    // Get current tab from URL, validate against allowed tabs
    const activeTab = useMemo(() => {
        const urlTab = searchParams.get(paramName);

        // If URL has a valid tab, use it
        if (urlTab && validTabs.includes(urlTab as T)) {
            return urlTab as T;
        }

        // Otherwise, return default (don't set URL to avoid redirect loops)
        return defaultTab;
    }, [searchParams, paramName, validTabs, defaultTab]);

    // Update URL when tab changes
    const setActiveTab = useCallback((newTab: T) => {
        // Validate the new tab
        if (!validTabs.includes(newTab)) {
            console.warn(`Invalid tab "${newTab}". Valid tabs:`, validTabs);
            return;
        }

        // Update URL with new tab
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);

            // If it's the default tab, remove param for cleaner URL
            if (newTab === defaultTab) {
                newParams.delete(paramName);
            } else {
                newParams.set(paramName, newTab);
            }

            return newParams;
        }, { replace: true }); // Replace history entry to avoid back-button spam
    }, [setSearchParams, paramName, validTabs, defaultTab]);

    return [activeTab, setActiveTab];
}

export default usePersistentTab;
