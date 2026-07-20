import * as React from "react";
import { Contact } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getUsers, filterAgentMates, type RealUser } from "@/services/users.service";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AgentMatesPage() {
  const { user, token } = useAuth();
  const [mates, setMates] = React.useState<RealUser[] | null>(null);

  React.useEffect(() => {
    if (!user || !token) return;
    getUsers(token).then((users) => setMates(filterAgentMates(users, user.id)));
  }, [user, token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Agent Mates</h1>
        <p className="text-sm text-muted-foreground">Other agents in your group.</p>
      </div>

      {mates === null ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted/60" />
      ) : mates.length === 0 ? (
        <EmptyState icon={Contact} title="No Agent Mates" description="You're the only agent in your group right now." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mates.map((mate) => (
            <Card key={mate.id} className="flex-row items-center gap-3 px-4 py-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {mate.firstName[0]}
                  {mate.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {mate.firstName} {mate.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{mate.email}</p>
              </div>
              <Badge variant={mate.active ? "success" : "secondary"}>{mate.active ? "Active" : "Inactive"}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
