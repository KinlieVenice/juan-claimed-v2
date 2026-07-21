import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelFieldProps {
  label: string;
  /** Small parenthesized, italicized text right beside the label, e.g. its Tagalog
   * translation — testing only. Lives inside the same label element as `label` (not a
   * separately-positioned element), so it's always contained within the box's upper-left,
   * never able to render outside it. */
  sublabel?: string;
  htmlFor?: string;
  /** Whether the field currently holds a value — floats the label even when not focused. */
  hasValue: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  /** e.g. a "Synced from eGovPH" badge, rendered top-right of the field. */
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * Overrides internal focus-tracking entirely. Pass this when the wrapped control has its
   * own more-reliable "active" signal (e.g. a Radix Select's open state) — plain DOM
   * focus/blur bubbling from a control whose FocusScope moves focus into/out of a portal
   * (Select's listbox, a Popover's content) fires spurious focus/blur on the trigger as that
   * happens, producing a visible label/border flicker that has nothing to do with real user
   * intent. When provided, the div's onFocus/onBlur listeners aren't attached at all.
   */
  active?: boolean;
  /** Skips the "click anywhere in the box reaches the control" cascade below — for a
   * composite control with more than one independently-clickable target (e.g. a
   * multi-level cascading hierarchy select), where forwarding every click to the FIRST
   * control found would make every level but the first unreachable by clicking near it. */
  disableClickCascade?: boolean;
}

// The app-wide filled/floating-label shell: gray-filled container, label sits as a
// placeholder inside the field and floats up to a small caption sitting inside the top of
// the box on focus or once filled — built on plain Tailwind (peer-independent — driven by
// explicit focus/hasValue state so it works identically for text inputs, selects, date
// pickers, and composite controls like Duration's value+unit pair). Deliberately the
// "filled" variant (label stays inside the box) rather than "outlined" (label straddles the
// border) — the latter needs a background cutout behind the label to look clean, and this
// field has none, so a straddling label would visibly cross the border line.
// `TextField`/`SelectField` in text-field.tsx wrap this for the common cases; FieldInput.tsx
// wires it into the DimField-driven public form directly.
export function FloatingLabelField({
  label,
  sublabel,
  htmlFor,
  hasValue,
  required,
  disabled,
  error,
  hint,
  badge,
  children,
  className,
  active,
  disableClickCascade,
}: FloatingLabelFieldProps) {
  const [internalFocused, setInternalFocused] = React.useState(false);
  const isActiveControlled = active !== undefined;
  const focused = isActiveControlled ? active : internalFocused;
  const floated = focused || hasValue;
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Clicking anywhere in the box — the padding, the label, empty space beside a short
  // value — should still reach the actual control, not just a click landing exactly on it.
  // Skip if the click already landed on an interactive element (avoids double-triggering,
  // e.g. re-closing a Select that a direct click just opened).
  const cascadeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, button, textarea, select, [role='combobox']")) return;
    const control = contentRef.current?.querySelector<HTMLElement>("input, button, textarea, select, [role='combobox']");
    if (!control) return;
    // .click() only reliably triggers the browser's default action for button-like elements
    // (opens a Select/Popover trigger) — it does NOT focus a plain text input the way a real
    // mouse click does, so a synthetic click alone silently did nothing for TextField. Inputs
    // need an explicit .focus() instead.
    if (control.tagName === "INPUT" || control.tagName === "TEXTAREA") {
      control.focus();
    } else {
      control.click();
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        onFocus={isActiveControlled ? undefined : () => setInternalFocused(true)}
        onBlur={isActiveControlled ? undefined : () => setInternalFocused(false)}
        onClick={disableClickCascade ? undefined : cascadeClick}
        className={cn(
          "relative rounded-lg border transition-colors",
          // A flat bg-muted/50 + opacity-70 fade used to apply to every field alike, enabled
          // or not — every field looked equally "disabled" regardless of whether it actually
          // was. bg-white read as too stark, plain bg-background (#f7f8fc, same token the
          // admin side uses) still read as a touch too gray — #fafbfe splits the difference,
          // a small nudge lighter than --background rather than jumping to pure white.
          // Disabled stays on bg-muted/70 here (admin's own baseline) — field-surface-disabled
          // is a plain marker class (no styles of its own) that index.css's .apply-bg scope
          // hooks to lighten it further just on the user side, where the same gray read
          // noticeably grayer against the cream/gradient apply-bg backdrop than it does here.
          disabled ? "bg-muted/70 field-surface-disabled" : "bg-[#fafbfe]",
          error ? "border-destructive" : focused ? "border-primary ring-2 ring-primary/15" : "border-input",
          disabled ? "cursor-default" : "cursor-text",
        )}
      >
        <label
          htmlFor={htmlFor}
          className={cn(
            "pointer-events-none absolute left-3 top-0 z-10 block max-w-[calc(100%-1.5rem)] origin-left truncate text-muted-foreground transition-all duration-150",
            !floated && "top-1/2 -translate-y-1/2",
            focused && !error && "text-primary",
            error && floated && "text-destructive",
          )}
        >
          <span className={floated ? "text-[11px] font-medium leading-none" : "text-sm"}>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </span>
          {sublabel && <span className="ml-1 text-[9px] font-normal text-muted-foreground/70 italic">({sublabel})</span>}
        </label>

        {badge && <div className="absolute -top-2.5 right-3 z-10">{badge}</div>}

        <div ref={contentRef} className="min-h-11 px-3 pt-5 pb-1.5">
          {children}
        </div>
      </div>

      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
