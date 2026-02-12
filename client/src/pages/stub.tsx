import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FileStack,
  PenTool,
  Image,
  ClipboardList,
  Menu,
  Store,
  Contact,
  HelpCircle,
  LayoutDashboard,
  Building2,
  Globe,
  Package,
  Layers,
  Component,
  Box,
  Blocks,
  Activity,
  CreditCard,
  Lock,
  Wrench,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "file-text": FileText,
  "file-stack": FileStack,
  "pen-tool": PenTool,
  image: Image,
  "clipboard-list": ClipboardList,
  menu: Menu,
  store: Store,
  contact: Contact,
  "help-circle": HelpCircle,
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  globe: Globe,
  package: Package,
  layers: Layers,
  component: Component,
  box: Box,
  blocks: Blocks,
  activity: Activity,
  "credit-card": CreditCard,
};

interface StubPageProps {
  title: string;
  description: string;
  icon: string;
  locked?: boolean;
  studio?: boolean;
}

export default function StubPage({ title, description, icon, locked, studio }: StubPageProps) {
  const Icon = iconMap[icon] || FileText;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" data-testid={`text-page-title-${title.toLowerCase().replace(/[\s&]+/g, "-")}`}>
              {title}
            </h1>
            {studio && (
              <Badge variant="outline" className="text-xs">
                <Wrench className="mr-1 h-3 w-3" />
                Studio
              </Badge>
            )}
            {locked && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="mr-1 h-3 w-3" />
                Module Required
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Icon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Coming Soon</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {locked
              ? "This feature requires the CRM module to be installed. Visit the Marketplace to enable it."
              : `The ${title} module is under development. Check back soon for updates.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
