import * as React from "react";
import * as answersService from "@/services/answers.service";
import type { SubmitFieldAnswerInput } from "@/services/answers.service";
import type { UserFieldAnswer, UserFieldAnswerGroup } from "@/types/domain";
import { useAuth } from "@/lib/auth";

interface AnswersContextValue {
  answers: UserFieldAnswer[];
  groups: UserFieldAnswerGroup[];
  loading: boolean;
  /** fieldId -> decoded value, the shape the eligibility matcher / FieldInput consume. */
  answersMap: Record<string, unknown>;
  /** REPEATER_GROUP fieldId -> its row data (subfieldId -> value per row), same shape the
   * backend's resolveRepeaterRowsWith produces — needed client-side only for a guest's
   * eligibility POST body (an authenticated check resolves this server-side instead). */
  repeaterRowsMap: Record<string, Array<Record<string, unknown>>>;
  submit: (items: SubmitFieldAnswerInput[]) => Promise<void>;
  addAnswerGroup: (fieldId: string) => Promise<UserFieldAnswerGroup>;
  refetchGroups: (fieldId: string) => Promise<void>;
  /** True for a signed-out visitor ("Explore your benefits" with no account) — answers
   * live only in this browser's localStorage and are never sent to the backend, matching
   * the "public/no account" flow: same quiz/eligibility experience as a signed-in USER,
   * but nothing persists server-side and nothing survives a different browser/device. */
  isGuest: boolean;
  /** Clears a guest's local answers/groups entirely. No-op when signed in — a real
   * account's answers live server-side and aren't something a client-side action erases. */
  resetGuestAnswers: () => void;
}

const AnswersContext = React.createContext<AnswersContextValue | null>(null);

const GUEST_STORAGE_KEY = "jc.guest-answers";

interface GuestState {
  answers: UserFieldAnswer[];
  groups: UserFieldAnswerGroup[];
}

function readGuestState(): GuestState {
  if (typeof window === "undefined") return { answers: [], groups: [] };
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return { answers: [], groups: [] };
    const parsed = JSON.parse(raw) as Partial<GuestState>;
    return { answers: parsed.answers ?? [], groups: parsed.groups ?? [] };
  } catch {
    return { answers: [], groups: [] };
  }
}

function writeGuestState(state: GuestState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
}

let guestSeq = 0;
const guestId = () => `guest-${Date.now()}-${guestSeq++}`;

export function AnswersProvider({ children }: { children: React.ReactNode }) {
  const { token, role, loading: authLoading } = useAuth();
  const isGuest = role === "GUEST";

  const [answers, setAnswers] = React.useState<UserFieldAnswer[]>([]);
  const [groups, setGroups] = React.useState<UserFieldAnswerGroup[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Waits on auth's own rehydration first — otherwise a page refresh with a valid stored
  // session would briefly read as "guest" (role defaults to GUEST until GET /api/auth/me
  // resolves) and load the wrong source before flipping over.
  React.useEffect(() => {
    if (authLoading) return;

    if (isGuest) {
      const state = readGuestState();
      setAnswers(state.answers);
      setGroups(state.groups);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    answersService.getMyFieldAnswers(token ?? undefined).then((result) => {
      if (!cancelled) {
        setAnswers(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isGuest, token]);

  const submit = React.useCallback(
    async (items: SubmitFieldAnswerInput[]) => {
      if (isGuest) {
        setAnswers((prev) => {
          const next = [...prev];
          for (const item of items) {
            const repeaterGroupId = item.repeaterGroupId ?? null;
            // Same "null if not answered" rule the real backend now enforces (see
            // fieldAnswer.service.ts's encodeFieldValue) — an untouched optional field
            // still gets a real row here, just with a null value, not silently dropped.
            const value = item.value === undefined ? null : item.value;
            const idx = next.findIndex((a) => a.fieldId === item.fieldId && a.repeaterGroupId === repeaterGroupId);
            if (idx >= 0) next[idx] = { ...next[idx], value };
            else next.push({ id: guestId(), fieldId: item.fieldId, repeaterGroupId, value });
          }
          writeGuestState({ answers: next, groups });
          return next;
        });
        return;
      }
      const result = await answersService.submitFieldAnswers(items, token ?? undefined);
      setAnswers(result);
    },
    [isGuest, token, groups],
  );

  const addAnswerGroup = React.useCallback(
    async (fieldId: string) => {
      if (isGuest) {
        const nextGroup: UserFieldAnswerGroup = { id: guestId(), fieldId, sortOrder: groups.filter((g) => g.fieldId === fieldId).length };
        const nextGroups = [...groups, nextGroup];
        setGroups(nextGroups);
        writeGuestState({ answers, groups: nextGroups });
        return nextGroup;
      }
      const group = await answersService.createAnswerGroup(fieldId, token ?? undefined);
      setGroups((prev) => [...prev, group]);
      return group;
    },
    [isGuest, token, groups, answers],
  );

  const refetchGroups = React.useCallback(
    async (fieldId: string) => {
      if (isGuest) return; // guest groups already live entirely in local state
      const result = await answersService.getMyAnswerGroups(fieldId, token ?? undefined);
      setGroups((prev) => [...prev.filter((g) => g.fieldId !== fieldId), ...result]);
    },
    [isGuest, token],
  );

  const resetGuestAnswers = React.useCallback(() => {
    setAnswers([]);
    setGroups([]);
    writeGuestState({ answers: [], groups: [] });
  }, []);

  const answersMap = React.useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const answer of answers) {
      if (answer.repeaterGroupId === null) map[answer.fieldId] = answer.value;
    }
    return map;
  }, [answers]);

  const repeaterRowsMap = React.useMemo(() => {
    const map: Record<string, Array<Record<string, unknown>>> = {};
    const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const group of sortedGroups) {
      const row: Record<string, unknown> = {};
      for (const answer of answers) {
        if (answer.repeaterGroupId === group.id) row[answer.fieldId] = answer.value;
      }
      (map[group.fieldId] ??= []).push(row);
    }
    return map;
  }, [answers, groups]);

  const value = React.useMemo(
    () => ({ answers, groups, loading, answersMap, repeaterRowsMap, submit, addAnswerGroup, refetchGroups, isGuest, resetGuestAnswers }),
    [answers, groups, loading, answersMap, repeaterRowsMap, submit, addAnswerGroup, refetchGroups, isGuest, resetGuestAnswers],
  );

  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>;
}

export function useAnswers() {
  const ctx = React.useContext(AnswersContext);
  if (!ctx) throw new Error("useAnswers must be used within an AnswersProvider");
  return ctx;
}
