/**
 * Admin Role Context
 * 
 * Provides role-based access control for admin panel.
 * Supports MULTIPLE roles per user — tabs are merged from all assigned roles.
 * This provider MUST exist ONCE at the top level and NEVER unmount.
 * 
 * Place in main.tsx:
 * <BrowserRouter>
 *   <AuthProvider>
 *     <AdminRoleProvider>
 *       <App />
 *     </AdminRoleProvider>
 *   </AuthProvider>
 * </BrowserRouter>
 */

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Role types
export type AdminRole = 'super_admin' | 'house_social' | 'sports_coordinator' | 'sports_admin' | 'event_admin' | 'no_access';

// Tab types for permission checking
export type AdminTab = 'media' | 'houses' | 'arena' | 'allhouse' | 'sports' | 'winner' | 'polls' | 'logs';

// Role to allowed tabs mapping
const ROLE_TAB_PERMISSIONS: Record<Exclude<AdminRole, 'no_access'>, AdminTab[]> = {
    super_admin: ['media', 'houses', 'arena', 'allhouse', 'sports', 'winner', 'polls', 'logs'],
    house_social: ['media', 'houses'],
    sports_coordinator: ['arena'],
    sports_admin: ['arena', 'allhouse', 'sports'],
    event_admin: ['polls'],
};

interface AdminRoleContextValue {
    /** Primary role (first found) — kept for backward compatibility */
    role: AdminRole | null;
    /** All roles assigned to this user */
    roles: AdminRole[];
    /** House name (first house_name found across role rows, null for super_admin) */
    house: string | null;
    loading: boolean;
    /** Merged tabs from ALL assigned roles */
    allowedTabs: AdminTab[];
    canAccessTab: (tab: AdminTab) => boolean;
    isSuperAdmin: boolean;
    isHouseSocial: boolean;
}

const AdminRoleContext = createContext<AdminRoleContextValue | null>(null);

interface AdminRoleProviderProps {
    children: ReactNode;
}

// Safety timeout to prevent infinite loading (5 seconds)
const LOADING_TIMEOUT_MS = 5000;

export function AdminRoleProvider({ children }: AdminRoleProviderProps) {
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [house, setHouse] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        let timeoutId: ReturnType<typeof setTimeout>;

        async function fetchRoles(userId: string) {
            const { data, error } = await (supabase as any)
                .from('admin_roles')
                .select('role, house_name')
                .eq('user_id', userId);

            if (!active) return;

            if (error || !data || data.length === 0) {
                setRoles([]);
                setHouse(null);
            } else {
                // Collect all roles
                const userRoles = data.map((row: any) => row.role as AdminRole);
                setRoles(userRoles);

                // Use the first non-null house_name found
                const firstHouse = data.find((row: any) => row.house_name)?.house_name ?? null;
                setHouse(firstHouse);
            }

            setLoading(false);
        }

        async function init() {
            setLoading(true);

            // Safety timeout — if loading takes too long, recover
            timeoutId = setTimeout(() => {
                if (active) {
                    setLoading(false);
                }
            }, LOADING_TIMEOUT_MS);

            const { data: { session } } = await supabase.auth.getSession();

            if (!session || !active) {
                if (active) {
                    setRoles([]);
                    setHouse(null);
                    setLoading(false);
                }
                return;
            }

            fetchRoles(session.user.id);
        }

        init();

        // Listen for auth state changes (handles session expiry / idle)
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setRoles([]);
                setHouse(null);
                setLoading(false);
            } else {
                fetchRoles(session.user.id);
            }
        });

        return () => {
            active = false;
            clearTimeout(timeoutId);
            sub.subscription.unsubscribe();
        };
    }, []);

    // Merge allowed tabs from ALL roles using a Set (no duplicates)
    const allowedTabs: AdminTab[] = useMemo(() => {
        const tabSet = new Set<AdminTab>();
        for (const r of roles) {
            const tabs = ROLE_TAB_PERMISSIONS[r];
            if (tabs) {
                tabs.forEach(tab => tabSet.add(tab));
            }
        }
        return Array.from(tabSet);
    }, [roles]);

    // Check if user can access a specific tab
    const canAccessTab = (tab: AdminTab): boolean => {
        return allowedTabs.includes(tab);
    };

    // Derive boolean helpers from the roles array
    const isSuperAdmin = roles.includes('super_admin');
    const isHouseSocial = roles.includes('house_social');

    const value: AdminRoleContextValue = {
        role: roles.length > 0 ? roles[0] : null,
        roles,
        house,
        loading,
        allowedTabs,
        canAccessTab,
        isSuperAdmin,
        isHouseSocial,
    };

    return (
        <AdminRoleContext.Provider value={value}>
            {children}
        </AdminRoleContext.Provider>
    );
}

export function useAdminRole(): AdminRoleContextValue {
    const context = useContext(AdminRoleContext);
    if (!context) {
        throw new Error('useAdminRole must be used within AdminRoleProvider');
    }
    return context;
}
