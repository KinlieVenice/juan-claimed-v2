// A small claymorphic mascot placeholder for the landing page only (per brand direction:
// "soft border radius with a little bit of claymorphism... character design on the
// landing page only"). Swap for a real illustrated character asset when available.
export function ClayBadge() {
  return (
    <div className="relative mx-auto flex size-40 items-center justify-center">
      <div
        className="absolute size-36 rotate-6 rounded-[2.5rem]"
        style={{
          background: "linear-gradient(145deg, #f2c500, #d9ae00)",
          boxShadow: "0 18px 30px -12px rgba(242,197,0,0.55), inset 0 -6px 10px rgba(0,0,0,0.08), inset 0 4px 6px rgba(255,255,255,0.5)",
        }}
      />
      <div
        className="absolute size-32 -rotate-6 rounded-[2.25rem]"
        style={{
          background: "linear-gradient(145deg, #a60c0c, #7f0909)",
          boxShadow: "0 14px 24px -10px rgba(166,12,12,0.5), inset 0 -6px 10px rgba(0,0,0,0.12), inset 0 4px 6px rgba(255,255,255,0.25)",
        }}
      />
      <div
        className="relative flex size-28 items-center justify-center rounded-[2rem]"
        style={{
          background: "linear-gradient(150deg, #2f5bff, #0040e7)",
          boxShadow: "0 20px 32px -12px rgba(0,64,231,0.55), inset 0 -8px 12px rgba(0,0,0,0.15), inset 0 5px 8px rgba(255,255,255,0.35)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-12 text-white drop-shadow-sm">
          <path
            d="M12 3l7 3v5c0 4.5-3 8.3-7 9.5-4-1.2-7-5-7-9.5V6l7-3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.12)"
          />
          <path d="M9 12.2l2 2 4-4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
