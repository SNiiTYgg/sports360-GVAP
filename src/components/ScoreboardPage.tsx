import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Table } from 'lucide-react';
import { type HouseScore } from '@/data/scoreboard';
import { cn } from '@/lib/utils';
import { getSportsEvents, type SportEvent } from '@/components/admin/SportsManager';
import { useAppSettings } from '@/hooks/useAppSettings';
import CountUp from '@/components/CountUp';
import { useWinnerReveal } from '@/hooks/useWinnerReveal';
import WinnerCelebration from '@/components/celebration/WinnerCelebration';
import { ScoreboardSkeleton } from '@/components/skeletons/LoadingSkeletons';

/**
 * Get house accent color for the house indicator dot
 */
const getHouseDotColor = (color: HouseScore['color']) => {
  const colorMap = {
    aakash: 'bg-sky-500', // House dot color -- Aakash
    agni: 'bg-orange-500', // House dot color -- Agni
    jal: 'bg-blue-500', // House dot color -- Jal
    prithvi: 'bg-green-500', // House dot color -- Prithvi
    vayu: 'bg-yellow-500', // House dot color -- Vayu (Golden)
  };
  return colorMap[color];
};


/**
 * Sports Winner Tag (Fallback)
 * ---------------------------
 * Instead of replacing rank number (which breaks layout),
 * a winner tag is rendered AFTER the house name.
 *
 * Rules:
 * - Appears only for rank #1
 * - Appears only when sports_reveal_on === true
 * - Persists beyond celebration window
 * - Removed when toggle is OFF
 */
interface LeaderRowProps {
  score: HouseScore;
  isSportsRevealActive: boolean;
  isOverallRevealActive: boolean;
}

/**
 * Leader Row - Featured top-ranked house with larger display
 */
