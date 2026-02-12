import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  Package,
  FileText,
  ArrowRight,
  Plus,
  TrendingUp,
  Users,
  Eye,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  Palette,
  Pencil,
  FormInput,
  Database,
  BookOpen,
  Link2,
  UserPlus,
  Contact,
  Upload,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

const quickStats = [
  { label: "Active Sites", value: "3", icon: Globe, trend: "+1 this week", color: "text-blue-500 dark:text-blue-400" },
  { label: "Modules Installed", value: "12", icon: Package, trend: "2 updates", color: "text-emerald-500 dark:text-emerald-400" },
  { label: "Total Pageviews", value: "24.8k", icon: Eye, trend: "+12% vs last month", color: "text-violet-500 dark:text-violet-400" },
  { label: "Active Users", value: "156", icon: Users, trend: "+8 today", color: "text-amber-500 dark:text-amber-400" },
];

const recentSites = [
  { name: "Marketing Homepage", status: "live", domain: "mycompany.com", views: "8.2k" },
  { name: "Developer Blog", status: "live", domain: "blog.mycompany.com", views: "5.1k" },
  { name: "Product Landing", status: "draft", domain: "launch.mycompany.com", views: "---" },
];

const recentActivity = [
  { action: "Module installed", detail: "SEO Toolkit v2.1", time: "2 hours ago" },
  { action: "Site published", detail: "Marketing Homepage", time: "5 hours ago" },
  { action: "Doc updated", detail: "Getting Started Guide", time: "1 day ago" },
  { action: "User invited", detail: "dev@mycompany.com", time: "2 days ago" },
];

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: typeof Globe;
}

const CLIENT_CHECKLIST: ChecklistItem[] = [
  { key: "created_first_site", label: "Create your first site", description: "Set up a website to get started", href: "/app/sites", icon: Globe },
  { key: "installed_site_kit", label: "Install a Site Kit", description: "Get a head start with pre-built templates", href: "/app/marketplace", icon: Palette },
  { key: "edited_first_page", label: "Edit a page", description: "Customize your content with the page editor", href: "/app/pages", icon: Pencil },
  { key: "published_first_page", label: "Publish a page", description: "Make your content live for visitors", href: "/app/pages", icon: Sparkles },
  { key: "created_first_form", label: "Create a form", description: "Collect leads and feedback from visitors", href: "/app/forms", icon: FormInput },
  { key: "created_first_collection", label: "Create a collection", description: "Organize structured content", href: "/app/collections", icon: Database },
  { key: "created_first_blog_post", label: "Write a blog post", description: "Start publishing articles", href: "/app/blog", icon: BookOpen },
  { key: "connected_custom_domain", label: "Connect a custom domain", description: "Use your own domain name", href: "/app/sites", icon: Link2 },
  { key: "installed_marketplace_item", label: "Install from Marketplace", description: "Add features and integrations", href: "/app/marketplace", icon: ShoppingBag },
  { key: "invited_team_member", label: "Invite a team member", description: "Collaborate with your team", href: "/app/settings", icon: UserPlus },
];

const AGENCY_EXTRAS: ChecklistItem[] = [
  { key: "created_first_client_site", label: "Create a client site", description: "Build a site for your client", href: "/app/sites", icon: Globe },
  { key: "opened_platform_studio", label: "Explore Platform Studio", description: "Manage your agency platform", href: "/app/studio", icon: LayoutDashboard },
  { key: "started_wp_import", label: "Import from WordPress", description: "Migrate existing content", href: "/app/migration", icon: Upload },
];

interface OnboardingState {
  wizardCompleted: boolean;
  checklistJson: Record<string, boolean>;
  dismissed: boolean;
}

function OnboardingChecklist() {
  const { data: meData } = useQuery<{
    user: { role: string };
    activeWorkspaceId: string | null;
  }>({
    queryKey: ["/api/user/me"],
  });

  const hasWorkspace = !!meData?.activeWorkspaceId;

  const { data: onboarding } = useQuery<OnboardingState>({
    queryKey: ["/api/onboarding/state"],
    enabled: hasWorkspace,
  });

  const recomputeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/onboarding/recompute");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/state"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/onboarding/dismiss");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/state"] });
    },
  });

  useEffect(() => {
    if (hasWorkspace) {
      recomputeMutation.mutate();
    }
  }, [hasWorkspace]);

  if (!onboarding || !onboarding.wizardCompleted || onboarding.dismissed) {
    return null;
  }

  const checklist = onboarding.checklistJson || {};
  const isAgency = meData?.user?.role === "AGENCY_ADMIN" || meData?.user?.role === "SUPER_ADMIN";
  const items = isAgency ? [...CLIENT_CHECKLIST, ...AGENCY_EXTRAS] : CLIENT_CHECKLIST;

  const completedCount = items.filter((item) => checklist[item.key]).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (completedCount === totalCount) {
    return null;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold" data-testid="text-checklist-title">Getting Started</h2>
                <p className="text-sm text-muted-foreground">
                  {completedCount} of {totalCount} completed
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dismissMutation.mutate()}
              data-testid="button-dismiss-checklist"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4">
            <Progress value={progressPercent} className="h-2" />
          </div>
          <div className="mt-4 space-y-1">
            {items.map((item) => {
              const done = !!checklist[item.key];
              return (
                <Link key={item.key} href={item.href}>
                  <div
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 hover-elevate ${done ? "opacity-60" : ""}`}
                    data-testid={`checklist-item-${item.key}`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${done ? "line-through" : ""}`}>{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                    {!done && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your ORIGIN platform.</p>
      </div>

      <OnboardingChecklist />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={i}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="mt-2 text-2xl font-bold">{stat.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <motion.div
          className="lg:col-span-3"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
        >
          <Card className="h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Your Sites</h2>
                <Button variant="ghost" size="sm" data-testid="button-view-all-sites">
                  View all
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {recentSites.map((site) => (
                  <div
                    key={site.name}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                    data-testid={`card-site-${site.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{site.name}</div>
                        <div className="text-xs text-muted-foreground">{site.domain}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{site.views} views</span>
                      <Badge variant={site.status === "live" ? "default" : "secondary"}>
                        {site.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" data-testid="button-create-site">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create New Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-2"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
        >
          <Card className="h-full">
            <CardContent className="p-5">
              <h2 className="font-semibold">Recent Activity</h2>
              <div className="mt-4 space-y-4">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                    <div>
                      <div className="text-sm font-medium">{item.action}</div>
                      <div className="text-xs text-muted-foreground">{item.detail}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground/70">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={6}
      >
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Docs Library</h3>
                <p className="text-sm text-muted-foreground">
                  Browse developer documentation and help guides.
                </p>
              </div>
            </div>
            <Link href="/app/docs">
              <Button variant="outline" size="sm" data-testid="button-browse-docs">
                Browse Docs
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
