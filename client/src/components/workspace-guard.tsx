import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, LogIn } from "lucide-react";
import { useLocation } from "wouter";

interface WorkspaceGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WorkspaceGuard({ children, fallback }: WorkspaceGuardProps) {
  const { data: session, isPending: sessionLoading } = useSession();
  const [, setLocation] = useLocation();

  const { data: meData, isLoading: meLoading } = useQuery<{
    activeWorkspaceId: string | null;
  }>({
    queryKey: ["/api/user/me"],
    enabled: !!session?.user,
  });

  if (sessionLoading || meLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      fallback || (
        <div className="flex flex-1 items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
                <LogIn className="h-7 w-7 text-destructive" />
              </div>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                You need to be signed in to access this feature.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => setLocation("/login")} data-testid="button-guard-login">
                Sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  if (!meData?.activeWorkspaceId) {
    return (
      fallback || (
        <div className="flex flex-1 items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>Select a workspace</CardTitle>
              <CardDescription>
                Choose a workspace from the switcher above to access this app.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export function useHasWorkspace(): { hasWorkspace: boolean; isLoading: boolean; activeWorkspaceId: string | null } {
  const { data: session } = useSession();

  const { data: meData, isLoading } = useQuery<{
    activeWorkspaceId: string | null;
  }>({
    queryKey: ["/api/user/me"],
    enabled: !!session?.user,
  });

  return {
    hasWorkspace: !!meData?.activeWorkspaceId,
    isLoading,
    activeWorkspaceId: meData?.activeWorkspaceId || null,
  };
}
