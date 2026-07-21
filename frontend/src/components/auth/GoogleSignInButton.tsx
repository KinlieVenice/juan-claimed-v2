import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

// Renders Google's real "Sign in with Google" button via Google Identity Services (GIS)
// — loaded from Google's own script, not an npm dependency. On success, exchanges the
// ID token GIS hands back for our own JWT via POST /api/auth/google.
export function GoogleSignInButton() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  React.useEffect(() => {
    if (!clientId || !containerRef.current) return;

    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            loginWithGoogle(response.credential)
              .then(() => navigate("/my-benefits"))
              .catch(() => setError("Could not sign in with Google. Please try again."));
          },
        });

        // GIS's button renders as a fixed-pixel-width iframe (no "100%"/"auto" option in
        // its API) — a hardcoded 320 made it a different width than the full-width eGovPH
        // button / "Continue without signing in" link beside it whenever the column wasn't
        // exactly 320px. Measuring the actual container width here (it's `w-full`, so this
        // reflects the real available width) keeps all three visually matched. GIS caps
        // this at ~400px internally, so no extra clamping needed here.
        const measuredWidth = containerRef.current.clientWidth || 320;

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: measuredWidth,
        });
      })
      .catch(() => setError("Could not load Google Sign-In."));

    return () => {
      cancelled = true;
    };
  }, [clientId, loginWithGoogle, navigate]);

  if (!clientId) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-3 text-center text-xs text-muted-foreground">
        Google sign-in isn't configured (missing <code>VITE_GOOGLE_CLIENT_ID</code>).
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div ref={containerRef} className="flex w-full justify-center" />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
