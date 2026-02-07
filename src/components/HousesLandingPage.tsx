/**
 * HousesPage Component - campus360
 *
 * Main landing page for the Houses tab featuring:
 * - Two-column layout (orbit left, content right)
 * - Animated ElementRing with house profile images
 * - HousesSection with values
 * - PhilosophySection with element philosophy
 * - Footer quote
 *
 * This is the default landing page when users visit the site.
 */

import React from 'react';
import { motion } from 'framer-motion';
import ElementRing from '@/components/ElementRing';
import HousesSection from '@/components/HousesSection';
import PhilosophySection from '@/components/PhilosophySection';

const HousesPage: React.FC = () => {
    return (
        <div className="min-h-[calc(100vh-7rem)] bg-background px-4 py-8 md:py-12">
            <div className="max-w-6xl mx-auto h-full">
                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 min-h-[calc(100vh-10rem)]">
                    {/* Left: Element Ring - vertically centered */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex justify-center items-center lg:sticky lg:top-24 lg:h-[calc(100vh-10rem)]"
                    >
                        <ElementRing />
                    </motion.div>

                    {/* Right: All Content */}
                    <div className="space-y-8">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                                The Five Elements of{' '}
                                <span className="gold-text">GVAP</span>
                            </h1>

                            <p className="text-lg text-muted-foreground font-medium mb-4">
                                Harmony of Elements • Spirit of Sports & Culture
                            </p>

                            <p className="text-muted-foreground leading-relaxed">
                                At GVAP, sports and culture are not just activities — they are expressions of
                                balance, discipline, and unity. Inspired by ancient Indian philosophy, our houses
                                are guided by the <span className="font-semibold text-foreground">Panchatatva</span> —
                                the five elements that form the universe and the human body.
                            </p>
                        </motion.div>

                        {/* Houses Section */}
                        <HousesSection />

                        {/* Philosophy Section */}
                        <PhilosophySection />

                        {/* Footer Quote */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="pt-6 border-t border-border text-center lg:text-left"
                        >
                            <p className="font-heading text-xl md:text-2xl font-bold text-foreground mb-2">
                                One Spirit • One Circle • One{' '}
                                <span className="gold-text">GVAP</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                True strength lies in balance — between action and thought, competition and compassion.
                            </p>
                        </motion.div>

                        {/* Contact Us Section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="pt-6 mt-4 border-t border-border text-center"
                        >
                            <p className="text-sm text-muted-foreground mb-2">
                                {'• '}
                                <a
                                    href="https://linktr.ee/campus360_team"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Linktree
                                </a>
                                {' • '}
                                <a
                                    href="mailto:contact.campus360@gmail.com"
                                    className="text-primary hover:underline"
                                >
                                    contact.campus360@gmail.com
                                </a>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Made with love and passion by <span className="gold-text">Campus360 Team</span>
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HousesPage;
