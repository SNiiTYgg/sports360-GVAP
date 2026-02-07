/**
 * Admin Manager Component
 * 
 * Super Admin only - Informational panel about admin management.
 * Admin creation and management is done via Supabase Dashboard.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { useAdminRole } from '@/contexts/AdminRoleContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminManager: React.FC = () => {
    const { isSuperAdmin } = useAdminRole();

    // Access denied for non-super-admins
    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                    You do not have access to this section.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Admin Management</h2>
            </div>

            {/* Informational Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Admin Management via Supabase
                    </CardTitle>
                    <CardDescription>
                        All admin accounts are managed directly through the Supabase Dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>How to Manage Admins</AlertTitle>
                        <AlertDescription className="mt-2 space-y-2">
                            <p>To create or manage admin accounts:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                                <li>Go to <strong>Supabase Dashboard</strong> → Authentication → Users</li>
                                <li>Create user with email/password</li>
                                <li>Go to Table Editor → <code className="px-1 py-0.5 bg-muted rounded">admin_roles</code></li>
                                <li>Insert a row with the user's <code className="px-1 py-0.5 bg-muted rounded">user_id</code>, role, and house (if applicable)</li>
                            </ol>
                        </AlertDescription>
                    </Alert>

                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-2">Available Roles:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>super_admin</strong> — Full access to all features</li>
                            <li><strong>house_social</strong> — Media management for a specific house</li>
                            <li><strong>sports_coordinator</strong> — Sports & scoreboard management</li>
                            <li><strong>sports_admin</strong> — Sports admin / council</li>
                            <li><strong>event_admin</strong> — Event management</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminManager;
