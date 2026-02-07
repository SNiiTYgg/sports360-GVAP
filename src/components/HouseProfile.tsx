/**
 * HouseProfile Component - campus360
 * 
 * Instagram-inspired house profile display with:
 * - Profile picture with house-colored ring
 * - House name with Instagram link
 * - House description
 * - Members count
 */

import React from 'react';
import { Users, Instagram } from 'lucide-react';
import type { House } from '@/data/houses';
import { cn } from '@/lib/utils';

interface HouseProfileProps {
  house: House;
  instagramUrl?: string | null;
}

/**
 * House profile header component
 * Displays profile picture, name, Instagram link, description, and members count
 */
const HouseProfile: React.FC<HouseProfileProps> = ({ house, instagramUrl }) => {
  // Get house-specific color classes
  const getHouseAccentClass = (color: House['color']) => {
    const accents: Record<House['color'], string> = {
      aakash: 'ring-house-aakash',
      agni: 'ring-house-agni',
      jal: 'ring-house-jal',
      prithvi: 'ring-house-prithvi',
      vayu: 'ring-house-vayu',
    };
    return accents[color];
  };

  const getBgClass = (color: House['color']) => {
    const bgs: Record<House['color'], string> = {
      aakash: 'house-bg-aakash',
      agni: 'house-bg-agni',
      jal: 'house-bg-jal',
      prithvi: 'house-bg-prithvi',
      vayu: 'house-bg-vayu',
    };
    return bgs[color];
  };

  return (
    <div className="animate-fade-in px-4 py-6">
      <div className="flex items-start gap-6">
        {/* Profile Picture with House-colored ring */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'rounded-full p-1',
              getBgClass(house.color)
            )}
          >
            <div
              className={cn(
                'h-20 w-20 overflow-hidden rounded-full ring-4 sm:h-24 sm:w-24',
                getHouseAccentClass(house.color)
              )}
            >
              <img
                src={house.profileImage}
                alt={`${house.name} house profile`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* House Info */}
        <div className="flex flex-1 flex-col gap-3 pt-1">
          {/* House Name with Instagram Link */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {house.name}
            </h2>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-1.5 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:scale-110 transition-transform"
                title={`Follow ${house.name} on Instagram`}
              >
                <Instagram className="h-4 w-4 text-white" />
              </a>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground sm:text-base">
            {house.description}
          </p>

          {/* Members Count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong className="font-semibold">{house.membersCount}</strong>
              <span className="ml-1 text-muted-foreground">members</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseProfile;

