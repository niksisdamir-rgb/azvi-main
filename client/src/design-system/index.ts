/**
 * AzVirt Design System
 * 
 * A comprehensive, accessible, and performant design system
 * following 21.dev methodologies and WCAG 2.1 AA standards.
 */

// =============================================================================
// TOKENS
// =============================================================================

export {
  // Color palette
  colors,
  // Typography scale
  typography,
  // Spacing scale
  spacing,
  // Shadow system
  shadows,
  // Border radius
  borderRadius,
  // Transitions
  transitions,
  // Z-index scale
  zIndex,
  // Breakpoints
  breakpoints,
  // Grid system
  grid,
  // Accessibility constants
  accessibility,
  // Glass morphism tokens
  glass,
} from './tokens';

export type {
  ColorToken,
  FontSizeToken,
  FontWeightToken,
  SpacingToken,
  ShadowToken,
  RadiusToken,
  ZIndexToken,
  BreakpointToken,
  TransitionToken,
  AnimationToken,
} from './tokens';

// =============================================================================
// ANIMATIONS
// =============================================================================

export {
  // Variants
  fadeVariants,
  fadeUpVariants,
  fadeDownVariants,
  scaleVariants,
  slideFromLeftVariants,
  slideFromRightVariants,
  staggerContainerVariants,
  staggerItemVariants,
  popVariants,
  buttonTapVariants,
  cardHoverVariants,
  glassHoverVariants,
  shimmerVariants,
  
  // Components
  AnimatedContainer,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  ScaleOnHover,
  AnimatedCard,
  Pulse,
  Shimmer,
  PageTransition,
  ModalOverlay,
  ModalContent,
  ScrollReveal,
  Parallax,
  SkeletonPulse,
  AnimatedSpinner,
  
  // Hooks
  useReducedMotion,
  useScrollProgress,
} from './animations';

// =============================================================================
// ACCESSIBILITY
// =============================================================================

export {
  // Components
  VisuallyHidden,
  SkipLink,
  LiveRegion,
  FocusRing,
  FormError,
  RequiredIndicator,
  HighContrastStyles,
  AccessibleIcon,
  
  // Hooks
  useAnnouncer,
  useFocusTrap,
  useKeyboardNavigation,
  useHighContrast,
  useUniqueId,
  
  // Utilities
  srOnlyClass,
  ariaCurrent,
  describedBy,
  labelledBy,
  getContrastRatio,
  meetsContrastRequirement,
} from './accessibility';

export type {
  AccessibleProps,
  FocusableProps,
} from './accessibility';

// =============================================================================
// COMPONENTS
// =============================================================================

export {
  GlassCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardDivider,
  CardBadge,
} from './components/GlassCard';

export type {
  GlassCardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  CardBadgeProps,
} from './components/GlassCard';
