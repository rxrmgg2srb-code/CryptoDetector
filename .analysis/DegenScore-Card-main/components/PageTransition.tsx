/**
 * Page Transition Component
 *
 * Smooth page transitions and route changes
 * Improves perceived performance and user experience
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'scale' | 'blur';
  duration?: number;
}

export default function PageTransition({
  children,
  variant = 'fade',
  duration = 0.3,
}: PageTransitionProps) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(10px)' },
    },
  };

  const currentVariant = variants[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={currentVariant.initial}
        animate={currentVariant.animate}
        exit={currentVariant.exit}
        transition={{ duration }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Stagger Children Animation
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Stagger Item
export function StaggerItem({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// Fade In On Scroll
export function FadeInOnScroll({
  children,
  threshold = 0.1,
}: {
  children: ReactNode;
  threshold?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Scale On Hover
export function ScaleOnHover({ children, scale = 1.05 }: { children: ReactNode; scale?: number }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.div>
  );
}

// Bounce Animation
export function BounceAnimation({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 500,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

// Pulse Animation (for notifications, badges)
export function PulseAnimation({ children, scale = 1.1 }: { children: ReactNode; scale?: number }) {
  return (
    <motion.div
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Shake Animation (for errors, warnings)
export function ShakeAnimation({
  children,
  trigger = false,
}: {
  children: ReactNode;
  trigger?: boolean;
}) {
  return (
    <motion.div
      animate={
        trigger
          ? {
              x: [0, -10, 10, -10, 10, 0],
            }
          : {}
      }
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

// Slide In From Side
export function SlideInFromSide({
  children,
  direction = 'left',
  delay = 0,
}: {
  children: ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
}) {
  const directions = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    top: { x: 0, y: -100 },
    bottom: { x: 0, y: 100 },
  };

  const initial = directions[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...initial }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Count Up Animation (for numbers)
export function CountUpAnimation({ value }: { value: number }) {
  return (
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

// Progress Bar Animation
export function ProgressBar({ progress, color = 'cyan' }: { progress: number; color?: string }) {
  const colors = {
    cyan: 'from-cyan-500 to-blue-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    purple: 'from-purple-500 to-pink-500',
  };

  const selectedColor = colors[color as keyof typeof colors] || colors.cyan;

  return (
    <div className="w-full h-2 bg-gray-700/30 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full bg-gradient-to-r ${selectedColor}`}
      />
    </div>
  );
}
