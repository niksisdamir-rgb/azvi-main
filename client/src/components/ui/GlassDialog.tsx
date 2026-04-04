import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import type { ComponentProps } from "react";

// ─── GlassDialog ──────────────────────────────────────────────────────────────
export interface GlassDialogContentProps extends ComponentProps<typeof DialogContent> {
  /**
   * Additional className applied on top of the base glass-dialog token.
   * Use this for width/height overrides, e.g. "sm:max-w-[425px]" or "max-w-4xl".
   */
  className?: string;
}

/**
 * Glassmorphism dialog content wrapper around shadcn `<DialogContent>`.
 * The `glass-dialog` CSS token is baked in — callers only specify layout overrides.
 *
 * @example
 * <GlassDialog>
 *   <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
 *   <GlassDialogContent className="sm:max-w-[425px]">
 *     <DialogHeader>
 *       <DialogTitle>My Dialog</DialogTitle>
 *     </DialogHeader>
 *   </GlassDialogContent>
 * </GlassDialog>
 */
export function GlassDialogContent({
  className,
  children,
  ...props
}: GlassDialogContentProps) {
  return (
    <DialogContent className={cn("glass-dialog", className)} {...props}>
      {children}
    </DialogContent>
  );
}

// ─── Convenience re-exports ───────────────────────────────────────────────────
export {
  Dialog as GlassDialog,
  DialogHeader as GlassDialogHeader,
  DialogTitle as GlassDialogTitle,
  DialogDescription as GlassDialogDescription,
  DialogTrigger as GlassDialogTrigger,
};
