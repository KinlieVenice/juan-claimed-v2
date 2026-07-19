import * as React from "react";
import * as answersService from "@/services/answers.service";
import type { SubmitFieldAnswerInput } from "@/services/answers.service";
import type { UserFieldAnswer, UserFieldAnswerGroup } from "@/types/domain";

interface AnswersContextValue {
  answers: UserFieldAnswer[];
  groups: UserFieldAnswerGroup[];
  loading: boolean;
  /** fieldId -> decoded value, the shape the eligibility matcher / FieldInput consume. */
  answersMap: Record<string, unknown>;
  submit: (items: SubmitFieldAnswerInput[]) => Promise<void>;
  addAnswerGroup: (fieldId: string) => Promise<UserFieldAnswerGroup>;
  refetchGroups: (fieldId: string) => Promise<void>;
}

const AnswersContext = React.createContext<AnswersContextValue | null>(null);

export function AnswersProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = React.useState<UserFieldAnswer[]>([]);
  const [groups, setGroups] = React.useState<UserFieldAnswerGroup[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    answersService.getMyFieldAnswers().then((result) => {
      if (!cancelled) {
        setAnswers(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = React.useCallback(async (items: SubmitFieldAnswerInput[]) => {
    const result = await answersService.submitFieldAnswers(items);
    setAnswers(result);
  }, []);

  const addAnswerGroup = React.useCallback(async (fieldId: string) => {
    const group = await answersService.createAnswerGroup(fieldId);
    setGroups((prev) => [...prev, group]);
    return group;
  }, []);

  const refetchGroups = React.useCallback(async (fieldId: string) => {
    const result = await answersService.getMyAnswerGroups(fieldId);
    setGroups((prev) => [...prev.filter((g) => g.fieldId !== fieldId), ...result]);
  }, []);

  const answersMap = React.useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const answer of answers) {
      if (answer.repeaterGroupId === null) map[answer.fieldId] = answer.value;
    }
    return map;
  }, [answers]);

  const value = React.useMemo(
    () => ({ answers, groups, loading, answersMap, submit, addAnswerGroup, refetchGroups }),
    [answers, groups, loading, answersMap, submit, addAnswerGroup, refetchGroups],
  );

  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>;
}

export function useAnswers() {
  const ctx = React.useContext(AnswersContext);
  if (!ctx) throw new Error("useAnswers must be used within an AnswersProvider");
  return ctx;
}
