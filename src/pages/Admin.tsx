/**
 * Admin Dashboard - campus360
 * 
 * Admin panel for managing media, polls, and scoreboard.
 * Role-based access control filters tabs based on user permissions.
 */

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LogOut, Image, BarChart3, Gamepad2, Moon, Sun, Home, FileText, Trophy, Swords, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { usePersistentTab } from '@/hooks/usePersistentTab';
import { useAdminRole, AdminTab } from '@/contexts/AdminRoleContext';
import MediaUpload from '@/components/admin/MediaUpload';
import PollManager from '@/components/admin/PollManager';
import SportsManager from '@/components/admin/SportsManager';
import HouseManager from '@/components/admin/HouseManager';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import WinnerManager from '@/components/admin/WinnerManager';
import ArenaManager from '@/components/admin/ArenaManager';
import CommonMatchManager from '@/components/admin/CommonMatchManager';
import AdminManager from '@/components/admin/AdminManager';
import type { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { logAdminAction } from '@/lib/adminActivityLog';

// Tab configuration with icons
const TAB_CONFIG: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'media', label: 'Media', icon: <Image className="h-4 w-4" /> },
  { id: 'houses', label: 'Houses', icon: <Home className="h-4 w-4" /> },
  { id: 'arena', label: 'Arena', icon: <Swords className="h-4 w-4" /> },
  { id: 'allhouse', label: 'All House', icon: <Users className="h-4 w-4" /> },
  { id: 'sports', label: 'Sports', icon: <Gamepad2 className="h-4 w-4" /> },
  { id: 'winner', label: 'Winner', icon: <Trophy className="h-4 w-4" /> },
  { id: 'polls', label: 'Polls', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'logs', label: 'Logs', icon: <FileText className="h-4 w-4" /> },
  { id: 'admins', label: 'Admins', icon: <Shield className="h-4 w-4" /> },
];

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  // Get user's role and permissions
  const { allowedTabs, loading: roleLoading, house: houseName, canAccessTab } = useAdminRole();

  // Filter tabs based on role permissions
  const visibleTabs = useMemo(() => {
    return TAB_CONFIG.filter(tab => allowedTabs.includes(tab.id));
  }, [allowedTabs]);

  // Get valid tab IDs for persistence
  const validTabIds = useMemo(() => visibleTabs.map(t => t.id), [visibleTabs]);

  // Active tab state - persisted in URL for reload persistence
  // Default to first allowed tab
  const defaultTab = validTabIds[0] || 'media';
  const [activeTab, setActiveTab] = usePersistentTab<AdminTab>(defaultTab, validTabIds as readonly AdminTab[]);

  // Ensure active tab is valid when permissions change
  useEffect(() => {
    if (!roleLoading && validTabIds.length > 0 && !validTabIds.includes(activeTab)) {
      setActiveTab(validTabIds[0]);
    }
  }, [roleLoading, validTabIds, activeTab, setActiveTab]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          navigate('/auth');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    // Log logout before sign out (while user still authenticated)
    if (user) {
      await logAdminAction({
        action: 'update',
        entityType: 'auth',
        featureName: 'admin_logout',
        oldValue: { email: user.email },
        newValue: null,
        source: 'admin-panel'
      });
    }

    await supabase.auth.signOut();
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
    navigate('/');
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }


  return (
    <>
      <Helmet>
        <title>Admin Dashboard | campus360</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-lg font-bold">
                Admin <span className="text-primary">Dashboard</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)} className="w-full">
            <TabsList className={`grid w-full mb-6`} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {canAccessTab('media') && (
              <TabsContent value="media">
                <MediaUpload restrictToHouse={houseName} />
              </TabsContent>
            )}

            {canAccessTab('houses') && (
              <TabsContent value="houses">
                <HouseManager restrictToHouse={houseName} />
              </TabsContent>
            )}

            {canAccessTab('arena') && (
              <TabsContent value="arena">
                <ArenaManager />
              </TabsContent>
            )}

            {canAccessTab('allhouse') && (
              <TabsContent value="allhouse">
                <CommonMatchManager />
              </TabsContent>
            )}

            {canAccessTab('sports') && (
              <TabsContent value="sports">
                <SportsManager />
              </TabsContent>
            )}

            {canAccessTab('winner') && (
              <TabsContent value="winner">
                <WinnerManager />
              </TabsContent>
            )}

            {canAccessTab('polls') && (
              <TabsContent value="polls">
                <PollManager />
              </TabsContent>
            )}

            {canAccessTab('logs') && (
              <TabsContent value="logs">
                <AuditLogViewer />
              </TabsContent>
            )}

            {canAccessTab('admins') && (
              <TabsContent value="admins">
                <AdminManager />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Admin;
