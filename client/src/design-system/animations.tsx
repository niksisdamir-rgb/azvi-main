/**
 * Animation Components & Utilities
 * 
 * Framer Motion-based animation system for micro-interactions,
 * page transitions, and delightful user experiences.
 */

import * as React from 'react';
import { 
  motion, 
  AnimatePresence, 
  type Variants, 
  type Transition,
  type TargetAndTransition,
} from 'framer-motion';

// Easing definitions compatible with Framer Motion
const easing = {
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.175, 0.885, 0.32, 1.275] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: easing.easeOut }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, ease: easing.easeIn }
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: easing.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2, ease: easing.easeIn }
  },
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: easing.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2, ease: easing.easeIn }
  },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: easing.spring 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2, ease: easing.easeIn }
  },
};

export const slideFromLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: easing.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: -30,
    transition: { duration: 0.2, ease: easing.easeIn }
  },
};

export const slideFromRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: easing.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: 30,
    transition: { duration: 0.2, ease: easing.easeIn }
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: easing.easeIn,
    },
  },
};

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

// =============================================================================
// MICRO-INTERACTION VARIANTS
// =============================================================================

export const buttonTapVariants: Variants = {
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

export const cardHoverVariants: Variants = {
  initial: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  hover: { 
    y: -4, 
    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
    transition: { duration: 0.3, ease: easing.easeOut }
  },
};

export const glassHoverVariants: Variants = {
  initial: { 
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 0 0 rgba(255, 108, 14, 0)',
  },
  hover: { 
    borderColor: 'rgba(255, 108, 14, 0.3)',
    boxShadow: '0 0 20px rgba(255, 108, 14, 0.15)',
    transition: { duration: 0.3 }
  },
};

export const shimmerVariants: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear',
    },
  },
};

// =============================================================================
// REUSABLE ANIMATION COMPONENTS
// =============================================================================

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  initial?: 'hidden' | 'visible' | 'exit' | TargetAndTransition;
  animate?: 'hidden' | 'visible' | 'exit' | TargetAndTransition;
  exit?: 'hidden' | 'visible' | 'exit' | TargetAndTransition;
  transition?: Transition;
  delay?: number;
}

export function AnimatedContainer({
  children,
  className,
  variants = fadeUpVariants,
  initial = 'hidden',
  animate = 'visible',
  exit = 'exit',
  transition,
  delay = 0,
}: AnimatedContainerProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={{ ...transition, delay }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.05,
  delayChildren = 0.1,
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
}

export function FadeIn({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.4,
  distance = 20,
}: FadeInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
      default: return {};
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration, 
        delay,
        ease: easing.easeOut 
      }}
    >
      {children}
    </motion.div>
  );
}

interface ScaleOnHoverProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function ScaleOnHover({
  children,
  className,
  scale = 1.02,
}: ScaleOnHoverProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function AnimatedCard({
  children,
  className,
  hover = true,
  glass = false,
}: AnimatedCardProps) {
  const variants = glass ? glassHoverVariants : cardHoverVariants;

  return (
    <motion.div
      className={className}
      initial="initial"
      whileHover={hover ? 'hover' : undefined}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

interface PulseProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function Pulse({
  children,
  className,
  intensity = 1.05,
}: PulseProps) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, intensity, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <motion.div
      className={className}
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={window.location.pathname}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: easing.easeOut }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface ModalOverlayProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export function ModalOverlay({
  children,
  isOpen,
  onClose,
  className,
}: ModalOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <motion.div
      className={className}
      variants={scaleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// SCROLL ANIMATIONS
// =============================================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  threshold = 0.1,
  delay = 0,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.5, delay, ease: easing.easeOut }}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

export function Parallax({ children, className, speed = 0.5 }: ParallaxProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: -50 * speed }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.8, ease: easing.easeOut }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// LOADING ANIMATIONS
// =============================================================================

interface SkeletonPulseProps {
  className?: string;
}

export function SkeletonPulse({ className }: SkeletonPulseProps) {
  return (
    <motion.div
      className={className}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedSpinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        className="w-full h-full text-primary"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </motion.div>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export function useScrollProgress(): number {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(Math.max(scrollProgress, 0), 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}
