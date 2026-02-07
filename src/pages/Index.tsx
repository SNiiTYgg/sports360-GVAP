/**
 * Index Page - campus360
 *
 * Main entry point for the college sports event website.
 * Manages tab navigation between houses landing, individual houses, poll, scoreboard, and arena.
 *
 * Features:
 * - Instagram-inspired UI
 * - Light/dark theme support
 * - Houses landing page (default)
 * - 5 individual house pages
 * - Poll page
 * - Scoreboard page
 * - Arena page
 * - Responsive design
 */

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import TopBar from '@/components/TopBar';
import HousePage from '@/components/HousePage';
import HousesLandingPage from '@/components/HousesLandingPage';
import PollPage from '@/components/PollPage';
import ScoreboardPage from '@/components/ScoreboardPage';
import ArenaPage from '@/components/ArenaPage';
import { useHouses } from '@/hooks/useHouses';
import { useTheme } from '@/hooks/useTheme';
import { usePersistentTab } from '@/hooks/usePersistentTab';

// Tab type for navigation
type TabType = 'houses' | 'aakash' | 'agni' | 'jal' | 'prithvi' | 'vayu' | 'poll' | 'scoreboard' | 'arena';

/**
 * Main application page
 * Handles tab switching and theme management
 */
const Index: React.FC = () => {
  // Theme state
  const { isDark, toggleTheme } = useTheme();

  // Fetch houses from Supabase
  const { houses, getHouseBySlug } = useHouses();

  // Valid tabs for navigation
  const validTabs = ['houses', 'aakash', 'agni', 'jal', 'prithvi', 'vayu', 'poll', 'scoreboard', 'arena'] as const;

  // Active tab state - persisted in URL for reload persistence
  const [activeTab, setActiveTab] = usePersistentTab<TabType>('houses', validTabs);

  // Get current house data (if on an individual house tab)
  const currentHouse = useMemo(() => {
    if (activeTab === 'houses' || activeTab === 'poll' || activeTab === 'scoreboard' || activeTab === 'arena') return null;
    return getHouseBySlug(activeTab);
  }, [activeTab, getHouseBySlug]);

  // Page title based on active tab
  const pageTitle = useMemo(() => {
    if (activeTab === 'houses') return 'Houses | campus360';
    if (activeTab === 'poll') return 'Polls | campus360';
    if (activeTab === 'scoreboard') return 'Scoreboard | campus360';
    if (activeTab === 'arena') return 'Arena | campus360';
    const house = houses.find((h) => h.slug === activeTab);
    return house ? `${house.name} | campus360` : 'campus360';
  }, [activeTab, houses]);

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="campus360 - Your college sports event hub. View house profiles, participate in polls, and stay connected with campus sports."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      {/* Main Layout */}
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDark={isDark}
          onThemeToggle={toggleTheme}
        />

        {/* Main Content Area */}
        {activeTab === 'houses' ? (
          // Houses landing page has its own full-width layout
          <HousesLandingPage />
        ) : (
          <main className="container max-w-2xl pb-8">
            {/* Render content based on active tab */}
            {activeTab === 'poll' ? (
              <PollPage />
            ) : activeTab === 'scoreboard' ? (
              <ScoreboardPage />
            ) : activeTab === 'arena' ? (
              <ArenaPage />
            ) : currentHouse ? (
              <HousePage house={currentHouse} />
            ) : (
              // Fallback (should not happen with valid tabs)
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">House not found</p>
              </div>
            )}
          </main>
        )}
      </div>
    </>
  );
};

export default Index;
