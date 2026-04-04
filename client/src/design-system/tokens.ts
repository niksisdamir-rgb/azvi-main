/**
 * AzVirt Design System Tokens
 * 
 * A comprehensive design system following 21.dev methodologies
 * with WCAG 2.1 AA accessibility compliance, modern typography scales,
 * and cohesive color theory.
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

/**
 * Primary color palette - Orange-based accent (#FF6C0E)
 * Using OKLCH color space for perceptually uniform colors
 */
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#FFF5ED',
    100: '#FFE6D5',
    200: '#FFC9AA',
    300: '#FFA374',
    400: '#FF7D3D',
    500: '#FF6C0E', // Brand Primary
    600: '#E55A00',
    700: '#BD4A00',
    800: '#943B00',
    900: '#6B2A00',
    950: '#3D1800',
  },

  // Neutral Scale - Warm Gray
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // Semantic Colors
  semantic: {
    success: {
      light: '#22C55E',
      DEFAULT: '#16A34A',
      dark: '#15803D',
    },
    warning: {
      light: '#F59E0B',
      DEFAULT: '#D97706',
      dark: '#B45309',
    },
    error: {
      light: '#EF4444',
      DEFAULT: '#DC2626',
      dark: '#B91C1C',
    },
    info: {
      light: '#3B82F6',
      DEFAULT: '#2563EB',
      dark: '#1D4ED8',
    },
  },

  // Dark Theme Specific
  dark: {
    background: '#0A0A0F',
    surface: '#14141B',
    elevated: '#1E1E2A',
    border: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

/**
 * Typography scale using major third (1.25) ratio
 * Base: 16px (1rem)
 * Scale: 12, 14, 16, 20, 25, 31, 39, 48, 61, 76px
 */
export const typography = {
  // Font Families
  fontFamily: {
    display: '"Rethink Sans", system-ui, -apple-system, sans-serif',
    body: '"Rethink Sans", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },

  // Font Weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Font Sizes (in rem)
  fontSize: {
    '2xs': '0.625rem',   // 10px
    xs: '0.75rem',       // 12px
    sm: '0.875rem',      // 14px
    base: '1rem',        // 16px
    lg: '1.125rem',      // 18px
    xl: '1.25rem',       // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
    '6xl': '3.75rem',    // 60px
    '7xl': '4.5rem',     // 72px
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Type Scale (Major Third - 1.25)
  scale: {
    hero: {
      fontSize: '3.815rem',    // ~61px
      lineHeight: 1.1,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h1: {
      fontSize: '3.052rem',    // ~49px
      lineHeight: 1.15,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.441rem',    // ~39px
      lineHeight: 1.2,
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: '1.953rem',    // ~31px
      lineHeight: 1.25,
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.563rem',    // ~25px
      lineHeight: 1.3,
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h5: {
      fontSize: '1.25rem',     // 20px
      lineHeight: 1.35,
      fontWeight: 600,
      letterSpacing: '0',
    },
    h6: {
      fontSize: '1rem',        // 16px
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: '0.005em',
    },
    body: {
      fontSize: '1rem',        // 16px
      lineHeight: 1.6,
      fontWeight: 400,
      letterSpacing: '0',
    },
    small: {
      fontSize: '0.875rem',    // 14px
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0',
    },
    caption: {
      fontSize: '0.75rem',     // 12px
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
  },
} as const;

// =============================================================================
// SPACING TOKENS
// =============================================================================

/**
 * Spacing scale using 4px base unit
 * Following 8-point grid system
 */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

/**
 * Elevation shadows for depth hierarchy
 * Using layered shadows for realistic depth
 */
export const shadows = {
  none: 'none',
  
  // Flat shadows
  flat: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Glass shadows (colored for glass morphism)
  glass: {
    sm: '0 1px 2px 0 rgb(255 108 14 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(255 108 14 / 0.08), 0 1px 2px -1px rgb(255 108 14 / 0.05)',
    md: '0 4px 6px -1px rgb(255 108 14 / 0.1), 0 2px 4px -2px rgb(255 108 14 / 0.08)',
    lg: '0 10px 15px -3px rgb(255 108 14 / 0.12), 0 4px 6px -4px rgb(255 108 14 / 0.1)',
    xl: '0 20px 25px -5px rgb(255 108 14 / 0.15), 0 8px 10px -6px rgb(255 108 14 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(255 108 14 / 0.25)',
  },

  // Colored glows
  glow: {
    primary: '0 0 20px rgb(255 108 14 / 0.3)',
    primarySm: '0 0 10px rgb(255 108 14 / 0.2)',
    primaryLg: '0 0 40px rgb(255 108 14 / 0.4)',
    success: '0 0 20px rgb(34 197 94 / 0.3)',
    error: '0 0 20px rgb(239 68 68 / 0.3)',
    info: '0 0 20px rgb(59 130 246 / 0.3)',
  },

  // Inner shadows
  inner: {
    sm: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
    md: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.08)',
    lg: 'inset 0 8px 16px 0 rgb(0 0 0 / 0.1)',
  },
} as const;

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',      // 4px
  DEFAULT: '0.375rem', // 6px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.25rem',   // 20px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

// =============================================================================
// TRANSITION TOKENS
// =============================================================================

export const transitions = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '150ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  property: {
    all: 'all',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
    opacity: 'opacity',
    shadow: 'box-shadow',
    transform: 'transform',
    common: 'color, background-color, border-color, box-shadow, transform',
  },
} as const;

// =============================================================================
// Z-INDEX TOKENS
// =============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// GRID SYSTEM
// =============================================================================

export const grid = {
  columns: 12,
  gutter: {
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
  },
  margin: {
    sm: '1rem',
    md: '2rem',
    lg: '4rem',
  },
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  },
} as const;

// =============================================================================
// ACCESSIBILITY CONSTANTS (WCAG 2.1 AA)
// =============================================================================

export const accessibility = {
  // Focus ring styles
  focusRing: {
    width: '2px',
    offset: '2px',
    style: 'solid',
    color: 'var(--color-primary)',
  },
  
  // Minimum touch target sizes
  touchTarget: {
    minSize: '44px',
    recommended: '48px',
  },
  
  // Contrast ratios (WCAG 2.1 AA)
  contrast: {
    normalText: 4.5,
    largeText: 3,
    uiComponents: 3,
  },
  
  // Reduced motion
  reducedMotion: {
    query: '(prefers-reduced-motion: reduce)',
    transition: 'none',
    animation: 'none',
  },
} as const;

// =============================================================================
// ANIMATION TOKENS
// =============================================================================

export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  
  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  scaleUp: {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  },
  
  // Slide animations
  slideIn: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  slideUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
  
  // Stagger children
  stagger: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
  },
} as const;

// =============================================================================
// GLASS MORPHISM TOKENS
// =============================================================================

export const glass = {
  // Background opacity levels
  opacity: {
    light: '0.1',
    DEFAULT: '0.2',
    medium: '0.4',
    dark: '0.6',
    heavier: '0.8',
  },
  
  // Backdrop blur levels
  blur: {
    sm: '4px',
    DEFAULT: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
  },
  
  // Border opacity
  borderOpacity: {
    light: '0.05',
    DEFAULT: '0.1',
    medium: '0.15',
    strong: '0.2',
  },
  
  // Saturation
  saturation: {
    low: '120%',
    DEFAULT: '150%',
    high: '180%',
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorToken = keyof typeof colors;
export type FontSizeToken = keyof typeof typography.fontSize;
export type FontWeightToken = keyof typeof typography.fontWeight;
export type SpacingToken = keyof typeof spacing;
export type ShadowToken = keyof typeof shadows;
export type RadiusToken = keyof typeof borderRadius;
export type ZIndexToken = keyof typeof zIndex;
export type BreakpointToken = keyof typeof breakpoints;
export type TransitionToken = keyof typeof transitions.duration;
export type AnimationToken = keyof typeof animations;
