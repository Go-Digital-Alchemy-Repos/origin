import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OriginLogo } from "@/components/origin-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Globe,
  Layers,
  Zap,
  Shield,
  ArrowRight,
  Code2,
  Palette,
  Package,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: Globe,
    title: "Site Builder",
    desc: "Visual drag-and-drop page builder with live preview and responsive editing.",
  },
  {
    icon: Layers,
    title: "Module System",
    desc: "Install only what you need. Every feature is a module you can enable or disable.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Static-first rendering with edge caching. Sub-second page loads out of the box.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Role-based access, audit logging, and automatic security patches built in.",
  },
  {
    icon: Code2,
    title: "Developer First",
    desc: "TypeScript APIs, CLI tools, and comprehensive documentation for every module.",
  },
  {
    icon: Palette,
    title: "Design System",
    desc: "Global component registry with consistent tokens, themes, and brand controls.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "<200ms", label: "Avg Response" },
  { value: "50+", label: "Modules" },
  { value: "10k+", label: "Sites Powered" },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    desc: "Perfect for personal projects",
    features: ["1 site", "Core modules", "Community support", "5GB storage"],
    cta: "Get Started Free",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "For growing businesses",
    features: ["10 sites", "All modules", "Priority support", "50GB storage", "Custom domains", "Analytics"],
    cta: "Start Pro Trial",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large organizations",
    features: ["Unlimited sites", "Custom modules", "Dedicated support", "Unlimited storage", "SSO & SAML", "SLA guarantee"],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <OriginLogo size="md" />
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-features">
            Features
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-pricing">
            Pricing
          </a>
          <a href="#docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-docs">
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm" data-testid="button-login">
              Log In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" data-testid="button-get-started">
              Get Started
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(215 85% 50% / 0.12), transparent)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            Now in Public Beta
          </span>
        </motion.div>
        <motion.h1
          className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          A Mode4rn Platform{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)",
            }}
          >
            for doing Business in a Digital World.
          </span>
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          Build, manage, and scale websites with a modular architecture, visual editor, and enterprise-grade infrastructure.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <Link href="/login">
            <Button size="lg" data-testid="button-hero-cta">
              Start Building
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" data-testid="button-hero-learn">
              See How It Works
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="border-y bg-card/50 py-12">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={i}
          >
            <div className="text-3xl font-bold tracking-tight text-foreground">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <motion.h2
            className="text-3xl font-bold tracking-tight md:text-4xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            Everything you need,{" "}
            <span className="text-muted-foreground">nothing you don't</span>
          </motion.h2>
          <motion.p
            className="mx-auto mt-3 max-w-lg text-muted-foreground"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            A modular platform where every capability is a first-class module you can install, configure, and extend.
          </motion.p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card className="hover-elevate h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <f.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="border-t py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.h2
            className="text-3xl font-bold tracking-tight md:text-4xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            className="mx-auto mt-3 max-w-md text-muted-foreground"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            Start free and scale as you grow. No hidden fees, no surprise charges.
          </motion.p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card
                className={`relative h-full ${plan.popular ? "border-primary/40" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="flex h-full flex-col p-6">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button
                      variant={plan.variant}
                      className="mt-6 w-full"
                      data-testid={`button-plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <OriginLogo size="sm" />
        <div className="flex flex-wrap items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Docs
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ORIGIN. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
}
