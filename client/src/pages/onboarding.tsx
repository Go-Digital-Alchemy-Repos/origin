import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSession } from "@/lib/auth-client";
import { OriginLogo } from "@/components/origin-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  Palette,
  Pencil,
  Rocket,
  PartyPopper,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";

const WIZARD_STEPS = [
  { id: "welcome", label: "Welcome", icon: Sparkles },
  { id: "site", label: "Create Site", icon: Globe },
  { id: "site-kit", label: "Site Kit", icon: Palette },
  { id: "editor", label: "Edit", icon: Pencil },
  { id: "publish", label: "Publish", icon: Rocket },
];

const fadeVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

interface OnboardingState {
  id: string;
  workspaceId: string;
  wizardCompleted: boolean;
  wizardStep: string;
  checklistJson: Record<string, boolean>;
  firstSiteId: string | null;
  firstPublishedAt: string | null;
  dismissed: boolean;
}

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { data: session, isPending: sessionPending } = useSession();
  const { toast } = useToast();

  const { data: onboarding, isLoading } = useQuery<OnboardingState>({
    queryKey: ["/api/onboarding/state"],
    enabled: !!session?.user,
  });

  const [currentStep, setCurrentStep] = useState("welcome");
  const [siteName, setSiteName] = useState("");
  const [siteSlug, setSiteSlug] = useState("");
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (onboarding) {
      if (onboarding.wizardCompleted) {
        setLocation("/app");
        return;
      }
      if (onboarding.wizardStep && onboarding.wizardStep !== "completed") {
        setCurrentStep(onboarding.wizardStep);
      }
      if (onboarding.firstSiteId) {
        setCreatedSiteId(onboarding.firstSiteId);
      }
    }
  }, [onboarding, setLocation]);

  useEffect(() => {
    if (!sessionPending && !session?.user) {
      setLocation("/login");
    }
  }, [sessionPending, session, setLocation]);

  const advanceMutation = useMutation({
    mutationFn: async (args: { step: string; firstSiteId?: string }) => {
      const res = await apiRequest("POST", "/api/onboarding/advance", args);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/state"] });
    },
  });

  const createSiteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sites", {
        name: siteName,
        slug: siteSlug,
      });
      return res.json();
    },
    onSuccess: async (site: any) => {
      setCreatedSiteId(site.id);
      await advanceMutation.mutateAsync({ step: "site-kit", firstSiteId: site.id });
      setCurrentStep("site-kit");
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/complete-wizard");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/state"] });
      setCurrentStep("celebrate");
    },
  });

  const goToStep = async (step: string) => {
    setCurrentStep(step);
    await advanceMutation.mutateAsync({ step });
  };

  const handleNameChange = (v: string) => {
    setSiteName(v);
    setSiteSlug(
      v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  };

  if (sessionPending || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
        <OriginLogo size="sm" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {currentStep !== "celebrate" && (
          <nav className="mb-10" data-testid="onboarding-progress">
            <div className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, i) => {
                const isActive = step.id === currentStep;
                const isDone = stepIndex > i;
                return (
                  <div key={step.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : isDone
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 text-muted-foreground/50"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <step.icon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div
                        className={`mx-2 h-0.5 flex-1 rounded-full ${
                          isDone ? "bg-primary" : "bg-muted-foreground/20"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        )}

        <AnimatePresence mode="wait">
          {currentStep === "welcome" && (
            <motion.div key="welcome" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-onboarding-title">
                  Welcome to ORIGIN
                </h1>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  Let's set up your first site in just a few steps. You'll be live in under 5 minutes.
                </p>
                <Button
                  size="lg"
                  className="mt-8"
                  onClick={() => goToStep("site")}
                  data-testid="button-onboarding-start"
                >
                  Let's Get Started
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === "site" && (
            <motion.div key="site" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold" data-testid="text-step-site-title">
                    Create Your First Site
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Give your site a name. You can always change this later.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-name">Site Name</Label>
                      <Input
                        id="site-name"
                        placeholder="My Amazing Website"
                        value={siteName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        data-testid="input-site-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site-slug">Site URL</Label>
                      <div className="flex items-center gap-0">
                        <span className="flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                          https://
                        </span>
                        <Input
                          id="site-slug"
                          value={siteSlug}
                          onChange={(e) => setSiteSlug(e.target.value)}
                          className="rounded-l-none"
                          placeholder="my-amazing-website"
                          data-testid="input-site-slug"
                        />
                        <span className="flex h-9 items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                          .originapp.ai
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-2">
                    <Button variant="ghost" onClick={() => goToStep("welcome")} data-testid="button-back-welcome">
                      <ArrowLeft className="mr-1.5 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={() => createSiteMutation.mutate()}
                      disabled={!siteName.trim() || !siteSlug.trim() || createSiteMutation.isPending}
                      data-testid="button-create-site"
                    >
                      {createSiteMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="mr-1.5 h-4 w-4" />
                      )}
                      Create Site
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === "site-kit" && (
            <motion.div key="site-kit" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
              <SiteKitStep
                siteId={createdSiteId}
                onNext={() => goToStep("editor")}
                onSkip={() => goToStep("editor")}
              />
            </motion.div>
          )}

          {currentStep === "editor" && (
            <motion.div key="editor" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Pencil className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold" data-testid="text-step-editor-title">
                    Edit Your Site
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Your site is ready! Open the page editor to customize your content, then come back to publish.
                  </p>
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => {
                        if (createdSiteId) {
                          setLocation("/app/pages");
                        }
                      }}
                      data-testid="button-open-editor"
                    >
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Open Page Editor
                    </Button>
                    <Button variant="ghost" onClick={() => goToStep("publish")} data-testid="button-skip-editor">
                      Skip for now
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-start">
                    <Button variant="ghost" size="sm" onClick={() => goToStep("site-kit")} data-testid="button-back-sitekit">
                      <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === "publish" && (
            <motion.div key="publish" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Rocket className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold" data-testid="text-step-publish-title">
                    Ready to Go Live?
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Publish your site to make it available to the world. You can always make changes and republish later.
                  </p>
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                      data-testid="button-publish-complete"
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="mr-1.5 h-4 w-4" />
                      )}
                      Complete Setup
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-start">
                    <Button variant="ghost" size="sm" onClick={() => goToStep("editor")} data-testid="button-back-editor">
                      <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === "celebrate" && (
            <motion.div key="celebrate" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <PartyPopper className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-onboarding-complete">
                  You're All Set!
                </h1>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  Your site is live. Head to your dashboard to continue building, or explore the marketplace for more features.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button size="lg" onClick={() => setLocation("/app")} data-testid="button-go-dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setLocation("/app/marketplace")} data-testid="button-go-marketplace">
                    Explore Marketplace
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SiteKitStep({
  siteId,
  onNext,
  onSkip,
}: {
  siteId: string | null;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { toast } = useToast();
  const { data: kits, isLoading } = useQuery<any[]>({
    queryKey: ["/api/marketplace/items"],
  });

  const siteKits = (kits || []).filter((k: any) => {
    if (k.type !== "site-kit" || k.status !== "published") return false;
    const meta = k.metadata as Record<string, unknown> | null;
    return meta?.is_onboarding_eligible === true;
  });

  const installMutation = useMutation({
    mutationFn: async (kitId: string) => {
      await apiRequest("POST", `/api/marketplace/install`, { itemId: kitId });
      if (siteId) {
        const kit = (kits || []).find((k: any) => k.id === kitId);
        const meta = kit?.metadata as Record<string, unknown> | null;
        const siteKitId = meta?.siteKitId as string | undefined;
        if (siteKitId) {
          await apiRequest("POST", `/api/site-kits/${siteKitId}/install`, { siteId });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/installs"] });
      toast({ title: "Site Kit installed", description: "Your pages, menus, and forms have been created." });
      onNext();
    },
    onError: () => {
      toast({ title: "Install failed", description: "Something went wrong. You can try again or skip.", variant: "destructive" });
    },
  });

  const getBadge = (kit: any) => {
    const meta = kit.metadata as Record<string, unknown> | null;
    const badge = (meta?.display_badge as string) || (kit.isFree ? "Free" : "Premium");
    return badge;
  };

  const getIndustryTag = (kit: any) => {
    const tags = (kit.tags || []) as string[];
    return tags.find((t: string) => !["site-kit", "starter"].includes(t));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold" data-testid="text-step-sitekit-title">
          Choose a Site Kit
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Site Kits give you a head start with pre-designed pages, themes, and content. Pick one or skip to start from scratch.
        </p>

        {isLoading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : siteKits.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">No site kits available yet. You can skip this step.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {siteKits.map((kit: any) => (
              <Card
                key={kit.id}
                className="hover-elevate cursor-pointer"
                onClick={() => !installMutation.isPending && installMutation.mutate(kit.id)}
                data-testid={`card-sitekit-${kit.slug}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Palette className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getBadge(kit)}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <div className="font-medium text-sm">{kit.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{kit.description}</div>
                  </div>
                  {getIndustryTag(kit) && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground/70 capitalize">{getIndustryTag(kit)?.replace(/-/g, " ")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {installMutation.isPending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Installing kit...
          </div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <Button variant="ghost" onClick={onSkip} disabled={installMutation.isPending} data-testid="button-skip-sitekit">
            Skip for now
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
