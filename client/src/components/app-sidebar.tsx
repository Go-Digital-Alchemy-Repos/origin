import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Globe,
  Package,
  FileText,
  Settings,
  BookOpen,
  BarChart3,
  Users,
} from "lucide-react";
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

const mainNav = [
  { title: "Dashboard", href: "/app", icon: LayoutDashboard },
  { title: "Sites", href: "/app/sites", icon: Globe },
  { title: "Modules", href: "/app/modules", icon: Package },
  { title: "Analytics", href: "/app/analytics", icon: BarChart3 },
];

const adminNav = [
  { title: "Docs Library", href: "/app/docs", icon: BookOpen },
  { title: "Users", href: "/app/users", icon: Users },
  { title: "Settings", href: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/app") return location === "/app";
    return location.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/app">
          <OriginLogo size="md" />
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href} data-testid={`link-sidebar-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href} data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
