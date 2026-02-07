/**
 * WinnerCelebration Component
 * --------------------------
 * Unified celebration system for both Sports and Overall winners.
 * 
 * Rules:
 * - Uses emoji for trophy (no external animation libraries)
 * - canvas-confetti for celebratory effects
 * - Overall mode: Both Fireworks + Side Cannons during congratulations & trophy phases
 * - Sports mode: Side Cannons when house name appears (trophy phase)
 * - Distinct countdowns and copy for each mode.
 * - Forces cinematic dark mode.
 */

import React, { useEffect, useState } from 'react';
import { ConfettiFireworks } from './ConfettiFireworks';
import { ConfettiSideCannons } from './ConfettiSideCannons';

interface WinnerCelebrationProps {
    mode: 'sports' | 'overall';
    houseName: string;
    eventName?: string;
    onComplete: () => void;
}

type Phase = 'countdown' | 'congratulations' | 'trophy' | 'done';

const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({ mode, houseName, eventName, onComplete }) => {
    const [phase, setPhase] = useState<Phase>('countdown');
    const [countdown, setCountdown] = useState(mode === 'sports' ? 3 : 10);
    const [fadeOut, setFadeOut] = useState(false);

    // Phase & Countdown Management
    useEffect(() => {
        if (phase === 'countdown') {
            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // After countdown: Overall goes to Congratulations, Sports goes to Trophy
                        setPhase(mode === 'overall' ? 'congratulations' : 'trophy');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }

        if (phase === 'congratulations') {
            // Show "Congratulations" for 2s (with confetti)
            const timer = setTimeout(() => {
                setPhase('trophy');
            }, 2000);
            return () => clearTimeout(timer);
        }

        if (phase === 'trophy') {
            // Show trophy for 8s (7.5s then fade)
            const fadeTimer = setTimeout(() => {
                setFadeOut(true);
            }, 7500);

            const completeTimer = setTimeout(() => {
                setPhase('done');
                onComplete();
            }, 8000);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(completeTimer);
            };
        }
    }, [phase, mode, onComplete]);

    // Force dark mode
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    // Determine when to show confetti effects
    const showOverallConfetti = mode === 'overall' && (phase === 'congratulations' || phase === 'trophy');
    const showSportsConfetti = mode === 'sports' && phase === 'trophy';

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        >
            {/* Canvas Confetti Effects */}
            {/* Overall mode: Both Fireworks + Side Cannons during congratulations & trophy */}
            {showOverallConfetti && (
                <>
                    <ConfettiFireworks />
                    <ConfettiSideCannons />
                </>
            )}

            {/* Sports mode: Side Cannons when house name appears */}
            {showSportsConfetti && <ConfettiSideCannons />}

            <div className="text-center px-4 max-w-2xl mx-auto">

                {/* Countdown Phase */}
                {phase === 'countdown' && (
                    <div className="animate-in zoom-in duration-300">
                        <p className="text-xl sm:text-2xl text-yellow-500 font-medium tracking-widest uppercase mb-8">
                            {mode === 'sports' ? 'Sports winner' : 'Winner'} will be revealed in
                        </p>
                        <p className="text-8xl sm:text-9xl font-bold text-white font-sans">
                            {countdown}
                        </p>
                    </div>
                )}

                {/* Congratulations Phase (Overall only) */}
                {phase === 'congratulations' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <h2 className="text-4xl sm:text-6xl font-bold text-yellow-400 tracking-wider">
                            Congratulations
                        </h2>
                    </div>
                )}

                {/* Trophy Phase - Centered layout */}
                {phase === 'trophy' && (
                    <div className="animate-in fade-in duration-700 flex flex-col items-center justify-center">
                        {/* Trophy GIF - Large centered */}
                        <div className="w-[85vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] max-w-4xl mb-4">
                            <img
                                src="/trophy_gif.gif"
                                alt="Trophy"
                                className="w-full h-auto object-contain"
                            />
                        </div>

                        {/* Winner Label */}
                        <p className="text-base sm:text-xl lg:text-2xl font-medium text-yellow-400 tracking-[0.2em] mb-2 sm:mb-3 uppercase px-4">
                            {mode === 'sports'
                                ? 'Sports winner is'
                                : eventName
                                    ? `Winner of ${eventName} is`
                                    : 'Winner is'}
                        </p>

                        {/* House Name */}
                        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-wide uppercase font-sans px-4">
                            {houseName} House
                        </h1>
                    </div>
                )}

            </div>
        </div>
    );
};

export default WinnerCelebration;
