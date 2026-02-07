/**
 * Admin Role Context
 * 
 * Provides role-based access control for admin panel.
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

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Role types
export type AdminRole = 'super_admin' | 'house_social' | 'sports_coordinator' | 'sports_admin' | 'event_admin' | 'no_access';

// Tab types for permission checking
export type AdminTab = 'media' | 'houses' | 'arena' | 'allhouse' | 'sports' | 'winner' | 'polls' | 'logs' | 'admins';

// Role to allowed tabs mapping
const ROLE_TAB_PERMISSIONS: Record<Exclude<AdminRole, 'no_access'>, AdminTab[]> = {
    super_admin: ['media', 'houses', 'arena', 'allhouse', 'sports', 'winner', 'polls', 'logs', 'admins'],
    house_social: ['media', 'houses'],
    sports_coordinator: ['arena'],
    sports_admin: ['arena', 'allhouse', 'sports'],
    event_admin: ['polls'],
};

interface AdminRoleContextValue {
    role: AdminRole | null;
    house: string | null;
    loading: boolean;
    allowedTabs: AdminTab[];
    canAccessTab: (tab: AdminTab) => boolean;
    isSuperAdmin: boolean;
    isHouseSocial: boolean;
}

const AdminRoleContext = createContext<AdminRoleContextValue | null>(null);

interface AdminRoleProviderProps {
    children: ReactNode;
}

export function AdminRoleProvider({ children }: AdminRoleProviderProps) {
    const [role, setRole] = useState<AdminRole | null>(null);
    const [house, setHouse] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadRole() {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();

            if (!session || !active) {
                if (active) {
                    setRole('no_access');
                    setHouse(null);
                    setLoading(false);
                }
                return;
            }


            const { data, error } = await (supabase as any)
                .from('admin_roles')
                .select('role, house_name')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (!active) return;

            if (error || !data) {
                setRole('no_access');
                setHouse(null);
            } else {
                setRole(data.role as AdminRole);
                setHouse(data.house_name);
            }

            setLoading(false);
        }

        loadRole();

        const { data: sub } = supabase.auth.onAuthStateChange(() => {
            loadRole();
        });

        return () => {
            active = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    // Calculate allowed tabs based on role
    const allowedTabs: AdminTab[] = role && role !== 'no_access'
        ? ROLE_TAB_PERMISSIONS[role] || []
        : [];

    // Check if user can access a specific tab
    const canAccessTab = (tab: AdminTab): boolean => {
        return allowedTabs.includes(tab);
    };

    const value: AdminRoleContextValue = {
        role,
        house,
        loading,
        allowedTabs,
        canAccessTab,
        isSuperAdmin: role === 'super_admin',
        isHouseSocial: role === 'house_social',
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
