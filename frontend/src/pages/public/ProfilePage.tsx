import * as React from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { fields } from "@/mock/fields.mock";
import { useAnswers } from "@/lib/answers-store";
import { useAuth } from "@/lib/auth";
import { FieldForm } from "@/components/fields/FieldForm";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { answers, groups, answersMap, submit, loading } = useAnswers();

  const answeredFieldIds = React.useMemo(
    () => new Set(answers.filter((a) => a.repeaterGroupId === null).map((a) => a.fieldId)),
    [answers],
  );

  // Unanswered FOLLOW_UP fields never show here — only via Answer More. A field earns its
  // place on Profile either by having a direct answer, or (for REPEATER_GROUP) by having
  // at least one row started.
  const profileFields = fields
    .filter((f) => f.parentFieldId === null)
    .filter((f) => (f.fieldInputType.value === "REPEATER_GROUP" ? groups.some((g) => g.fieldId === f.id) : answeredFieldIds.has(f.id)))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleChange = (fieldId: string, value: unknown) => submit([{ fieldId, value }]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-16 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary/10 text-lg text-primary">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {profileFields.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No Profile Info Yet"
          description="Complete the initial form to start building your profile."
          action={{ label: "Go to Form", onClick: () => navigate("/form") }}
        />
      ) : (
        <FieldForm fields={profileFields} values={answersMap} onChange={handleChange} />
      )}
    </div>
  );
}
