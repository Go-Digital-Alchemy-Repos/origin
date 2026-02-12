import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, ArrowRight, Inbox, ListChecks, Users, Bell, Globe } from "lucide-react";
import { Link } from "wouter";

export default function AppTicketsPage() {
  const { data: health, isLoading, error } = useQuery<{
    app: string;
    version: string;
    status: string;
    workspaceId: string;
  }>({
    queryKey: ["/api/apps/tickets/health"],
    retry: false,
  });

  const isEntitlementMissing = error && (error instanceof Error) && error.message.startsWith("403");

  if (isEntitlementMissing) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Ticket className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold" data-testid="text-tickets-not-enabled">
              Tickets App Not Enabled
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              The Tickets add-on is not enabled for this workspace. Install it from the Marketplace to start managing support tickets.
            </p>
            <Link href="/app/marketplace">
              <Button className="mt-6" data-testid="button-tickets-marketplace">
                Go to Marketplace
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-tickets-title">Tickets</h1>
            {health && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-tickets-version">
                v{health.version}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage support tickets, track issues, and resolve customer requests.
          </p>
        </div>
        <Link href="/app/help">
          <Button variant="outline" size="sm" data-testid="button-tickets-help">
            Help & Docs
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold" data-testid="text-tickets-placeholder">
              Tickets is installed but not configured yet
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This add-on is ready for development. The following features are planned for future releases:
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 text-left max-w-lg w-full">
              {[
                { icon: Inbox, label: "Ticket Inbox", desc: "View and triage incoming support requests" },
                { icon: ListChecks, label: "Status Workflow", desc: "Open, In Progress, Resolved, Closed statuses" },
                { icon: Users, label: "Agent Assignment", desc: "Assign tickets to team members" },
                { icon: Bell, label: "Notifications", desc: "Email and in-app alerts for updates" },
                { icon: Globe, label: "Customer Portal", desc: "Public-facing ticket submission page" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-lg border p-3">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
