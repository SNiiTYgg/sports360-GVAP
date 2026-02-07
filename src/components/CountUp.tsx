/**
 * CountUp Component - Slot-machine style animated number
 * 
 * Creates a rolling digit animation effect using Framer Motion.
 * Each digit scrolls vertically like a slot machine from 0 to target.
 */

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';

interface DigitProps {
    digit: number;
    fontSize: number;
}

/**
 * Single animated digit that rolls like a slot machine
 */
const AnimatedDigit = ({ digit, fontSize }: DigitProps) => {
    const springValue = useSpring(0, {
        stiffness: 100,
        damping: 20,
        mass: 1,
    });

    useEffect(() => {
        springValue.set(digit);
    }, [digit, springValue]);

    return (
        <div
            style={{
                height: fontSize,
                width: fontSize * 0.6,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Stack of digits 0-9 that scrolls */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Digit key={num} mv={springValue} num={num} fontSize={fontSize} />
            ))}
        </div>
    );
};

interface DigitInternalProps {
    mv: MotionValue<number>;
    num: number;
    fontSize: number;
}

const Digit = ({ mv, num, fontSize }: DigitInternalProps) => {
    const y = useTransform(mv, (latest) => {
        const offset = (num - latest) % 10;
        let adjustedOffset = offset;
        if (offset > 5) adjustedOffset = offset - 10;
        if (offset < -5) adjustedOffset = offset + 10;
        return adjustedOffset * fontSize;
    });

    return (
        <motion.span
            style={{
                y,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: fontSize,
                lineHeight: `${fontSize}px`,
                fontWeight: 'inherit',
                fontVariantNumeric: 'tabular-nums',
            }}
        >
            {num}
        </motion.span>
    );
};

interface CountUpProps {
    value: number;
    fontSize?: number;
    className?: string;
}

/**
 * Slot-machine style count-up animation
 * Splits number into digits and animates each one
 */
const CountUp = ({ value, fontSize = 24, className = '' }: CountUpProps) => {
    const hasAnimated = useRef(false);
    const isNegative = value < 0;
    const absValue = Math.abs(Math.floor(value));

    // Convert number to array of digits
    const digits = String(absValue).split('').map(Number);

    // Mark as animated after first render
    useEffect(() => {
        hasAnimated.current = true;
    }, []);

    return (
        <span
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                overflow: 'hidden',
                fontVariantNumeric: 'tabular-nums',
            }}
        >
            {isNegative && <span style={{ marginRight: 2 }}>-</span>}
            {digits.map((digit, index) => (
                <AnimatedDigit key={index} digit={digit} fontSize={fontSize} />
            ))}
        </span>
    );
};

export default CountUp;
