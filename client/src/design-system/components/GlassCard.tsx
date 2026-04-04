/**
 * GlassCard - Enhanced Glass Morphism Card Component
 * 
 * A sophisticated card component with glass morphism effects,
 * micro-interactions, and accessibility features.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHoverVariants, glassHoverVariants, useReducedMotion } from '../animations';

// =============================================================================
// TYPES
// =============================================================================

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: 'default' | 'dark' | 'light' | 'elevated';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to enable hover animations */
  hover?: boolean;
  /** Whether to show glow effect on hover */
  glow?: boolean;
  /** Border radius override */
  radius?: 'none' | 'sm' | 'DEFAULT' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Padding override */
  padding?: string;
  /** Content of the card */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hover = true,
      glow = false,
      radius = 'xl',
      padding,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    // Variant styles
    const variantStyles = {
      default: 'bg-card/80 backdrop-blur-xl border border-white/10',
      dark: 'bg-black/40 backdrop-blur-xl border border-white/10',
      light: 'bg-white/10 backdrop-blur-xl border border-white/20',
      elevated: 'bg-card/90 backdrop-blur-2xl border border-white/15 shadow-2xl',
    };

    // Size-based padding
    const sizePadding = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    // Border radius classes
    const radiusClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      DEFAULT: 'rounded',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      full: 'rounded-full',
    };

    // Base classes
    const baseClasses = cn(
      // Base styles
      'relative overflow-hidden',
      'transition-colors duration-300',
      
      // Variant
      variantStyles[variant],
      
      // Size/padding
      padding ? padding : sizePadding[size],
      
      // Border radius
      radiusClasses[radius],
      
      // Glow effect
      glow && 'hover:shadow-[0_0_30px_rgba(255,108,14,0.15)]',
      
      // Custom classes
      className
    );

    // Animation variants
    const variants = glow ? glassHoverVariants : cardHoverVariants;

    if (prefersReducedMotion || !hover) {
      return (
        <div ref={ref} className={baseClasses}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        initial="initial"
        whileHover="hover"
        variants={variants}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// =============================================================================
// CARD SECTIONS
// =============================================================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'text-xl font-semibold leading-none tracking-tight',
        'text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 mt-auto', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

// =============================================================================
// CARD DIVIDER
// =============================================================================

export function CardDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent',
        'my-4',
        className
      )}
    />
  );
}

// =============================================================================
// CARD BADGE
// =============================================================================

export interface CardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function CardBadge({
  children,
  variant = 'default',
  className,
  ...props
}: CardBadgeProps) {
  const variantStyles = {
    default: 'bg-white/10 text-white/80',
    primary: 'bg-primary/20 text-primary',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-amber-500/20 text-amber-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
