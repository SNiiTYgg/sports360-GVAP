/**
 * PhilosophySection Component - campus360
 *
 * Displays the philosophy behind the Panchatatva elements.
 * Part of the Houses landing page content section.
 */

import React from 'react';
import { motion } from 'framer-motion';

const PhilosophySection: React.FC = () => {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="pt-6 border-t border-border"
        >
            {/* Section Header */}
            <div className="mb-4">
                <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-1">
                    Philosophy Behind the Elements
                </h3>
                <p className="text-sm text-primary font-medium">Rooted in Sanatan Dharma</p>
            </div>

            {/* Philosophy Content */}
            <div className="space-y-3 text-muted-foreground leading-relaxed text-sm">
                <p>
                    According to Hindu philosophy, the human body and the universe are made of these
                    five elements. They are deeply connected to{' '}
                    <span className="font-semibold text-foreground">Sanatan Dharma</span>, where
                    balance between mind, body, and soul is essential.
                </p>
                <p>
                    Lord Krishna's teachings emphasize{' '}
                    <span className="font-semibold text-foreground">dharma, balance, action, and harmony</span> —
                    values that resonate with the Panchatatva. By following these principles,
                    students learn not only to compete, but to grow with purpose and character.
                </p>
            </div>
        </motion.section>
    );
};

export default PhilosophySection;
