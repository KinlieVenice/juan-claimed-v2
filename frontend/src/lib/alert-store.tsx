import * as React from "react";
import { ApiError } from "@/lib/api";
import { AlertModal, type AlertVariant } from "@/components/ui/alert-modal";

interface ShowAlertInput {
  variant: AlertVariant;
  message: string;
  title?: string;
}

interface AlertContextValue {
  showAlert: (input: ShowAlertInput) => void;
  /** Convenience for a catch block: shows `err.message` (backend's own `error` string) as
   * an error alert if `err` is an ApiError, otherwise a generic fallback. */
  showApiError: (err: unknown, fallback?: string) => void;
}

const AlertContext = React.createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ShowAlertInput | null>(null);

  const showAlert = React.useCallback((input: ShowAlertInput) => setState(input), []);

  const showApiError = React.useCallback(
    (err: unknown, fallback = "Something went wrong. Please try again.") => {
      setState({ variant: "error", message: err instanceof ApiError ? err.message : fallback });
    },
    [],
  );

  const value = React.useMemo(() => ({ showAlert, showApiError }), [showAlert, showApiError]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {state && <AlertModal open={!!state} onOpenChange={(open) => !open && setState(null)} variant={state.variant} title={state.title} message={state.message} />}
    </AlertContext.Provider>
  );
}

// Surfaces the backend's own message/error string directly — every ApiEnvelope response
// (success or failure) already carries one meant to be shown to the user as-is.
export function useAlert() {
  const ctx = React.useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within an AlertProvider");
  return ctx;
}
