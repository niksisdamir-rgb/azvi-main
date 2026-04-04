import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type GlassPanelVariant = "dark" | "card" | "dialog";

const variantClass: Record<GlassPanelVariant, string> = {
  dark: "glass-dark",
  card: "glass-card",
  dialog: "glass-dialog",
};

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Glass surface variant:
   * - "dark"   → deep dark (sidebar, sticky topbar, fullscreen overlays)
   * - "card"   → subtle tint (info panels)
   * - "dialog" → floating surface (dropdowns, popovers, pill badges)
   */
  variant?: GlassPanelVariant;
}

/**
 * Glassmorphism `<div>` wrapper for non-card surfaces.
 * Use for the sidebar, sticky topbar, fullscreen overlays, info panels, etc.
 *
 * @example
 * // Sticky header bar
 * <GlassPanel variant="dark" className="flex h-14 items-center px-4">
 *   ...
 * </GlassPanel>
 *
 * @example
 * // Inline badge
 * <GlassPanel variant="dialog" className="px-4 py-2 rounded-full text-xs">
 *   GPS fix
 * </GlassPanel>
 */
export function GlassPanel({
  variant = "dark",
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div className={cn(variantClass[variant], className)} {...props}>
      {children}
    </div>
  );
}
