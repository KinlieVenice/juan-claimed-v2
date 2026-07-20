import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, Building2, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getGroupById, type UserGroup } from "@/services/users.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Simple read-only account summary for the logged-in Agent/Superadmin — reached via the
// "Profile" sidebar link. Distinct from pages/public/ProfilePage.tsx, which is the
// applicant-facing dynamic-field profile (USER role only).
export function AdminProfilePage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [group, setGroup] = React.useState<UserGroup | null>(null);

  React.useEffect(() => {
    if (!user?.groupId) {
      setGroup(null);
      return;
    }
    getGroupById(user.groupId)
      .then(setGroup)
      .catch(() => setGroup(null));
  }, [user?.groupId]);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "?";

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="flex flex-col items-center text-center">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary/10 text-xl text-primary">{initials}</AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          {user?.firstName} {user?.lastName}
        </h1>
        <Badge variant="secondary" className="mt-1.5 text-[10px]">
          {role}
        </Badge>
      </div>

      <div className="mt-8 space-y-4 text-sm">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Mail className="size-4 shrink-0" />
          <span className="text-foreground">{user?.email}</span>
        </div>
        {group && (
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Building2 className="size-4 shrink-0" />
            <span className="text-foreground">{group.englishName}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" />
          <span className="text-foreground">{role === "SUPERADMIN" ? "Superadmin" : "Agent"}</span>
        </div>
      </div>

      <Button variant="outline" className="mt-8 w-full" onClick={() => navigate("/reset-password")}>
        <KeyRound className="size-4" />
        Change Password
      </Button>
    </div>
  );
}
