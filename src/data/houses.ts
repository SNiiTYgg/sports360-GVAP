/**
 * Houses Data - campus360
 * 
 * This file contains hardcoded data for all 5 houses.
 * In Phase 2, this will be replaced with Firebase/Supabase data fetching.
 * 
 * Each house has:
 * - id: unique identifier
 * - name: display name
 * - slug: URL-friendly name
 * - color: tailwind color class key
 * - profileImage: URL to house profile picture
 * - membersCount: number of members
 * - description: short house description
 * - media: array of images/videos
 */

export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string; // For videos
  caption?: string;
}

export interface House {
  id: string;
  name: string;
  slug: string;
  color: 'aakash' | 'agni' | 'jal' | 'prithvi' | 'vayu';
  profileImage: string;
  membersCount: number;
  description: string;
  media: MediaItem[];
}

// Placeholder images using Unsplash for sports/team themes
// TODO: Replace with actual house images in production

/**
 * ============================================
 * TEAM DESCRIPTIONS & PROFILE PICTURES - EDIT HERE
 * ============================================
 * To change a team's description, update the 'description' field.
 * To change a team's profile picture, update the 'profileImage' field.
 * ============================================
 */
export const houses: House[] = [
  {
    id: '1',
    name: 'AAKASH',
    slug: 'aakash',
    color: 'aakash',
    profileImage: '/aakash_house_pp.png', // AAKASH HOUSE PROFILE PICTURE - change path here
    membersCount: 156,
    // AAKASH DESCRIPTION - Edit below
    description: 'Aakash team unchaiyon ka prateek hai, jahan soch khuli aur drishti door tak hoti hai. Yeh team freedom, focus aur limitless potential ke saath har match mein apni pehchaan banati hai. ☁️',
    media: [
      { id: 'a1', type: 'image', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=600&fit=crop', caption: 'Team AAKASH at the morning practice session' },
      { id: 'a2', type: 'image', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=600&fit=crop', caption: 'Sprint training on the main track' },
      { id: 'a3', type: 'image', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=600&fit=crop', caption: 'Victory celebration after the finals' },
      { id: 'a4', type: 'image', url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=600&fit=crop', caption: 'Endurance training in action' },
      { id: 'a5', type: 'image', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=600&fit=crop', caption: 'Gym session with our champions' },
      { id: 'a6', type: 'image', url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&h=600&fit=crop', caption: 'Athletes preparing for the relay race' },
    ],
  },
  {
    id: '2',
    name: 'AGNI',
    slug: 'agni',
    color: 'agni',
    profileImage: '/agni_house_pp.png', // AGNI HOUSE PROFILE PICTURE - change path here
    membersCount: 142,
    // AGNI DESCRIPTION - Edit below
    description: 'Agni team junoon aur jazbe se bhari hui hai, jo kabhi haar nahi maanta. Unki energy aur aggressive spirit har competition mein aag laga deti hai. 🔥',
    media: [
      { id: 'ag1', type: 'image', url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&h=600&fit=crop', caption: 'Team AGNI warming up before the big match' },
      { id: 'ag2', type: 'image', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&h=600&fit=crop', caption: 'Cheerleaders bringing the energy' },
      { id: 'ag3', type: 'image', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=600&fit=crop', caption: 'Team bonding at the training camp' },
      { id: 'ag4', type: 'image', url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=600&h=600&fit=crop', caption: 'Intense basketball practice' },
      { id: 'ag5', type: 'image', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=600&fit=crop', caption: 'Morning run with the squad' },
      { id: 'ag6', type: 'image', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop', caption: 'Track and field excellence' },
    ],
  },
  {
    id: '3',
    name: 'JAL',
    slug: 'jal',
    color: 'jal',
    profileImage: '/jal_house_pp.png', // JAL HOUSE PROFILE PICTURE - change path here
    membersCount: 168,
    // JAL DESCRIPTION - Edit below
    description: 'Jal team shaant rehkar tez vaar karne mein vishwas rakhti hai. Jaise pani apna raasta khud bana leta hai, waise hi yeh team consistency aur flow ke saath jeet hasil karti hai. 💧',
    media: [
      { id: 'j1', type: 'image', url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=600&fit=crop', caption: 'Swimming competition highlights' },
      { id: 'j2', type: 'image', url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&h=600&fit=crop', caption: 'Team JAL diving practice' },
      { id: 'j3', type: 'image', url: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=600&h=600&fit=crop', caption: 'Pool training session' },
      { id: 'j4', type: 'image', url: 'https://images.unsplash.com/photo-1562771379-eafdca7a02f8?w=600&h=600&fit=crop', caption: 'Winning moment at the aquatics event' },
      { id: 'j5', type: 'image', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=600&fit=crop', caption: 'Cross-training on the track' },
      { id: 'j6', type: 'image', url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&h=600&fit=crop', caption: 'Underwater training drills' },
    ],
  },
  {
    id: '4',
    name: 'PRITHVI',
    slug: 'prithvi',
    color: 'prithvi',
    profileImage: '/pirtvi_house_pp.png', // PRITHVI HOUSE PROFILE PICTURE - change path here
    membersCount: 134,
    // PRITHVI DESCRIPTION - Edit below
    description: 'Prithvi team majboot buniyad aur strong teamwork ka prateek hai. Yeh team stability, discipline aur patience ke saath har challenge ka saamna karti hai. 🌍',
    media: [
      { id: 'p1', type: 'image', url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=600&fit=crop', caption: 'Strength training at the gym' },
      { id: 'p2', type: 'image', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop', caption: 'Football practice on the main field' },
      { id: 'p3', type: 'image', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=600&fit=crop', caption: 'Team PRITHVI celebrating victory' },
      { id: 'p4', type: 'image', url: 'https://images.unsplash.com/photo-1593766788306-28561086694e?w=600&h=600&fit=crop', caption: 'Volleyball tournament action shot' },
      { id: 'p5', type: 'image', url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=600&fit=crop', caption: 'Cricket match highlights' },
      { id: 'p6', type: 'image', url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop', caption: 'Team huddle before the game' },
    ],
  },
  {
    id: '5',
    name: 'VAYU',
    slug: 'vayu',
    color: 'vayu',
    profileImage: '/vayu_house_pp.png', // VAYU HOUSE PROFILE PICTURE - change path here
    membersCount: 149,
    // VAYU DESCRIPTION - Edit below
    description: 'Vayu team speed, agility aur quick decision-making ke liye jaani jaati hai. Unka movement aur coordination opponents ko react karne ka mauka nahi deta. 💨',
    media: [
      { id: 'v1', type: 'image', url: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&h=600&fit=crop', caption: 'Badminton championship moment' },
      { id: 'v2', type: 'image', url: 'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?w=600&h=600&fit=crop', caption: 'Table tennis finals' },
      { id: 'v3', type: 'image', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop', caption: 'Track events with Team VAYU' },
      { id: 'v4', type: 'image', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=600&fit=crop', caption: 'Sprint race preparations' },
      { id: 'v5', type: 'image', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop', caption: 'Yoga and flexibility training' },
      { id: 'v6', type: 'image', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop', caption: 'Team VAYU fitness session' },
    ],
  },
];

/**
 * Helper function to get house by slug
 * TODO: In Phase 2, replace with database query
 */
export const getHouseBySlug = (slug: string): House | undefined => {
  return houses.find((house) => house.slug === slug);
};

/**
 * Helper function to get house by id
 * TODO: In Phase 2, replace with database query
 */
export const getHouseById = (id: string): House | undefined => {
  return houses.find((house) => house.id === id);
};
