// Shared by SortableFieldList.tsx (admin) and FieldForm.tsx (public) — groups a flat field
// list into top-level fields + their anchored children (see FieldFormModal.tsx's "Anchor
// to"/"Children Dependents"), so both places render each anchored child immediately after
// its anchor instead of at its own flat sortOrder position. Recursive — an anchor chain can
// be more than one level deep.
import type { DimField } from "@/types/domain";

export interface AnchorGrouping {
  topLevel: DimField[];
  childrenByAnchor: Map<string, DimField[]>;
}

export function groupByAnchor(fields: DimField[]): AnchorGrouping {
  const ids = new Set(fields.map((f) => f.id));
  const childrenByAnchor = new Map<string, DimField[]>();
  const topLevel: DimField[] = [];

  for (const field of fields) {
    // A field whose anchorFieldId points OUTSIDE this list (different classification, or
    // the target isn't in the current set) falls back to rendering as top-level — same
    // graceful-degrade the backend applies when a condition stops referencing an anchor.
    if (field.anchorFieldId && ids.has(field.anchorFieldId)) {
      const bucket = childrenByAnchor.get(field.anchorFieldId);
      if (bucket) bucket.push(field);
      else childrenByAnchor.set(field.anchorFieldId, [field]);
    } else {
      topLevel.push(field);
    }
  }

  childrenByAnchor.forEach((bucket) => bucket.sort((a, b) => a.sortOrder - b.sortOrder));

  return { topLevel, childrenByAnchor };
}

// Flattens the grouping back into DOM/render order: each top-level field immediately
// followed by its anchored children (recursively) — for contexts like FieldForm.tsx that
// just need "the fields, in the right order," not depth-aware indented rendering.
export function flattenAnchorOrder(fields: DimField[]): DimField[] {
  const { topLevel, childrenByAnchor } = groupByAnchor(fields);
  const result: DimField[] = [];

  const visit = (field: DimField) => {
    result.push(field);
    for (const child of childrenByAnchor.get(field.id) ?? []) visit(child);
  };

  topLevel.forEach(visit);
  return result;
}
