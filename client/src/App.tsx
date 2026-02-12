import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import MarketingPage from "@/pages/marketing";
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

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
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
