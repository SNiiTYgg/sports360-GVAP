/**
 * Sports Winner Tag
 * -----------------
 * Simple PNG-based winner tag for the scoreboard.
 *
 * Rules:
 * - Appears only for rank #1
 * - Appears only when sports_reveal_on === true
 * - Persists beyond celebration window
 * - Removed when toggle is OFF
 */

import React from 'react';

interface WinnerTagProps {
    size?: 'sm' | 'md' | 'lg';
}

const WinnerTag: React.FC<WinnerTagProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-10',
    };

    return (
        <img
            src="/sports-winner-tag.png"
            alt="Winner"
            className={`${sizeClasses[size]} w-auto object-contain inline-block ml-2`}
        />
    );
};

export default WinnerTag;
