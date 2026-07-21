import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, UserRound, Pencil, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAnswers } from "@/lib/answers-store";
import { getFields } from "@/services/fields.service";
import { renderableFields } from "@/lib/field-visibility";
import { mapEgovProfileToFieldValues, getEgovRepeaterRows } from "@/lib/egov-profile-map";
import { FieldForm } from "@/components/fields/FieldForm";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ApplyChrome, ApplyFooter } from "@/components/apply/ApplyChrome";
import { ClayCard } from "@/components/apply/ClayCard";
import type { DimField } from "@/types/domain";

// Was reading from @/mock/fields.mock (a stale gap from before the real-data pass on
// FormPage/AnswerMorePage/BenefitDetailsPage) — every answered field would've been missing
// from a real user's Profile. Fetches real fields now, same clay shell as the rest of apply/*.
//
// "Edit Fields" gates the whole form as a bulk edit, not an always-live auto-save — the
// form stays inert (read-only) until toggled on, drafts locally, and only writes to
// UserFieldAnswers on an explicit Save (Cancel discards the draft). REPEATER_GROUP rows are
// the one exception: their per-cell edits still save immediately, same as everywhere else
// a repeater is rendered — batching those too would mean rebuilding row add/remove around a
// draft state that doesn't exist yet anywhere in the app.
export function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, egovProfile } = useAuth();
  const { answers, groups, answersMap, submit, loading } = useAnswers();
  const [fields, setFields] = React.useState<DimField[] | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, unknown>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    getFields(token).then(setFields);
  }, [token]);

  // eGov SSO never writes a real FctUserFieldAnswer row (see lib/auth.tsx's egovProfile
  // comment) — this fills the same-shaped gap from the live session profile instead, purely
  // for display. DB values still win if both exist (spread order below), though in
  // practice an eGov-sourced field is locked (FieldInput.tsx) so nothing ever writes one.
  const egovValues = React.useMemo(() => mapEgovProfileToFieldValues(fields ?? [], egovProfile), [fields, egovProfile]);
  const displayValues = React.useMemo(() => ({ ...egovValues, ...answersMap }), [egovValues, answersMap]);

  // A row that exists but was left blank (null) isn't meaningfully "answered" yet — nothing
  // worth showing/editing here until it's actually filled in via Answer More.
  const answeredFieldIds = React.useMemo(() => {
    const ids = new Set(answers.filter((a) => a.repeaterGroupId === null && a.value !== null).map((a) => a.fieldId));
    for (const fieldId of Object.keys(egovValues)) ids.add(fieldId);
    return ids;
  }, [answers, egovValues]);

  // Unanswered FOLLOW_UP fields never show here — only via Answer More. A field earns its
  // place on Profile either by having a direct answer, or (for REPEATER_GROUP) by having
  // at least one row started — either a real one (groups) or, for an eGovField repeater
  // like Educational Attainment, a live eGov row (see FieldForm's EgovRepeaterPreview
  // branch, which reads the exact same getEgovRepeaterRows this checks).
  const profileFields = (fields ?? [])
    .filter((f) => f.parentFieldId === null)
    .filter((f) =>
      f.fieldInputType.value === "REPEATER_GROUP"
        ? groups.some((g) => g.fieldId === f.id) || !!(f.eGovField && getEgovRepeaterRows(f.englishName, egovProfile))
        : answeredFieldIds.has(f.id),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const startEditing = () => {
    setDraft(displayValues);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleChange = (fieldId: string, value: unknown) => setDraft((prev) => ({ ...prev, [fieldId]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const answerable = renderableFields(profileFields, draft).filter(
      (f) => !f.eGovField && f.fieldInputType.value !== "REPEATER_GROUP",
    );
    await submit(answerable.map((f) => ({ fieldId: f.id, value: draft[f.id] ?? null })));
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="apply-bg min-h-screen overflow-x-hidden text-slate-800">
      <ApplyChrome />

      <section className="mx-auto max-w-4xl px-4 py-12 md:px-5 md:py-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-[color:var(--color-ph-blue-soft)] text-lg text-[color:var(--color-ph-blue)]">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-black text-slate-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>
          </div>

          {!loading && profileFields.length > 0 && !editing && (
            <button
              type="button"
              onClick={startEditing}
              className="clay-blue inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[color:var(--color-ph-blue)] transition hover:-translate-y-0.5"
            >
              <Pencil className="size-3.5" /> Edit Fields
            </button>
          )}
        </div>

        {loading || fields === null ? (
          <div className="clay flex items-center justify-center p-16 text-sm text-slate-500">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading your profile…
          </div>
        ) : profileFields.length === 0 ? (
          <ClayCard className="p-10">
            <EmptyState
              icon={UserRound}
              title="No Profile Info Yet"
              description="Complete the initial form to start building your profile."
              action={{ label: "Go to Form", onClick: () => navigate("/form") }}
            />
          </ClayCard>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <ClayCard className="p-6 md:p-8">
              <FieldForm fields={profileFields} values={editing ? draft : displayValues} onChange={handleChange} locked={!editing} />
            </ClayCard>

            {editing && (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="clay inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                >
                  <X className="size-3.5" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="clay-blue inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-[color:var(--color-ph-blue)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        )}
      </section>

      <ApplyFooter />
    </div>
  );
}
