import * as React from "react";
import { Building2, Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getGroups, type UserGroup } from "@/services/users.service";
import { GroupFormModal } from "@/components/admin/GroupFormModal";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export function GroupsPage() {
  const { role } = useAuth();
  const isSuperadmin = role === "SUPERADMIN";
  const [groups, setGroups] = React.useState<UserGroup[] | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<UserGroup | null>(null);

  const load = React.useCallback(() => {
    getGroups().then(setGroups);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const editModalOpen = !!editTarget;

  const columns: DataTableColumn<UserGroup>[] = [
    {
      key: "identity",
      header: "Name",
      width: "45%",
      cell: (g) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{g.englishName}</p>
          <p className="truncate text-xs text-muted-foreground">{g.tagalogName}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (g) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{g.englishDescription}</p>
          <p className="truncate text-xs text-muted-foreground">{g.tagalogDescription}</p>
        </div>
      ),
    },
    ...(isSuperadmin
      ? [
          {
            key: "actions",
            header: "",
            width: "56px",
            cellClassName: "text-right",
            cell: (g: UserGroup) => (
              <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditTarget(g)}>
                <Pencil className="size-4" />
              </Button>
            ),
          } satisfies DataTableColumn<UserGroup>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground">National agencies and organizations that create benefits.</p>
        </div>
        {isSuperadmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Add Group
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={groups}
        rowKey={(g) => g.id}
        searchText={(g) => `${g.englishName} ${g.tagalogName} ${g.englishDescription}`}
        searchPlaceholder="Search groups…"
        empty={{
          icon: Building2,
          title: "No Groups",
          description: "Add your first group to get started.",
          ...(isSuperadmin ? { action: { label: "Add Group", onClick: () => setCreateOpen(true) } } : {}),
        }}
      />

      {isSuperadmin && (
        <>
          <GroupFormModal open={createOpen} onOpenChange={setCreateOpen} group={null} onSaved={load} />
          <GroupFormModal
            open={editModalOpen}
            onOpenChange={(open) => !open && setEditTarget(null)}
            group={editTarget}
            onSaved={load}
          />
        </>
      )}
    </div>
  );
}
