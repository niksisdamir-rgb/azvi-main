/**
 * Accessibility Utilities & Components
 * 
 * WCAG 2.1 AA compliant components and utilities for inclusive design.
 * Includes focus management, screen reader support, keyboard navigation,
 * and high contrast mode support.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface AccessibleProps {
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** ID of element that describes this element */
  'aria-describedby'?: string;
  /** ID of element that labels this element */
  'aria-labelledby'?: string;
  /** Whether the element is hidden from accessibility tree */
  'aria-hidden'?: boolean | 'true' | 'false';
  /** Role override for semantic meaning */
  role?: React.AriaRole;
}

export interface FocusableProps extends AccessibleProps {
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Whether the element is disabled */
  disabled?: boolean;
  /** Handler for focus events */
  onFocus?: React.FocusEventHandler;
  /** Handler for blur events */
  onBlur?: React.FocusEventHandler;
}

// =============================================================================
// VISUALLY HIDDEN COMPONENT
// =============================================================================

/**
 * VisuallyHidden - Hides content visually while keeping it accessible to screen readers.
 * Essential for providing context to assistive technology users without visual clutter.
 */
export function VisuallyHidden({ 
  children,
  className,
  ...props 
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        'clip-rect(0, 0, 0, 0)',
        className
      )}
      style={{
        clipPath: 'inset(50%)',
      }}
      {...props}
    >
      {children}
    </span>
  );
}

// =============================================================================
// SKIP LINK COMPONENT
// =============================================================================

/**
 * SkipLink - Allows keyboard users to skip repetitive navigation.
 * WCAG 2.4.1 Bypass Blocks - Level A
 */
export function SkipLink({ 
  href = '#main-content',
  children = 'Skip to main content',
  className,
}: { 
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

// =============================================================================
// LIVE REGION COMPONENTS
// =============================================================================

/**
 * LiveRegion - Announces dynamic content changes to screen readers.
 * WCAG 4.1.3 Status Messages - Level AA
 */
export function LiveRegion({
  children,
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
}) {
  return (
    <div
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Announce - Programmatically announce messages to screen readers.
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = React.useState('');
  const [politeness, setPoliteness] = React.useState<'polite' | 'assertive'>('polite');

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setPoliteness(priority);
    setAnnouncement('');
    // Small delay ensures the announcement is made even if content hasn't changed
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  const AnnouncerComponent = React.useCallback(() => (
    <LiveRegion aria-live={politeness}>
      {announcement}
    </LiveRegion>
  ), [announcement, politeness]);

  return { announce, AnnouncerComponent };
}

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

/**
 * FocusTrap - Traps focus within a container for modals/dialogs.
 * WCAG 2.4.3 Focus Order - Level A
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * FocusRing - Accessible focus indicator with custom styling.
 * WCAG 2.4.7 Focus Visible - Level AA
 */
export function FocusRing({
  children,
  className,
  ringColor = 'ring-primary',
  ringWidth = 'ring-2',
  ringOffset = 'ring-offset-2',
}: {
  children: React.ReactElement<{ className?: string }>;
  className?: string;
  ringColor?: string;
  ringWidth?: string;
  ringOffset?: string;
}) {
  return React.cloneElement(children, {
    className: cn(
      children.props.className,
      'focus:outline-none focus-visible:ring focus-visible:ring-offset-2',
      ringWidth,
      ringColor,
      ringOffset,
      className
    ),
  });
}

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

/**
 * useKeyboardNavigation - Hook for keyboard navigation patterns.
 */
export function useKeyboardNavigation({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onHome,
  onEnd,
}: {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}) {
  return React.useCallback(
    (event: React.KeyboardEvent) => {
      const keyMap: Record<string, (() => void) | undefined> = {
        Enter: onEnter,
        Escape: onEscape,
        ArrowUp: onArrowUp,
        ArrowDown: onArrowDown,
        ArrowLeft: onArrowLeft,
        ArrowRight: onArrowRight,
        Home: onHome,
        End: onEnd,
      };

      const handler = keyMap[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onHome, onEnd]
  );
}

// =============================================================================
// HIGH CONTRAST MODE
// =============================================================================

/**
 * useHighContrast - Detects if user prefers high contrast mode.
 */
export function useHighContrast(): boolean {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

/**
 * HighContrastStyles - Applies high contrast mode styles.
 */
export function HighContrastStyles() {
  const isHighContrast = useHighContrast();

  if (!isHighContrast) return null;

  return (
    <style>{`
      :root {
        --color-border: currentColor !important;
        --ring-width: 3px !important;
      }
      
      * {
        border-color: currentColor !important;
      }
      
      :focus-visible {
        outline: 3px solid currentColor !important;
        outline-offset: 2px !important;
      }
      
      .glass-dark,
      .glass-card,
      .glass-dialog {
        background-color: Canvas !important;
        color: CanvasText !important;
        border: 2px solid currentColor !important;
      }
    `}</style>
  );
}

// =============================================================================
// SCREEN READER UTILITIES
// =============================================================================

/**
 * srOnly - CSS class for screen reader only content.
 */
export const srOnlyClass = 
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 ' +
  '[clip-path:inset(50%)]';

/**
 * ariaCurrent - Helper for aria-current attribute.
 */
export function ariaCurrent(isCurrent: boolean, type: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' = 'true') {
  return isCurrent ? type : undefined;
}

/**
 * AccessibleIcon - Makes icons accessible with proper labels.
 */
export function AccessibleIcon({
  children,
  label,
  decorative = false,
}: {
  children: React.ReactElement<{ 'aria-hidden'?: boolean; 'aria-label'?: string; role?: string; focusable?: boolean }>;
  label?: string;
  decorative?: boolean;
}) {
  if (decorative) {
    return React.cloneElement(children, {
      'aria-hidden': true,
      focusable: false,
    });
  }

  return (
    <>
      {React.cloneElement(children, {
        'aria-hidden': false,
        'aria-label': label,
        role: 'img',
        focusable: false,
      })}
    </>
  );
}

// =============================================================================
// ERROR MESSAGING
// =============================================================================

/**
 * FormError - Accessible error message for form fields.
 * WCAG 3.3.1 Error Identification - Level A
 */
export function FormError({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      id={id}
      role="alert"
      className={cn('text-sm text-destructive', className)}
    >
      {children}
    </span>
  );
}

/**
 * RequiredIndicator - Visual indicator for required fields.
 */
export function RequiredIndicator({ className }: { className?: string }) {
  return (
    <span 
      className={cn('text-destructive ml-0.5', className)}
      aria-hidden="true"
    >
      *
    </span>
  );
}

// =============================================================================
// ARIA HELPERS
// =============================================================================

/**
 * Generate unique IDs for accessibility attributes.
 */
export function useUniqueId(prefix: string): string {
  const [id] = React.useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
}

/**
 * DescribedBy - Combines multiple description IDs.
 */
export function describedBy(...ids: (string | undefined)[]): string | undefined {
  const validIds = ids.filter(Boolean);
  return validIds.length > 0 ? validIds.join(' ') : undefined;
}

/**
 * LabelledBy - Combines multiple label IDs.
 */
export function labelledBy(...ids: (string | undefined)[]): string | undefined {
  const validIds = ids.filter(Boolean);
  return validIds.length > 0 ? validIds.join(' ') : undefined;
}

// =============================================================================
// ACCESSIBILITY CHECKS
// =============================================================================

/**
 * Check if element has sufficient color contrast.
 * Returns approximate contrast ratio.
 */
export function getContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards.
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const thresholds = {
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 },
  };
  return ratio >= thresholds[level][size];
}
