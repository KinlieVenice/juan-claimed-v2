import * as React from "react";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

export interface LocalHierarchyLevel {
  localId: string;
  englishName: string;
  tagalogName: string;
}

export interface LocalHierarchyNode {
  localId: string;
  englishName: string;
  tagalogName: string;
  children: LocalHierarchyNode[];
}

export const emptyLevel = (): LocalHierarchyLevel => ({ localId: newId(), englishName: "", tagalogName: "" });
export const emptyNode = (): LocalHierarchyNode => ({ localId: newId(), englishName: "", tagalogName: "", children: [] });

// Ordered depth definitions for a new hierarchy — e.g. "Region" (depth 1), "Province"
// (depth 2), "Barangay" (depth 3). Order in the list IS the level number (1-indexed),
// same convention as the options list — no separate reordering UI needed.
export function HierarchyLevelsEditor({
  levels,
  onChange,
  token,
  disabled,
}: {
  levels: LocalHierarchyLevel[];
  onChange: (levels: LocalHierarchyLevel[]) => void;
  /** Powers each level's English -> Tagalog auto-translate (see useAutoTranslate.ts). */
  token: string | null | undefined;
  disabled?: boolean;
}) {
  const update = (localId: string, patch: Partial<LocalHierarchyLevel>) => {
    onChange(levels.map((l) => (l.localId === localId ? { ...l, ...patch } : l)));
  };

  return (
    <div className="space-y-3">
      {levels.length === 0 && <p className="text-xs text-muted-foreground">No levels yet — add at least one (e.g. "Region", then "Province", then "Barangay").</p>}

      {levels.map((level, index) => (
        <HierarchyLevelRow
          key={level.localId}
          level={level}
          index={index}
          onChange={(patch) => update(level.localId, patch)}
          onRemove={() => onChange(levels.filter((l) => l.localId !== level.localId))}
          token={token}
          disabled={disabled}
        />
      ))}

      {!disabled && (
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...levels, emptyLevel()])}>
          <Plus /> Add Level
        </Button>
      )}
    </div>
  );
}

function HierarchyLevelRow({
  level,
  index,
  onChange,
  onRemove,
  token,
  disabled,
}: {
  level: LocalHierarchyLevel;
  index: number;
  onChange: (patch: Partial<LocalHierarchyLevel>) => void;
  onRemove: () => void;
  token: string | null | undefined;
  disabled?: boolean;
}) {
  const nameTranslate = useAutoTranslate({ sourceValue: level.englishName, onTargetChange: (v) => onChange({ tagalogName: v }), token, enabled: !disabled });

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border p-3">
      <span className="mt-3 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{index + 1}</span>
      <div className="grid flex-1 grid-cols-2 gap-2">
        <TextField label="English Name" value={level.englishName} onChange={(v) => onChange({ englishName: v })} required />
        <TextField label="Tagalog Name" value={level.tagalogName} onChange={nameTranslate.handleTargetChange} required badge={nameTranslate.badge} />
      </div>
      {!disabled && (
        <Button type="button" size="icon" variant="ghost" className="mt-1 size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}

interface HierarchyNodeTreeEditorProps {
  levels: LocalHierarchyLevel[];
  nodes: LocalHierarchyNode[];
  onChange: (nodes: LocalHierarchyNode[]) => void;
  /** Powers each node's English -> Tagalog auto-translate (see useAutoTranslate.ts). */
  token: string | null | undefined;
  disabled?: boolean;
}

// A recursive node tree, depth-limited by however many levels were defined above — e.g. 3
// levels means root nodes ("Region") can have children ("Province"), which can have
// children ("Barangay"), but no deeper. Mirrors FieldConditionTreeBuilder's recursive
// group-editor pattern, one node type instead of group/leaf.
export function HierarchyNodeTreeEditor({ levels, nodes, onChange, token, disabled }: HierarchyNodeTreeEditorProps) {
  if (levels.length === 0) {
    return <p className="text-xs text-muted-foreground">Define at least one level above before adding values.</p>;
  }

  return (
    <div className="space-y-2">
      {nodes.length === 0 && <p className="text-xs text-muted-foreground">No values yet — add a "{levels[0].englishName || "level"}" value below.</p>}

      {nodes.map((node, index) => (
        <HierarchyNodeRow
          key={node.localId}
          node={node}
          depth={0}
          levels={levels}
          onChange={(updated) => onChange(nodes.map((n, i) => (i === index ? updated : n)))}
          onRemove={() => onChange(nodes.filter((_, i) => i !== index))}
          token={token}
          disabled={disabled}
        />
      ))}

      {!disabled && (
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...nodes, emptyNode()])}>
          <Plus /> Add {levels[0].englishName || "Value"}
        </Button>
      )}
    </div>
  );
}

function HierarchyNodeRow({
  node,
  depth,
  levels,
  onChange,
  onRemove,
  token,
  disabled,
}: {
  node: LocalHierarchyNode;
  depth: number;
  levels: LocalHierarchyLevel[];
  onChange: (node: LocalHierarchyNode) => void;
  onRemove: () => void;
  token: string | null | undefined;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const canHaveChildren = depth + 1 < levels.length;
  const childLevelLabel = canHaveChildren ? levels[depth + 1]?.englishName : null;

  const nameTranslate = useAutoTranslate({ sourceValue: node.englishName, onTargetChange: (v) => onChange({ ...node, tagalogName: v }), token, enabled: !disabled });

  return (
    <div className="rounded-lg border border-border" style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-2 p-2">
        {node.children.length > 0 ? (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="text-muted-foreground">
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <TextField
          label={`${levels[depth]?.englishName || "Name"} (English)`}
          value={node.englishName}
          onChange={(v) => onChange({ ...node, englishName: v })}
          required
          containerClassName="flex-1"
        />
        <TextField
          label={`${levels[depth]?.englishName || "Name"} (Tagalog)`}
          value={node.tagalogName}
          onChange={nameTranslate.handleTargetChange}
          required
          containerClassName="flex-1"
          badge={nameTranslate.badge}
        />

        {canHaveChildren && !disabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...node, children: [...node.children, emptyNode()] })}
            title={`Add a ${childLevelLabel ?? "sub-value"} under this ${levels[depth]?.englishName ?? "value"}`}
          >
            <Plus /> {childLevelLabel ?? "Sub-value"}
          </Button>
        )}

        {!disabled && (
          <Button type="button" size="icon" variant="ghost" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {expanded && node.children.length > 0 && (
        <div className="space-y-2 border-t border-border p-2">
          {node.children.map((child, index) => (
            <HierarchyNodeRow
              key={child.localId}
              node={child}
              depth={depth + 1}
              levels={levels}
              onChange={(updated) => onChange({ ...node, children: node.children.map((c, i) => (i === index ? updated : c)) })}
              onRemove={() => onChange({ ...node, children: node.children.filter((_, i) => i !== index) })}
              token={token}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function stripLevels(levels: LocalHierarchyLevel[]) {
  return levels.map((l, index) => ({ level: index + 1, englishName: l.englishName, tagalogName: l.tagalogName, englishDescription: "", tagalogDescription: "" }));
}

export function stripNodes(nodes: LocalHierarchyNode[]): { englishName: string; tagalogName: string; englishDescription: string; tagalogDescription: string; children?: ReturnType<typeof stripNodes> }[] {
  return nodes.map((n) => ({
    englishName: n.englishName,
    tagalogName: n.tagalogName,
    englishDescription: "",
    tagalogDescription: "",
    ...(n.children.length > 0 ? { children: stripNodes(n.children) } : {}),
  }));
}