const LeaderRow: React.FC<LeaderRowProps> = ({ score, isSportsRevealActive, isOverallRevealActive }) => {
  return (
    <div className="mb-2">
      {/* Main Leader Card */}
      <div
        className={cn(
          'bg-gradient-to-r from-[#1a2744] to-[#2a3a5c] dark:from-[#0f172a] dark:to-[#1e293b]',
          'rounded-2xl overflow-hidden',
          'border-t-4 border-emerald-500'
        )}
      >
        <div className="flex items-center gap-4 sm:gap-8 p-5 sm:p-6">
          {/* Rank - Always show 01, no replacement */}
          <div className="flex items-center gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              01
            </span>
            <div className={cn('w-2 h-2 rounded-full', getHouseDotColor(score.color))} />
          </div>

          {/* House Name + Winner Tag */}
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-wide uppercase">
              {score.houseName}
            </h3>
            {/* Overall Winner Tag (PNG) */}
            {isOverallRevealActive && (
              <img
                src="/overall-winner-tag.png"
                alt="Overall Winner"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            )}
            {/* Sports Winner Tag (PNG) - Only if overall is not active/priority */}
            {isSportsRevealActive && !isOverallRevealActive && (
              <img
                src="/sports-winner-tag.png"
                alt="Sports Winner"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            )}
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center text-white">
            <div className="text-center min-w-[60px]">
              <p className="text-3xl font-bold">
                <CountUp value={score.points} fontSize={30} />
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Pts</p>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="sm:hidden text-right text-white">
            <p className="text-2xl font-bold">
              <CountUp value={score.points} fontSize={24} />
            </p>
            <p className="text-xs text-gray-400">pts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Regular Score Row for non-leader positions
 */
const ScoreRow: React.FC<{ score: HouseScore; rank: number }> = ({ score, rank }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800/50',
        'border-b border-gray-100 dark:border-gray-700/50',
        'transition-all duration-200',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${rank * 50}ms` }}
    >
      {/* Main Row */}
      <div className="flex items-center gap-4 sm:gap-8 px-4 sm:px-6 py-4">
        {/* Rank */}
        <div className="flex items-center gap-2 min-w-[56px]">
          <span className="text-xl sm:text-2xl font-bold text-[#1a2744] dark:text-white tracking-tight">
            {String(rank).padStart(2, '0')}
          </span>
          <div className={cn('w-1.5 h-1.5 rounded-full', getHouseDotColor(score.color))} />
        </div>

        {/* House Name */}
        <div className="flex-1">
          <h3 className="text-sm sm:text-base font-bold text-[#1a2744] dark:text-white uppercase tracking-wide">
            {score.houseName}
          </h3>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center">
          <span className="text-lg font-semibold text-[#1a2744] dark:text-gray-200 min-w-[60px] text-center">
            <CountUp value={score.points} fontSize={18} />
          </span>
        </div>

        {/* Mobile Stats */}
        <div className="sm:hidden text-right">
          <p className="text-lg font-bold text-[#1a2744] dark:text-white">
            <CountUp value={score.points} fontSize={18} />
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Detailed Scoreboard Table Component with Boys/Girls tabs
 */
const DetailedScoreboardTable: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'boys' | 'girls'>('boys');
  const [sportsEvents, setSportsEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sports events from Supabase
  useEffect(() => {
    const loadEvents = async () => {
      const events = await getSportsEvents();
      setSportsEvents(events);
      setLoading(false);
    };
    loadEvents();
  }, []);

  const boysEvents = sportsEvents.filter(e => e.category === 'Boys');
  const girlsEvents = sportsEvents.filter(e => e.category === 'Girls');

  const currentEvents = activeSection === 'boys' ? boysEvents : girlsEvents;

  // Calculate totals for current section
  const sectionTotals = {
    vayu: currentEvents.reduce((sum, e) => sum + e.vayu, 0),
    aakash: currentEvents.reduce((sum, e) => sum + e.aakash, 0),
    prithvi: currentEvents.reduce((sum, e) => sum + e.prithvi, 0),
    agni: currentEvents.reduce((sum, e) => sum + e.agni, 0),
    jal: currentEvents.reduce((sum, e) => sum + e.jal, 0),
  };

  const renderCell = (value: number) => (
    <td className={cn(
      "px-2 sm:px-4 py-2 text-center text-sm font-medium",
      activeSection === 'boys'
        ? "text-rose-900 dark:text-rose-200"
        : "text-blue-900 dark:text-blue-200"
    )}>
      {value}
    </td>
  );

  return (
    <div>
      {/* Section Tabs */}
      <div className="flex mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection('boys')}
          className={cn(
            'flex-1 py-3 px-6 text-sm font-bold uppercase tracking-wider transition-all',
            activeSection === 'boys'
              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-b-2 border-rose-500'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          Boys
        </button>
        <button
          onClick={() => setActiveSection('girls')}
          className={cn(
            'flex-1 py-3 px-6 text-sm font-bold uppercase tracking-wider transition-all',
            activeSection === 'girls'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          Girls
        </button>
      </div>

      {/* Table Container with section-specific background */}
      <div className={cn(
        "overflow-x-auto rounded-lg",
        activeSection === 'boys'
          ? "bg-rose-50/50 dark:bg-rose-950/20"
          : "bg-blue-50/50 dark:bg-blue-950/20"
      )}>
        <table className="w-full min-w-[500px] border-collapse">
          {/* Header */}
          <thead>
            <tr className={cn(
              "border-b-2",
              activeSection === 'boys'
                ? "border-rose-200 dark:border-rose-800"
                : "border-blue-200 dark:border-blue-800"
            )}>
              <th className={cn(
                "px-2 sm:px-4 py-3 text-left text-xs font-bold uppercase tracking-wider",
                activeSection === 'boys'
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-blue-700 dark:text-blue-300"
              )}>
                Sr No
              </th>
              <th className={cn(
                "px-2 sm:px-4 py-3 text-left text-xs font-bold uppercase tracking-wider",
                activeSection === 'boys'
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-blue-700 dark:text-blue-300"
              )}>
                Game
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Vayu
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Aakash
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                Prithvi
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Agni
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Jal
              </th>
            </tr>
          </thead>

          <tbody>
            {currentEvents.map((event, idx) => (
              <tr
                key={`${activeSection}-${event.id}`}
                className={cn(
                  'border-b transition-colors',
                  activeSection === 'boys'
                    ? idx % 2 === 0
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50'
                      : 'bg-white dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/50'
                    : idx % 2 === 0
                      ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50'
                      : 'bg-white dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/50'
                )}
              >
                <td className={cn(
                  "px-2 sm:px-4 py-2 text-sm font-medium",
                  activeSection === 'boys'
                    ? "text-rose-800 dark:text-rose-300"
                    : "text-blue-800 dark:text-blue-300"
                )}>
                  {idx + 1}
                </td>
                <td className={cn(
                  "px-2 sm:px-4 py-2 text-sm font-medium",
                  activeSection === 'boys'
                    ? "text-rose-900 dark:text-rose-200"
                    : "text-blue-900 dark:text-blue-200"
                )}>
                  {event.game}
                </td>
                {renderCell(event.vayu)}
                {renderCell(event.aakash)}
                {renderCell(event.prithvi)}
                {renderCell(event.agni)}
                {renderCell(event.jal)}
              </tr>
            ))}

            {/* Totals Row */}
            <tr className={cn(
              "border-t-2",
              activeSection === 'boys'
                ? "border-rose-300 dark:border-rose-700 bg-rose-100 dark:bg-rose-900/40"
                : "border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/40"
            )}>
              <td className={cn(
                "px-2 sm:px-4 py-3 text-sm font-bold",
                activeSection === 'boys'
                  ? "text-rose-800 dark:text-rose-200"
                  : "text-blue-800 dark:text-blue-200"
              )} colSpan={2}>
                Total ({activeSection === 'boys' ? 'Boys' : 'Girls'})
              </td>
              <td className="px-2 sm:px-4 py-3 text-center text-sm font-bold text-purple-700 dark:text-purple-400">
                {sectionTotals.vayu}
              </td>
              <td className="px-2 sm:px-4 py-3 text-center text-sm font-bold text-sky-700 dark:text-sky-400">
                {sectionTotals.aakash}
              </td>
              <td className="px-2 sm:px-4 py-3 text-center text-sm font-bold text-green-700 dark:text-green-400">
                {sectionTotals.prithvi}
              </td>
              <td className="px-2 sm:px-4 py-3 text-center text-sm font-bold text-orange-700 dark:text-orange-400">
                {sectionTotals.agni}
              </td>
              <td className="px-2 sm:px-4 py-3 text-center text-sm font-bold text-blue-700 dark:text-blue-400">
                {sectionTotals.jal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Calculate house scores from sports events
 */
const calculateHouseScoresFromEvents = (events: SportEvent[]): HouseScore[] => {
  const houseTotals = {
    vayu: events.reduce((sum, e) => sum + e.vayu, 0),
    aakash: events.reduce((sum, e) => sum + e.aakash, 0),
    prithvi: events.reduce((sum, e) => sum + e.prithvi, 0),
    agni: events.reduce((sum, e) => sum + e.agni, 0),
    jal: events.reduce((sum, e) => sum + e.jal, 0),
  };

  const houseData: HouseScore[] = [
    {
      id: '1',
      houseId: '1',
      houseName: 'AAKASH',
      slug: 'aakash',
      color: 'aakash',
      points: houseTotals.aakash,
      wins: Math.floor(houseTotals.aakash / 30),
      losses: 0,
      draws: 0,
      history: [],
    },
    {
      id: '2',
      houseId: '2',
      houseName: 'AGNI',
      slug: 'agni',
      color: 'agni',
      points: houseTotals.agni,
      wins: Math.floor(houseTotals.agni / 30),
      losses: 0,
      draws: 0,
      history: [],
    },
    {
      id: '3',
      houseId: '3',
      houseName: 'JAL',
      slug: 'jal',
      color: 'jal',
      points: houseTotals.jal,
      wins: Math.floor(houseTotals.jal / 30),
      losses: 0,
      draws: 0,
      history: [],
    },
    {
      id: '4',
      houseId: '4',
      houseName: 'PRITHVI',
      slug: 'prithvi',
      color: 'prithvi',
      points: houseTotals.prithvi,
      wins: Math.floor(houseTotals.prithvi / 30),
      losses: 0,
      draws: 0,
      history: [],
    },
    {
      id: '5',
      houseId: '5',
      houseName: 'VAYU',
      slug: 'vayu',
      color: 'vayu',
      points: houseTotals.vayu,
      wins: Math.floor(houseTotals.vayu / 30),
      losses: 0,
      draws: 0,
      history: [],
    },
  ];

  // Sort by points descending
  return houseData.sort((a, b) => b.points - a.points);
};

/**
 * Scoreboard Page Component
 * High-contrast minimalist design with bold typography
 */
const ScoreboardPage: React.FC = () => {
  const [showDetailedScoreboard, setShowDetailedScoreboard] = useState(false);
  const [sportsEvents, setSportsEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch event settings from app settings (single batch query)
  const { values: appSettings } = useAppSettings(
    ['event_year', 'event_name', 'event_name_visible', 'event_year_visible'],
    { event_year: '2024-25', event_name: '', event_name_visible: 'true', event_year_visible: 'true' }
  );
  const eventYear = appSettings.event_year;
  const eventName = appSettings.event_name;
  const eventNameVisible = appSettings.event_name_visible === 'true';
  const eventYearVisible = appSettings.event_year_visible === 'true';

  // Winner reveal state
  const {
    settings,
    winnerHouse,
    activeRevealType,
    shouldPlayCelebration,
    isRevealActive,
    markCelebrationSeen,
  } = useWinnerReveal();

  // Load sports events from Supabase
  useEffect(() => {
    const loadEvents = async () => {
      const events = await getSportsEvents();
      setSportsEvents(events);
      setLoading(false);
    };
    loadEvents();
  }, []);

  // Force dark mode when reveal is active
  useEffect(() => {
    if (isRevealActive) {
      document.documentElement.classList.add('dark');
    }
  }, [isRevealActive]);

  // Calculate scores from sports events
  const sortedScores = calculateHouseScoresFromEvents(sportsEvents);
  const leader = sortedScores[0];
  const others = sortedScores.slice(1);
  const totalEvents = sportsEvents.length;

  // Show skeleton while loading
  if (loading) {
    return <ScoreboardSkeleton />;
  }

  return (
    <>
      {/* Unified Winner Celebration Overlay */}
      {shouldPlayCelebration && activeRevealType && (
        <WinnerCelebration
          mode={activeRevealType}
          houseName={winnerHouse || '...'}
          eventName={eventName || ''}
          onComplete={markCelebrationSeen}
        />
      )}

      <div className="py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          {/* Event Name - Big headline (only if visible toggle is on) */}
          {eventName && eventNameVisible && (
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a2744] dark:text-white uppercase tracking-wider mb-1">
              {eventName}
            </h1>
          )}
          {/* Scoreboard subtitle */}
          <h2 className={`font-bold text-[#1a2744] dark:text-white tracking-tight ${eventName && eventNameVisible ? 'text-lg sm:text-xl' : 'text-3xl sm:text-4xl'}`}>
            Scoreboard
          </h2>
        </div>

        {/* Table Header - Desktop Only */}
        <div className="hidden sm:flex items-center gap-8 px-6 py-3 text-xs font-semibold text-[#4a5a7a] dark:text-gray-400 uppercase tracking-wider border-b-2 border-[#1a2744]/10 dark:border-gray-700 mb-4">
          <span className="min-w-[56px]">Pos</span>
          <span className="flex-1">House</span>
          <span className="min-w-[60px] text-center">Pts</span>
        </div>

        {/* Leader Card */}
        {leader && (
          <LeaderRow
            score={leader}
            isSportsRevealActive={!!(settings?.sports_reveal_on)}
            isOverallRevealActive={!!(settings?.overall_reveal_on)}
          />
        )}

        {/* Other Teams */}
        <div className="bg-white dark:bg-transparent rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 shadow-sm dark:shadow-none">
          {others.map((score, index) => (
            <ScoreRow key={score.id} score={score} rank={index + 2} />
          ))}
        </div>

        {/* Expand Detailed Scoreboard Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowDetailedScoreboard(!showDetailedScoreboard)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 px-6',
              'bg-[#1a2744] dark:bg-gray-800 text-white',
              'rounded-xl font-semibold text-sm uppercase tracking-wider',
              'hover:bg-[#243454] dark:hover:bg-gray-700 transition-colors',
              'border-2 border-transparent hover:border-[#3a4a6a]'
            )}
          >
            <Table className="h-4 w-4" />
            {showDetailedScoreboard ? 'Hide Detailed Scoreboard' : 'View Detailed Scoreboard'}
            {showDetailedScoreboard ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Detailed Scoreboard Section */}
        {showDetailedScoreboard && (
          <div className="mt-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden animate-fade-in">
            {/* Title Bar */}
            <div className="bg-[#1a2744] dark:bg-gray-900 px-4 sm:px-6 py-4">
              {/* Event Name (only if visible toggle is on) */}
              {eventName && eventNameVisible && (
                <h3 className="text-lg font-bold text-white text-center uppercase tracking-wider mb-1">
                  {eventName}
                </h3>
              )}
              {/* Sports & Cultural Point Table with Year (only if year visible toggle is on) */}
              <p className="text-sm text-gray-300 text-center uppercase tracking-wide">
                Sports & Cultural Point Table{eventYearVisible && eventYear ? ` ${eventYear}` : ''}
              </p>
              {/* College Name */}
              <p className="text-xs text-gray-400 text-center mt-1">
                G.V.Acharya Polytechnic
              </p>
            </div>

            {/* Table */}
            <div className="p-4">
              <DetailedScoreboardTable />
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Scores are updated by administrators after each event.
          </p>
        </div>
      </div>
    </>
  );
};

export default ScoreboardPage;
