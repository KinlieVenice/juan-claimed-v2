// The eight-rayed sun from the Philippine flag — the recurring motif of the user-side
// ("fun") design, ported from the co-dev's static prototype (dev-feat-initial-KIN, commit
// 8baced3, landing-page/src/routes/*.tsx's local Sun component) so every apply/* page uses
// the exact same mark instead of everyone redrawing their own.
export function Sun({ spin = false, className }: { spin?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${spin ? "animate-[spin_22s_linear_infinite]" : ""} ${className ?? ""}`} aria-hidden>
      <g fill="#fcd116">
        <circle cx="50" cy="50" r="16" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x = 50 + Math.cos(a) * 30;
          const y = 50 + Math.sin(a) * 30;
          return (
            <polygon
              key={i}
              points={`${x - 3.5},${y - 3.5} ${x + 3.5},${y - 3.5} ${x},${y + 9}`}
              transform={`rotate(${i * 45 - 90} ${x} ${y})`}
            />
          );
        })}
      </g>
    </svg>
  );
}
