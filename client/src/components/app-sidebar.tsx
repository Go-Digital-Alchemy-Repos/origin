import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Settings,
  BookOpen,
  Image,
  FileStack,
  PenTool,
  Menu as MenuIcon,
  Store,
  Contact,
  Users,
  HelpCircle,
  Blocks,
  Layers,
  Component,
  Package,
  Box,
  Activity,
  CreditCard,
  ClipboardList,
  Lock,
  Building2,
  Wrench,
  Palette,
  ArrowRightLeft,
  Search,
  FileUp,
  Puzzle,
} from "lucide-react";
import { getPublishedApps } from "@shared/originApps";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { OriginLogo } from "@/components/origin-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: boolean;
  badge?: string;
};

const clientNav: NavItem[] = [
  { title: "Dashboard", href: "/app", icon: LayoutDashboard },
  { title: "Pages", href: "/app/pages", icon: FileText },
  { title: "Collections", href: "/app/collections", icon: FileStack },
  { title: "Blog", href: "/app/blog", icon: PenTool },
  { title: "Media", href: "/app/media", icon: Image },
  { title: "Forms", href: "/app/forms", icon: ClipboardList },
  { title: "Menus", href: "/app/menus", icon: MenuIcon },
  { title: "Redirects", href: "/app/redirects", icon: ArrowRightLeft },
  { title: "SEO", href: "/app/sites/seo", icon: Search },
  { title: "Theme", href: "/app/sites/theme", icon: Palette },
];

const clientSecondaryNav: NavItem[] = [
  { title: "Marketplace", href: "/app/marketplace", icon: Store },
  { title: "Migration", href: "/app/migration", icon: FileUp },
];

function resolveIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const icon = (LucideIcons as Record<string, unknown>)[iconName];
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
    return icon as React.ComponentType<{ className?: string }>;
  }
  return Puzzle;
}

function getAppNavItems(entitlements: string[] | null | undefined): NavItem[] {
  if (!entitlements || entitlements.length === 0) return [];
  const published = getPublishedApps();
  const items: NavItem[] = [];
  for (const app of published) {
    if (entitlements.includes(app.entitlementKey)) {
      for (const nav of app.nav) {
        items.push({
          title: nav.title,
          href: nav.href,
          icon: resolveIcon(nav.icon),
          badge: nav.badge,
        });
      }
    }
  }
  return items;
}

const clientBottomNav: NavItem[] = [
  { title: "Billing", href: "/app/billing", icon: CreditCard },
  { title: "Settings", href: "/app/settings", icon: Settings },
  { title: "Help & Resources", href: "/app/help", icon: HelpCircle },
];

const studioNav: NavItem[] = [
  { title: "Platform Dashboard", href: "/app/studio", icon: LayoutDashboard },
  { title: "Clients", href: "/app/studio/clients", icon: Building2 },
  { title: "Sites", href: "/app/studio/sites", icon: Globe },
  { title: "Site Kits", href: "/app/studio/site-kits", icon: Package },
  { title: "Sections", href: "/app/studio/sections", icon: Layers },
  { title: "Widgets", href: "/app/studio/widgets", icon: Component },
  { title: "Apps", href: "/app/studio/apps", icon: Box },
];

const studioSecondaryNav: NavItem[] = [
  { title: "Marketplace Catalog", href: "/app/studio/marketplace", icon: Store },
  { title: "Component Registry", href: "/app/studio/components", icon: Blocks },
  { title: "Docs Library", href: "/app/docs", icon: BookOpen },
];

const studioBottomNav: NavItem[] = [
  { title: "System Status", href: "/app/studio/status", icon: Activity },
  { title: "Billing & Plans", href: "/app/studio/billing", icon: CreditCard },
  { title: "Audit Logs", href: "/app/studio/audit", icon: ClipboardList },
];

function NavSection({
  items,
  location,
  label,
}: {
  items: NavItem[];
  location: string;
  label?: string;
}) {
  const isActive = (href: string) => {
    if (href === "/app" || href === "/app/studio") return location === href;
    return location.startsWith(href);
  };

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className={item.locked ? "opacity-50" : ""}
              >
                <Link
                  href={item.locked ? "#" : item.href}
                  data-testid={`link-sidebar-${item.title.toLowerCase().replace(/[\s&]+/g, "-")}`}
                  onClick={item.locked ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  const { data: meData } = useQuery<{
    user: { id: string; role: string; name: string; email: string };
    activeWorkspaceId: string | null;
    workspaces: Array<{ id: string; name: string; slug: string; role: string; plan: string }>;
  }>({
    queryKey: ["/api/user/me"],
  });

  const hasWorkspace = !!meData?.activeWorkspaceId;

  const { data: entData } = useQuery<{ features: string[] }>({
    queryKey: ["/api/billing/entitlements"],
    enabled: hasWorkspace,
  });

  const isSuperAdmin = meData?.user?.role === "SUPER_ADMIN";
  const entitlements = isSuperAdmin
    ? getPublishedApps().map((a) => a.entitlementKey)
    : entData?.features || null;

  const appNavItems = hasWorkspace ? getAppNavItems(entitlements) : [];

  const isPlatformUser =
    meData?.user?.role === "SUPER_ADMIN" || meData?.user?.role === "AGENCY_ADMIN";
  const isStudioMode = location.startsWith("/app/studio") || location === "/app/studio";

  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <Link href="/app">
          <OriginLogo size="md" />
        </Link>
        {isPlatformUser && (
          <div className="mt-3 flex gap-1">
            <Link href="/app">
              <Button
                variant={!isStudioMode ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-xs"
                data-testid="button-nav-client"
              >
                Workspace
              </Button>
            </Link>
            <Link href="/app/studio">
              <Button
                variant={isStudioMode ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-xs"
                data-testid="button-nav-studio"
              >
                <Wrench className="mr-1 h-3 w-3" />
                Studio
              </Button>
            </Link>
          </div>
        )}
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {isStudioMode && isPlatformUser ? (
          <>
            <NavSection items={studioNav} location={location} label="Platform" />
            <SidebarSeparator />
            <NavSection items={studioSecondaryNav} location={location} label="Resources" />
            <SidebarSeparator />
            <NavSection items={studioBottomNav} location={location} label="System" />
          </>
        ) : (
          <>
            <NavSection items={clientNav} location={location} label="Content" />
            <SidebarSeparator />
            <NavSection items={clientSecondaryNav} location={location} label="Extend" />
            {appNavItems.length > 0 && (
              <>
                <SidebarSeparator />
                <NavSection items={appNavItems} location={location} label="Apps" />
              </>
            )}
            <SidebarSeparator />
            <NavSection items={clientBottomNav} location={location} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 px-1">
          <Badge variant="secondary" className="text-xs">
            Beta v0.1
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
