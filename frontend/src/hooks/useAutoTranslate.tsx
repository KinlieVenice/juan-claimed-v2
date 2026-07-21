import * as React from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { translateText } from "@/services/translate.service";

const DEBOUNCE_MS = 1000;

interface UseAutoTranslateOptions {
  /** The English text to translate from. */
  sourceValue: string;
  onTargetChange: (value: string) => void;
  token: string | null | undefined;
  /** Set false to fully disable (e.g. an eGov-locked field, or a view-only modal). */
  enabled?: boolean;
}

interface UseAutoTranslateResult {
  /** Wire this to the Tagalog field's onChange instead of onTargetChange directly — it's
   * what tells the hook "the configurer typed here themselves," which stops auto-sync until
   * the restart button is pressed. */
  handleTargetChange: (value: string) => void;
  /** Drop straight into TextField/TextareaField's `badge` prop — a small restart icon that
   * re-fetches the translation from the current English text, overwriting any manual edit. */
  badge: React.ReactNode;
  loading: boolean;
}

// Auto-fills a Tagalog field from its English counterpart as the configurer types, via eGov's
// AI Core translator (see translate.service.ts). Once the configurer edits the Tagalog field
// directly, auto-sync stops for that field (their wording wins) — the badge's restart icon
// lets them explicitly re-translate from the current English text if they want it back.
export function useAutoTranslate({ sourceValue, onTargetChange, token, enabled = true }: UseAutoTranslateOptions): UseAutoTranslateResult {
  const [touched, setTouched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  // Distinguishes "the hook itself just wrote to targetValue" from "the configurer typed in
  // the box" — both arrive through the same handleTargetChange, since the field's onChange
  // has no other way to tell them apart.
  const isProgrammaticWrite = React.useRef(false);

  // Most call sites pass an inline `onTargetChange` (e.g. `(v) => onChange({ tagalogName:
  // v })`), a new function identity every render. Keeping the LATEST one in a ref (instead of
  // a useCallback dependency) means runTranslate's own identity stays stable across renders —
  // it only actually changes when token/enabled do. Without this, a completed translation's
  // state update triggers a re-render -> new onTargetChange -> new runTranslate -> the debounce
  // effect below (which depends on runTranslate) re-arms and fires again -> forever, even
  // though the English text never changed after the first translation.
  const onTargetChangeRef = React.useRef(onTargetChange);
  React.useEffect(() => {
    onTargetChangeRef.current = onTargetChange;
  }, [onTargetChange]);

  const runTranslate = React.useCallback(
    (text: string) => {
      const prompt = text.trim();
      if (!prompt || !token || !enabled) return;
      setLoading(true);
      translateText(prompt, token)
        .then((result) => {
          isProgrammaticWrite.current = true;
          onTargetChangeRef.current(result.translated_prompt);
        })
        .catch(() => {
          // Best-effort — the configurer can always type the Tagalog text in by hand, so a
          // failed auto-translate (e.g. AI Core down) isn't worth surfacing as an error.
        })
        .finally(() => setLoading(false));
    },
    [token, enabled],
  );

  // Skips the very first run of this effect — without it, simply OPENING a modal to view or
  // edit an existing record (which loads a real, already-translated englishName straight
  // into sourceValue) counted as "the English text changed" and kicked off a background
  // retranslate a second later, silently overwriting a perfectly good existing Tagalog
  // value nobody asked to touch. Only a genuine change AFTER mount (the configurer actually
  // typing) should ever arm the debounce.
  const isFirstRun = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!enabled || touched) return;
    if (!sourceValue.trim()) return;
    const timer = setTimeout(() => runTranslate(sourceValue), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [sourceValue, touched, enabled, runTranslate]);

  const handleTargetChange = React.useCallback(
    (value: string) => {
      if (isProgrammaticWrite.current) {
        isProgrammaticWrite.current = false;
      } else {
        setTouched(true);
      }
      onTargetChange(value);
    },
    [onTargetChange],
  );

  const handleRestart = () => {
    setTouched(false);
    runTranslate(sourceValue);
  };

  const badge =
    enabled && token ? (
      <button
        type="button"
        onClick={handleRestart}
        disabled={loading || !sourceValue.trim()}
        title="Restart translation from the English text"
        className="flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0 text-[9px] text-muted-foreground shadow-sm transition hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-2.5 animate-spin" /> : <RotateCcw className="size-2.5" />}
        {loading ? "Translating…" : "Retranslate"}
      </button>
    ) : undefined;

  return { handleTargetChange, badge, loading };
}
