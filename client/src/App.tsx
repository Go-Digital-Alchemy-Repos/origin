import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import NotFound from "@/pages/not-found";
import MarketingPage from "@/pages/marketing";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import SitesPage from "@/pages/sites";
import ModulesPage from "@/pages/modules";
import DocsPage from "@/pages/docs";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import UsersAdminPage from "@/pages/users-admin";

function AppRouter() {
  return (
    <Switch>
      <Route path="/app" component={DashboardPage} />
      <Route path="/app/sites" component={SitesPage} />
      <Route path="/app/modules" component={ModulesPage} />
      <Route path="/app/docs" component={DocsPage} />
      <Route path="/app/analytics" component={AnalyticsPage} />
      <Route path="/app/settings" component={SettingsPage} />
      <Route path="/app/users" component={UsersAdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UserMenu() {
  const { data: session } = useSession();
  const [, setLocation] = useLocation();

  if (!session?.user) return null;

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="hidden text-sm sm:inline" data-testid="text-user-name">
        {session.user.name}
      </span>
      <Button
        size="icon"
        variant="ghost"
        data-testid="button-sign-out"
        onClick={async () => {
          await authClient.signOut();
          setLocation("/login");
        }}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const { data: session, isPending } = useSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isPending && !session?.user) {
      setLocation("/login");
    }
  }, [isPending, session, setLocation]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function RootRouter() {
  const [location] = useLocation();

  if (location.startsWith("/app")) {
    return <AppLayout />;
  }

  return (
    <Switch>
      <Route path="/" component={MarketingPage} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <RootRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
