import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Globe,
  Zap,
  Building2,
} from "lucide-react";

const PLAN_DETAILS: Record<string, { name: string; description: string; price: string; icon: typeof Zap }> = {
  starter: {
    name: "Starter",
    description: "For small projects and personal sites",
    price: "$29/mo",
    icon: Globe,
  },
  pro: {
    name: "Pro",
    description: "For growing businesses and teams",
    price: "$79/mo",
    icon: Zap,
  },
  enterprise: {
    name: "Enterprise",
    description: "For agencies and large organizations",
    price: "$199/mo",
    icon: Building2,
  },
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <Badge variant="default" data-testid="badge-subscription-status">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Active
        </Badge>
      );
    case "trialing":
      return (
        <Badge variant="secondary" data-testid="badge-subscription-status">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Trialing
        </Badge>
      );
    case "past_due":
      return (
        <Badge variant="destructive" data-testid="badge-subscription-status">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Past Due
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="secondary" data-testid="badge-subscription-status">
          <XCircle className="mr-1 h-3 w-3" />
          Canceled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" data-testid="badge-subscription-status">
          {status}
        </Badge>
      );
  }
}

function PlanCard({
  planKey,
  isCurrent,
  onSelect,
  isPending,
}: {
  planKey: string;
  isCurrent: boolean;
  onSelect: (plan: string) => void;
  isPending: boolean;
}) {
  const plan = PLAN_DETAILS[planKey];
  if (!plan) return null;
  const Icon = plan.icon;

  return (
    <Card className={isCurrent ? "ring-2 ring-primary" : ""} data-testid={`card-plan-${planKey}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{plan.name}</h3>
          </div>
          {isCurrent && (
            <Badge variant="secondary">Current</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
        <p className="text-2xl font-bold mb-4">{plan.price}</p>
        {!isCurrent && (
          <Button
            className="w-full"
            onClick={() => onSelect(planKey)}
            disabled={isPending}
            data-testid={`button-select-plan-${planKey}`}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Choose {plan.name}
          </Button>
        )}
        {isCurrent && (
          <Button variant="outline" className="w-full" disabled data-testid={`button-current-plan-${planKey}`}>
            Current Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const { data: billing, isLoading } = useQuery<{
    configured: boolean;
    subscription: any;
    entitlement: any;
    hasStripeCustomer: boolean;
  }>({
    queryKey: ["/api/billing/status"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await apiRequest("POST", "/api/billing/checkout", { plan, siteQuantity: 1 });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/portal");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sub = billing?.subscription;
  const currentPlan = sub?.plan || "starter";
  const isConfigured = billing?.configured;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-billing-title">Billing & Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription, view your current plan, and adjust site quantity.
        </p>
      </div>

      {!isConfigured && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Stripe not configured</p>
                <p className="text-sm text-muted-foreground">
                  Set STRIPE_SECRET_KEY and pricing environment variables to enable billing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sub && (
        <Card data-testid="card-current-subscription">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Current Subscription</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium capitalize" data-testid="text-current-plan">{currentPlan}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={sub.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Site Quantity</p>
                <p className="font-medium" data-testid="text-site-quantity">{sub.siteQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Period End</p>
                <p className="font-medium" data-testid="text-period-end">
                  {sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
            {sub.cancelAtPeriodEnd && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>This subscription will cancel at the end of the current billing period.</span>
                </div>
              </>
            )}
            {isConfigured && billing?.hasStripeCustomer && (
              <>
                <Separator className="my-4" />
                <Button
                  variant="outline"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  data-testid="button-manage-subscription"
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Manage Subscription
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.keys(PLAN_DETAILS).map((planKey) => (
            <PlanCard
              key={planKey}
              planKey={planKey}
              isCurrent={currentPlan === planKey}
              onSelect={(plan) => checkoutMutation.mutate(plan)}
              isPending={checkoutMutation.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
