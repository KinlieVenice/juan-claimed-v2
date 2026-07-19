import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelFieldProps {
  label: string;
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
}

// The outlined/floating-label shell every FieldInput control shares: border-only
// container, label sits as a placeholder inside the field and floats up onto the top
// border on focus or once filled — built on plain Tailwind (peer-independent — driven by
// explicit focus/hasValue state so it works identically for text inputs, selects, date
// pickers, and composite controls like Duration's value+unit pair).
export function FloatingLabelField({
  label,
  htmlFor,
  hasValue,
  required,
  disabled,
  error,
  hint,
  badge,
  children,
  className,
}: FloatingLabelFieldProps) {
  const [focused, setFocused] = React.useState(false);
  const floated = focused || hasValue;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "relative rounded-lg border bg-background transition-colors",
          error ? "border-destructive" : focused ? "border-primary ring-2 ring-primary/15" : "border-input",
          disabled && "bg-muted/50 opacity-70",
        )}
      >
        <label
          htmlFor={htmlFor}
          className={cn(
            "pointer-events-none absolute left-3 z-10 origin-left bg-background px-1 text-muted-foreground transition-all duration-150",
            floated ? "top-0 -translate-y-1/2 text-xs font-medium" : "top-1/2 -translate-y-1/2 text-sm",
            focused && !error && "text-primary",
            error && floated && "text-destructive",
          )}
        >
          {label}
          {required && <span className="text-destructive"> *</span>}
        </label>

        {badge && <div className="absolute -top-2.5 right-3 z-10">{badge}</div>}

        <div className="min-h-11 px-3 pt-4 pb-1.5">{children}</div>
      </div>

      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
