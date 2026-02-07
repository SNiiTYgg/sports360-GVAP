/**
 * ElementRing Component - campus360
 *
 * Animated circular orbit displaying the 5 house elements
 * with profile images from Supabase rotating around a central logo.
 *
 * Features:
 * - 30s continuous rotation animation
 * - Pause on hover over the ring area
 * - Click/hover on element to show details in center
 * - Counter-rotation for element icons to keep them upright
 * - Gradient borders matching each house color
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHouses } from '@/hooks/useHouses';

interface ElementInfo {
    id: string;
    name: string;
    sanskrit: string;
    description: string;
    color: 'aakash' | 'agni' | 'jal' | 'prithvi' | 'vayu';
}

// Element metadata - descriptions for each house
const elementData: Record<string, { sanskrit: string; description: string }> = {
    aakash: {
        sanskrit: 'Space',
        description: 'Represents openness, vision, and limitless potential. Symbolizes creativity, communication, and the ability to dream beyond boundaries.',
    },
    agni: {
        sanskrit: 'Fire',
        description: 'The source of energy, passion, and transformation. Reflects determination, courage, and the competitive spirit in sports and leadership.',
    },
    jal: {
        sanskrit: 'Water',
        description: 'Stands for adaptability, calmness, and teamwork. Teaches us to flow together, support each other, and remain resilient.',
    },
    prithvi: {
        sanskrit: 'Earth',
        description: 'Signifies stability, strength, and discipline. Represents a strong foundation, consistency, and the grounding force behind success.',
    },
    vayu: {
        sanskrit: 'Air',
        description: 'Symbolizes movement, speed, and life force. Reflects agility, enthusiasm, and the freedom to grow and explore.',
    },
};

const ElementRing: React.FC = () => {
    const { houses } = useHouses();
    const [activeElement, setActiveElement] = useState<ElementInfo | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Ring configuration
    const ringRadius = 130;

    // Map houses to elements with metadata
    const elements: ElementInfo[] = houses.map((house) => ({
        id: house.id,
        name: house.name,
        sanskrit: elementData[house.slug]?.sanskrit || '',
        description: elementData[house.slug]?.description || '',
        color: house.color,
    }));

    // Get the border class for each element
    const getBorderClass = (color: string): string => {
        return `element-border-${color}`;
    };

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Main Ring Container */}
            <div
                className="relative w-[340px] h-[340px] md:w-[380px] md:h-[380px]"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => {
                    setIsPaused(false);
                    setActiveElement(null);
                }}
            >
                {/* Decorative outer rings */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-4 rounded-full border border-primary/10" />

                {/* Rotating Ring */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: isPaused ? undefined : 360 }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                >
                    {houses.map((house, index) => {
                        // Calculate position on the ring (5 elements, 72 degrees apart, starting from top)
                        const angle = (index * 72 - 90) * (Math.PI / 180);
                        const x = Math.cos(angle) * ringRadius;
                        const y = Math.sin(angle) * ringRadius;

                        const elementInfo: ElementInfo = {
                            id: house.id,
                            name: house.name,
                            sanskrit: elementData[house.slug]?.sanskrit || '',
                            description: elementData[house.slug]?.description || '',
                            color: house.color,
                        };

                        return (
                            <motion.button
                                key={house.id}
                                className="absolute cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                                style={{
                                    left: `calc(50% + ${x}px - 36px)`,
                                    top: `calc(50% + ${y}px - 44px)`,
                                }}
                                onClick={() => setActiveElement(elementInfo)}
                                onMouseEnter={() => setActiveElement(elementInfo)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                animate={{ rotate: isPaused ? 0 : -360 }}
                                transition={{
                                    duration: 30,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            >
                                {/* Element icon with gradient border */}
                                <div className={`${getBorderClass(house.color)}`}>
                                    <div className="element-orbit-icon bg-background">
                                        <img
                                            src={house.profileImage}
                                            alt={house.name}
                                            className="w-full h-full object-cover rounded-full"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                                {/* Element name label */}
                                <p className="text-[10px] md:text-xs font-semibold text-foreground mt-1 text-center">
                                    {house.name}
                                </p>
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Center Content - Logo or Active Element Details */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {activeElement ? (
                            <motion.div
                                key={activeElement.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="text-center px-6 max-w-[180px]"
                            >
                                <h3 className="font-heading text-lg font-bold text-foreground">
                                    {activeElement.name}
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    ({activeElement.sanskrit})
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="logo"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-14 h-14 md:w-16 md:h-16"
                            >
                                <img
                                    src="/logo.png"
                                    alt="Campus 360 Logo"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Element Description (shown below the ring when element is active) */}
            <AnimatePresence>
                {activeElement && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 max-w-xs text-center px-4"
                    >
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {activeElement.description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ElementRing;
