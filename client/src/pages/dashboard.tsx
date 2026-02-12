import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Package, FileText, BarChart3, ArrowRight, Plus, TrendingUp, Users, Eye } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

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

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your ORIGIN platform.</p>
      </div>

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
