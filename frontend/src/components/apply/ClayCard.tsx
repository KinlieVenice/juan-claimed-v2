import { cn } from "@/lib/utils";

export type ClayVariant = "plain" | "blue" | "red" | "yellow" | "green";

const VARIANT_CLASS: Record<ClayVariant, string> = {
  plain: "clay",
  blue: "clay-blue",
  red: "clay-red",
  yellow: "clay-yellow",
  green: "clay-green",
};

interface ClayCardProps {
  variant?: ClayVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// The base building block of every apply/* page — a soft neumorphic ("clay") card in one of
// the co-dev's four brand tints. Purely presentational; never wraps admin/agent UI.
export function ClayCard({ variant = "plain", className, children, onClick }: ClayCardProps) {
  return (
    <div className={cn(VARIANT_CLASS[variant], onClick && "cursor-pointer transition hover:-translate-y-1", className)} onClick={onClick}>
      {children}
    </div>
  );
}
