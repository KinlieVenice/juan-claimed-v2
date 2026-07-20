import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Percent-of-viewport widths (dvw, matching the panel's own h-dvh — accounts for mobile
// browser chrome like the address bar instead of the static vw/vh that ignores it),
// full-width below the sm breakpoint (a 20dvw panel on a phone would be unusably narrow —
// the drawer should fill the screen on small devices instead).
const SIDE_PANEL_SIZES = {
  xs: "sm:w-[30dvw]",
  sm: "sm:w-[40dvw]",
  md: "sm:w-[50dvw]",
  lg: "sm:w-[60dvw]",
  xl: "sm:w-[70dvw]",
} as const;

export type SidePanelSize = keyof typeof SIDE_PANEL_SIZES;

export interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Width as a share of the viewport. Defaults to "md" (50dvw). */
  size?: SidePanelSize;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned action row (reverses to full-width stack on mobile). Omit for no footer. */
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  /** Omit for a confirmation-style panel that's just a title/description and a footer. */
  children?: React.ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
}

// The "modern" alternative to Modal: a right-anchored, full-height (100dvh) panel that
// slides in from off-screen on the right instead of zooming in centered. Same
// title/description/footer/children API as Modal — and composes with the same
// ModalSection for grouped content — so which one a given screen uses is a one-line swap.
// Header/footer are spacing-only like Modal's, not bordered strips.
export function SidePanel({
  open,
  onOpenChange,
  size = "md",
  title,
  description,
  footer,
  showCloseButton = true,
  children,
  contentClassName,
  bodyClassName,
}: SidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn("h-dvh w-full max-w-none sm:max-w-none gap-0 rounded-l-xl p-0", SIDE_PANEL_SIZES[size], contentClassName)}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-4 p-6">
            <div className="space-y-1">
              {title && <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>}
              {description && <SheetDescription>{description}</SheetDescription>}
            </div>
            {showCloseButton && (
              <SheetClose asChild>
                <Button type="button" size="icon" variant="ghost" className="-mt-1 -mr-1 size-8 shrink-0">
                  <X className="size-4" />
                </Button>
              </SheetClose>
            )}
          </div>
        )}

        <div className={cn("min-h-0 flex-1 space-y-7 overflow-y-auto thin-scrollbar p-6", bodyClassName)}>{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-2 p-6 sm:flex-row sm:justify-end">{footer}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
