import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Eye, Users, Clock, Globe } from "lucide-react";

const pageStats = [
  { label: "Total Pageviews", value: "24,821", trend: "+12.4%", up: true },
  { label: "Unique Visitors", value: "8,412", trend: "+8.2%", up: true },
  { label: "Avg. Session", value: "2m 34s", trend: "-3.1%", up: false },
  { label: "Bounce Rate", value: "34.2%", trend: "-5.8%", up: true },
];

const topPages = [
  { path: "/", views: "8,241", site: "Marketing Homepage" },
  { path: "/blog/getting-started", views: "3,102", site: "Developer Blog" },
  { path: "/pricing", views: "2,854", site: "Marketing Homepage" },
  { path: "/blog/origin-modules", views: "1,983", site: "Developer Blog" },
  { path: "/features", views: "1,721", site: "Marketing Homepage" },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-analytics-title">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track performance across all your sites.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pageStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="mt-2 text-2xl font-bold">{stat.value}</div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <TrendingUp
                  className={`h-3 w-3 ${stat.up ? "text-emerald-500" : "text-destructive rotate-180"}`}
                />
                <span className={stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                  {stat.trend}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold">Traffic Overview</h2>
            <div className="mt-6 flex items-end justify-center gap-1" style={{ height: 200 }}>
              {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85, 95, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/20 transition-all hover:bg-primary/40"
                  style={{ height: `${h}%` }}
                  data-testid={`bar-month-${i}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold">Top Pages</h2>
            <div className="mt-4 space-y-3">
              {topPages.map((page, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                  data-testid={`row-top-page-${i}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium bg-muted text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{page.path}</div>
                      <div className="text-xs text-muted-foreground">{page.site}</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium shrink-0">{page.views}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
