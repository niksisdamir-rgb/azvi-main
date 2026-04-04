import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import type { ComponentProps } from "react";

type GlassVariant = "dark" | "card" | "login";

const variantClass: Record<GlassVariant, string> = {
  dark: "glass-dark overflow-hidden",
  card: "glass-card",
  login: "glass-login transition-all hover:border-white/10",
};

// ─── GlassCard ────────────────────────────────────────────────────────────────
export interface GlassCardProps extends ComponentProps<typeof Card> {
  /**
   * Glass surface variant:
   * - "dark"  → deep dark panel  (list cards, main content containers)
   * - "card"  → subtle card tint (stat cards, settings sections)
   * - "login" → white-tinted     (auth cards)
   */
  variant?: GlassVariant;
}

/**
 * Glassmorphism card wrapper around shadcn `<Card>`.
 *
 * @example
 * // Deep dark panel
 * <GlassCard variant="dark">...</GlassCard>
 *
 * @example
 * // Stat card with accent border
 * <GlassCard variant="card" className="hover:border-primary/40">
 *   <CardHeader>...</CardHeader>
 * </GlassCard>
 */
export function GlassCard({
  variant = "card",
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <Card className={cn(variantClass[variant], className)} {...props}>
      {children}
    </Card>
  );
}

// ─── Convenience re-exports so callers keep a single import ──────────────────
export { CardContent as GlassCardContent, CardHeader as GlassCardHeader, CardTitle as GlassCardTitle };
