import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
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
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import {
  LogOut,
  Search,
  ChevronDown,
  Building2,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import StubPage from "@/pages/stub";
import BillingPage from "@/pages/billing";
import HelpPage from "@/pages/help";
import MarketplacePage from "@/pages/marketplace";
import ComponentRegistryPage from "@/pages/component-registry";
import CmsPagesPage from "@/pages/cms-pages";
import PageEditorPage from "@/pages/page-editor";
import CollectionsPage from "@/pages/collections";
import CollectionDetailPage from "@/pages/collection-detail";
import CollectionItemEditorPage from "@/pages/collection-item-editor";
import SiteThemePage from "@/pages/site-theme";
import MenusPage from "@/pages/menus";
import FormsPage from "@/pages/forms";
import RedirectsPage from "@/pages/redirects";

function AppRouter() {
  return (
    <Switch>
      <Route path="/app" component={DashboardPage} />
      <Route path="/app/sites/theme" component={SiteThemePage} />
      <Route path="/app/sites" component={SitesPage} />
      <Route path="/app/modules" component={ModulesPage} />
      <Route path="/app/docs" component={DocsPage} />
      <Route path="/app/analytics" component={AnalyticsPage} />
      <Route path="/app/settings" component={SettingsPage} />
      <Route path="/app/users" component={UsersAdminPage} />
      <Route path="/app/pages/:pageId" component={PageEditorPage} />
      <Route path="/app/pages" component={CmsPagesPage} />
      <Route path="/app/collections/:collectionId/items/:itemId" component={CollectionItemEditorPage} />
      <Route path="/app/collections/:collectionId" component={CollectionDetailPage} />
      <Route path="/app/collections" component={CollectionsPage} />
      <Route path="/app/blog">{() => <StubPage title="Blog" description="Create and manage blog posts. Write, schedule, and publish content with rich editing." icon="pen-tool" />}</Route>
      <Route path="/app/media">{() => <StubPage title="Media" description="Upload, organize, and manage your media assets. Images, videos, documents, and more." icon="image" />}</Route>
      <Route path="/app/forms" component={FormsPage} />
      <Route path="/app/redirects" component={RedirectsPage} />
      <Route path="/app/menus" component={MenusPage} />
      <Route path="/app/marketplace" component={MarketplacePage} />
      <Route path="/app/crm">{() => <StubPage title="CRM" description="Customer relationship management. Track leads, contacts, and interactions." icon="contact" locked />}</Route>
      <Route path="/app/help" component={HelpPage} />
      <Route path="/app/studio">{() => <StubPage title="Platform Dashboard" description="Overview of all clients, sites, and platform health across your ORIGIN instance." icon="layout-dashboard" studio />}</Route>
      <Route path="/app/studio/clients">{() => <StubPage title="Clients" description="Manage client workspaces, onboarding, and team access across the platform." icon="building-2" studio />}</Route>
      <Route path="/app/studio/sites">{() => <StubPage title="Sites" description="View and manage all sites across every workspace. Global site administration." icon="globe" studio />}</Route>
      <Route path="/app/studio/site-kits">{() => <StubPage title="Site Kits" description="Pre-built site templates and starter kits. Create and publish reusable site packages." icon="package" studio />}</Route>
      <Route path="/app/studio/sections">{() => <StubPage title="Sections" description="Design reusable page sections. Build a library of drag-and-drop content blocks." icon="layers" studio />}</Route>
      <Route path="/app/studio/widgets">{() => <StubPage title="Widgets" description="Create and manage interactive widgets. Embeddable components for any site." icon="component" studio />}</Route>
      <Route path="/app/studio/apps">{() => <StubPage title="Apps" description="Platform applications and integrations. Manage first-party and third-party apps." icon="box" studio />}</Route>
      <Route path="/app/studio/marketplace">{() => <StubPage title="Marketplace Catalog" description="Manage the marketplace catalog. Review, approve, and publish modules and themes." icon="store" studio />}</Route>
      <Route path="/app/studio/components" component={ComponentRegistryPage} />
      <Route path="/app/studio/status">{() => <StubPage title="System Status" description="Platform health monitoring. Uptime, performance metrics, and service status." icon="activity" studio />}</Route>
      <Route path="/app/billing" component={BillingPage} />
      <Route path="/app/studio/billing" component={BillingPage} />
      <Route path="/app/studio/audit">{() => <StubPage title="Audit Logs" description="Complete audit trail. Track user actions, system events, and security logs." icon="clipboard-list" studio />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function WorkspaceSwitcher() {
  const { data: meData } = useQuery<{
    user: { id: string; role: string; name: string; email: string };
    activeWorkspaceId: string | null;
    workspaces: Array<{ id: string; name: string; slug: string; role: string; plan: string }>;
  }>({
    queryKey: ["/api/user/me"],
  });

  const workspaces = meData?.workspaces || [];
  const activeWs = workspaces.find((ws) => ws.id === meData?.activeWorkspaceId) || workspaces[0];

  const selectWorkspace = async (wsId: string) => {
    await apiRequest("POST", "/api/user/select-workspace", { workspaceId: wsId });
    queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
  };

  if (workspaces.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm" data-testid="button-workspace-switcher">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="hidden max-w-[140px] truncate sm:inline">
            {activeWs?.name || "Select workspace"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => selectWorkspace(ws.id)}
            data-testid={`menu-workspace-${ws.slug}`}
          >
            <div className="flex flex-1 items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {ws.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{ws.name}</div>
                  <div className="text-xs text-muted-foreground">{ws.plan}</div>
                </div>
              </div>
              {ws.id === activeWs?.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CommandPaletteButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden gap-2 text-muted-foreground md:flex"
      data-testid="button-command-palette"
      onClick={() => {}}
    >
      <Search className="h-3.5 w-3.5" />
      <span className="text-xs">Search...</span>
      <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">&#8984;</span>K
      </kbd>
    </Button>
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-menu">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-sm sm:inline" data-testid="text-user-name">
            {session.user.name}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{session.user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{session.user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/app/settings")} data-testid="menu-settings">
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/app/help")} data-testid="menu-help">
          Help & Resources
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="button-sign-out"
          onClick={async () => {
            await authClient.signOut();
            setLocation("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "15rem",
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
          <header className="sticky top-0 z-50 flex h-12 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur-md">
            <div className="flex items-center gap-1">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <WorkspaceSwitcher />
            </div>
            <div className="flex items-center gap-2">
              <CommandPaletteButton />
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
