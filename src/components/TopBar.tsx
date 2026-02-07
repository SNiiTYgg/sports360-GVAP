/**
 * TopBar Component - campus360
 * 
 * Instagram-inspired navigation bar with:
 * - Houses landing tab (default landing page)
 * - House tabs (AAKASH, AGNI, JAL, PRITHVI, VAYU)
 * - Poll tab
 * - Scoreboard tab
 * - Arena tab (conditionally shown based on admin setting)
 * - Theme toggle (☀/🌙)
 * - Logged-in user display (on Poll tab)
 * - Admin login icon (on Scoreboard tab)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Lock } from 'lucide-react';
import { houses } from '@/data/houses';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Tab types for navigation
type TabType = 'houses' | 'aakash' | 'agni' | 'jal' | 'prithvi' | 'vayu' | 'poll' | 'scoreboard' | 'arena';

interface TopBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

/**
 * TopBar navigation component
 * Sticky header with horizontal scrollable tabs on mobile
 */
const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  isDark,
  onThemeToggle,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [arenaVisible, setArenaVisible] = useState(false);

  // Fetch arena visibility setting
  useEffect(() => {
    const fetchVisibility = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'arena_visible')
        .single();
      if (data) {
        setArenaVisible(data.value === 'true');
      }
    };
    fetchVisibility();
  }, []);

  // Extract first name from display name
  const firstName = user?.displayName?.split(' ')[0] || 'User';

  // All navigation tabs: Houses landing, individual houses, poll, arena (conditional), scoreboard
  const tabs: { id: TabType; label: string }[] = [
    { id: 'houses', label: 'HOUSES' },
    ...houses.map((house) => ({
      id: house.slug as TabType,
      label: house.name,
    })),
    { id: 'poll', label: 'POLL' },
    // Arena tab is conditionally inserted between POLL and SCOREBOARD
    ...(arenaVisible ? [{ id: 'arena' as TabType, label: 'ARENA' }] : []),
    { id: 'scoreboard', label: 'SCOREBOARD' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container">
        {/* Top row with logo and actions */}
        <div className="flex h-14 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Campus 360 Logo"
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-xl font-bold tracking-tight">
              campus<span className="text-primary">360</span>
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Logged-in user display - visible on Poll tab when authenticated */}
            {activeTab === 'poll' && user && (
              <div className="flex items-center gap-2 rounded-full bg-secondary/50 px-2 py-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={firstName}
                    className="h-6 w-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">{firstName}</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Admin Login Icon - Only visible on Scoreboard tab */}
            {activeTab === 'scoreboard' && (
              <button
                onClick={() => navigate('/auth')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
                aria-label="Admin login"
              >
                <Lock className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="-mb-px overflow-x-auto scrollbar-none">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative px-4 py-3 text-sm font-semibold transition-colors',
                  'hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  activeTab === tab.id
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {tab.label}
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TopBar;
