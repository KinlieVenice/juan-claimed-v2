import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/mock-auth";
import { ClayBadge } from "@/components/ClayBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const isLoggedInUser = role === "USER";

  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl items-center gap-8 border-border/70 px-10 py-14 text-center shadow-xl shadow-primary/5">
        <ClayBadge />

        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Juan-Claimed</h1>
          <p className="text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            A no-code benefits finder for Filipino citizens. Answer a few quick questions and we'll match you with
            government benefits and programs you may already qualify for — no paperwork hunting required.
          </p>
        </div>

        <Button
          size="lg"
          className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/25"
          onClick={() => navigate(isLoggedInUser ? "/my-benefits" : "/form")}
        >
          {isLoggedInUser ? "See Eligible Benefits" : "Proceed to Form"}
          <ArrowRight className="size-4" />
        </Button>
      </Card>
    </div>
  );
}
