/**
 * HousesSection Component - campus360
 *
 * Displays house values and information with animated list items.
 * Part of the Houses landing page content section.
 */

import React from 'react';
import { motion } from 'framer-motion';

// House values with icons
const houseValues = [
    { icon: '👑', text: 'Leadership and responsibility' },
    { icon: '🤝', text: 'Unity in diversity' },
    { icon: '🏆', text: 'Healthy competition' },
    { icon: '🎭', text: 'Cultural expression' },
    { icon: '🧘', text: 'Physical and mental well-being' },
];

const HousesSection: React.FC = () => {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4"
        >
            {/* Section Header with decorative border */}
            <div className="decorative-border pt-4">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">
                    Houses of <span className="gold-text">GVAP</span>
                </h2>
                <p className="text-primary font-medium">Sports & Culture</p>
            </div>

            {/* Section Description */}
            <p className="text-muted-foreground leading-relaxed text-sm">
                The houses of GVAP are inspired by the five elements — the{' '}
                <span className="font-semibold text-foreground">Panchatatva</span>.
                Each house carries the spirit of its element, shaping students into
                balanced individuals through sports, cultural activities, and teamwork.
            </p>

            {/* Values List */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">These houses encourage:</p>
                <ul className="space-y-2">
                    {houseValues.map((item, index) => (
                        <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3 text-muted-foreground"
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.text}</span>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </motion.section>
    );
};

export default HousesSection;
