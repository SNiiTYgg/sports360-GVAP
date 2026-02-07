/**
 * Scoreboard Data - campus360
 */

export interface ScoreEvent {
  id: string;
  event: string;
  points: number;
  date: string;
  day: string;
}

export interface HouseScore {
  id: string;
  houseId: string;
  houseName: string;
  slug: string;
  color: 'aakash' | 'agni' | 'jal' | 'prithvi' | 'vayu';
  points: number;
  wins: number;
  losses: number;
  draws: number;
  history: ScoreEvent[];
}

export const scoreboard: HouseScore[] = [
  {
    id: '1',
    houseId: '1',
    houseName: 'AAKASH',
    slug: 'aakash',
    color: 'aakash',
    points: 245,
    wins: 12,
    losses: 3,
    draws: 2,
    history: [
      { id: 'a1', event: 'Won Basketball Boys', points: 50, date: '2024-01-15', day: 'Day 5 of Sports Week' },
      { id: 'a2', event: 'Won Badminton Girls', points: 30, date: '2024-01-14', day: 'Day 4 of Sports Week' },
      { id: 'a3', event: 'Runner-up Volleyball', points: 25, date: '2024-01-13', day: 'Day 3 of Sports Week' },
      { id: 'a4', event: 'Won Chess Tournament', points: 40, date: '2024-01-12', day: 'Day 2 of Sports Week' },
      { id: 'a5', event: 'Won 100m Sprint Boys', points: 20, date: '2024-01-11', day: 'Day 1 of Sports Week' },
    ],
  },
  {
    id: '2',
    houseId: '2',
    houseName: 'AGNI',
    slug: 'agni',
    color: 'agni',
    points: 230,
    wins: 11,
    losses: 4,
    draws: 2,
    history: [
      { id: 'ag1', event: 'Won Football Boys', points: 50, date: '2024-01-15', day: 'Day 5 of Sports Week' },
      { id: 'ag2', event: 'Won Table Tennis Mixed', points: 35, date: '2024-01-14', day: 'Day 4 of Sports Week' },
      { id: 'ag3', event: 'Won Kabaddi Girls', points: 30, date: '2024-01-13', day: 'Day 3 of Sports Week' },
      { id: 'ag4', event: 'Runner-up Athletics', points: 25, date: '2024-01-12', day: 'Day 2 of Sports Week' },
    ],
  },
  {
    id: '3',
    houseId: '3',
    houseName: 'JAL',
    slug: 'jal',
    color: 'jal',
    points: 220,
    wins: 10,
    losses: 5,
    draws: 2,
    history: [
      { id: 'j1', event: 'Won Swimming Boys', points: 45, date: '2024-01-15', day: 'Day 5 of Sports Week' },
      { id: 'j2', event: 'Won Carrom Mixed', points: 25, date: '2024-01-14', day: 'Day 4 of Sports Week' },
      { id: 'j3', event: 'Runner-up Basketball Girls', points: 30, date: '2024-01-13', day: 'Day 3 of Sports Week' },
      { id: 'j4', event: 'Won Long Jump Girls', points: 20, date: '2024-01-12', day: 'Day 2 of Sports Week' },
    ],
  },
  {
    id: '4',
    houseId: '4',
    houseName: 'PRITHVI',
    slug: 'prithvi',
    color: 'prithvi',
    points: 210,
    wins: 9,
    losses: 6,
    draws: 2,
    history: [
      { id: 'p1', event: 'Won Wrestling Boys', points: 40, date: '2024-01-15', day: 'Day 5 of Sports Week' },
      { id: 'p2', event: 'Won Shot Put Mixed', points: 30, date: '2024-01-14', day: 'Day 4 of Sports Week' },
      { id: 'p3', event: 'Runner-up Football Girls', points: 25, date: '2024-01-13', day: 'Day 3 of Sports Week' },
      { id: 'p4', event: 'Won Tug of War', points: 35, date: '2024-01-12', day: 'Day 2 of Sports Week' },
    ],
  },
  {
    id: '5',
    houseId: '5',
    houseName: 'VAYU',
    slug: 'vayu',
    color: 'vayu',
    points: 200,
    wins: 8,
    losses: 7,
    draws: 2,
    history: [
      { id: 'v1', event: 'Won Relay Race Mixed', points: 40, date: '2024-01-15', day: 'Day 5 of Sports Week' },
      { id: 'v2', event: 'Won Badminton Boys', points: 30, date: '2024-01-14', day: 'Day 4 of Sports Week' },
      { id: 'v3', event: 'Runner-up Chess', points: 20, date: '2024-01-13', day: 'Day 3 of Sports Week' },
      { id: 'v4', event: 'Won High Jump Boys', points: 25, date: '2024-01-12', day: 'Day 2 of Sports Week' },
    ],
  },
];

export const getSortedScoreboard = (): HouseScore[] => {
  return [...scoreboard].sort((a, b) => b.points - a.points);
};

export const getHouseScore = (slug: string): HouseScore | undefined => {
  return scoreboard.find((score) => score.slug === slug);
};
