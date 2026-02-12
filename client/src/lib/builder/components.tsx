import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function parseArrayProp(val: unknown): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export function HeroBlock({
  headline = "Build Something Amazing",
  subheading = "Start your journey with a platform designed for scale.",
  ctaLabel = "Get Started",
  ctaHref = "#",
  secondaryCtaLabel = "Learn More",
  secondaryCtaHref = "#",
  alignment = "center",
  minHeight = "large",
  backgroundImage = "",
}: Record<string, any>) {
  const heightMap: Record<string, string> = {
    small: "min-h-[300px]",
    medium: "min-h-[400px]",
    large: "min-h-[500px]",
    fullscreen: "min-h-[80vh]",
  };
  const alignMap: Record<string, string> = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  const sectionStyle: React.CSSProperties = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, hsl(220 60% 15%), hsl(220 60% 25%))" };

  return (
    <section
      className={`relative flex flex-col justify-center ${heightMap[minHeight] || heightMap.large} ${alignMap[alignment] || alignMap.center} px-6 py-16`}
      style={sectionStyle}
      data-testid="block-hero"
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          {headline}
        </h1>
        {subheading && (
          <p className="text-lg text-white/80 sm:text-xl">{subheading}</p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          {ctaLabel && (
            <a href={ctaHref || "#"} className="inline-block">
              <Button size="lg" data-testid="button-hero-cta">{ctaLabel}</Button>
            </a>
          )}
          {secondaryCtaLabel && (
            <a href={secondaryCtaHref || "#"} className="inline-block">
              <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm" data-testid="button-hero-secondary">
                {secondaryCtaLabel}
              </Button>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export function FeatureGridBlock({
  heading = "Features",
  subheading = "",
  columns = "3",
  variant = "cards",
  features,
}: Record<string, any>) {
  const items = parseArrayProp(features);
  const colMap: Record<string, string> = {
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className="px-6 py-16" data-testid="block-feature-grid">
      <div className="mx-auto max-w-6xl">
        {heading && <h2 className="text-2xl font-bold text-center mb-2">{heading}</h2>}
        {subheading && <p className="text-muted-foreground text-center mb-8">{subheading}</p>}
        <div className={`grid gap-6 ${colMap[columns] || colMap["3"]}`}>
          {items.map((feature: any, idx: number) => (
            <div key={idx} className={variant === "cards" ? "" : variant === "bordered" ? "border rounded-md p-5" : "p-5"}>
              {variant === "cards" ? (
                <Card>
                  <CardContent className="p-5 space-y-2">
                    <div className="text-sm font-semibold">{feature.title}</div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{feature.title}</div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsBlock({
  heading = "What Our Customers Say",
  layout = "grid",
  columns = "3",
  showRating = true,
  testimonials,
}: Record<string, any>) {
  const items = parseArrayProp(testimonials);
  const colMap: Record<string, string> = {
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <section className="px-6 py-16" data-testid="block-testimonials">
      <div className="mx-auto max-w-6xl">
        {heading && <h2 className="text-2xl font-bold text-center mb-8">{heading}</h2>}
        <div className={layout === "stacked" ? "space-y-4 max-w-2xl mx-auto" : `grid gap-6 ${colMap[columns] || colMap["3"]}`}>
          {items.map((t: any, idx: number) => (
            <Card key={idx}>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm italic text-muted-foreground">"{t.quote}"</p>
                {showRating && t.rating && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingBlock({
  heading = "Simple, Transparent Pricing",
  subheading = "",
  showToggle = true,
  highlightPlan = "Pro",
  plans,
}: Record<string, any>) {
  const items = parseArrayProp(plans);
  const [annual, setAnnual] = useState(false);

  return (
    <section className="px-6 py-16" data-testid="block-pricing">
      <div className="mx-auto max-w-6xl">
        {heading && <h2 className="text-2xl font-bold text-center mb-2">{heading}</h2>}
        {subheading && <p className="text-muted-foreground text-center mb-6">{subheading}</p>}
        {showToggle && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-sm ${!annual ? "font-medium" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}
              data-testid="toggle-billing-period"
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${annual ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-sm ${annual ? "font-medium" : "text-muted-foreground"}`}>Annual</span>
          </div>
        )}
        <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(items.length, 3)}`}>
          {items.map((plan: any, idx: number) => {
            const isHighlighted = plan.name === highlightPlan;
            return (
              <Card key={idx} className={isHighlighted ? "ring-2 ring-primary relative" : ""}>
                {isHighlighted && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="text-3xl font-bold">
                    ${annual ? plan.annualPrice : plan.monthlyPrice}
                    <span className="text-sm font-normal text-muted-foreground">/{annual ? "yr" : "mo"}</span>
                  </div>
                  <ul className="space-y-2">
                    {(plan.features || []).map((f: string, fi: number) => (
                      <li key={fi} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">&#10003;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={isHighlighted ? "default" : "outline"}>
                    {plan.ctaLabel || "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FaqBlock({
  heading = "Frequently Asked Questions",
  subheading = "",
  allowMultiple = false,
  items,
}: Record<string, any>) {
  const faqItems = parseArrayProp(items);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  const toggleItem = (idx: number) => {
    if (allowMultiple) {
      const next = new Set(openSet);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      setOpenSet(next);
    } else {
      setOpenIdx(openIdx === idx ? null : idx);
    }
  };

  const isOpen = (idx: number) => allowMultiple ? openSet.has(idx) : openIdx === idx;

  return (
    <section className="px-6 py-16" data-testid="block-faq">
      <div className="mx-auto max-w-3xl">
        {heading && <h2 className="text-2xl font-bold text-center mb-2">{heading}</h2>}
        {subheading && <p className="text-muted-foreground text-center mb-8">{subheading}</p>}
        <div className="space-y-2">
          {faqItems.map((item: any, idx: number) => (
            <div key={idx} className="border rounded-md">
              <button
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium hover-elevate"
                onClick={() => toggleItem(idx)}
                data-testid={`button-faq-${idx}`}
              >
                {item.question}
                {isOpen(idx) ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {isOpen(idx) && (
                <div className="px-4 pb-3 text-sm text-muted-foreground">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GalleryBlock({
  heading = "Gallery",
  layout = "grid",
  columns = "3",
  aspectRatio = "landscape",
  images,
}: Record<string, any>) {
  const items = parseArrayProp(images);
  const colMap: Record<string, string> = {
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  const ratioMap: Record<string, string> = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "",
  };

  return (
    <section className="px-6 py-16" data-testid="block-gallery">
      <div className="mx-auto max-w-6xl">
        {heading && <h2 className="text-2xl font-bold text-center mb-8">{heading}</h2>}
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-md">
            No images added yet. Add images in the inspector.
          </div>
        ) : (
          <div className={`grid gap-4 ${colMap[columns] || colMap["3"]}`}>
            {items.map((img: any, idx: number) => (
              <div key={idx} className={`overflow-hidden rounded-md bg-muted ${ratioMap[aspectRatio] || ""}`}>
                {img.src ? (
                  <img src={img.src} alt={img.alt || ""} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm min-h-[120px]">
                    Image placeholder
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CtaBlock({
  headline = "Ready to Get Started?",
  description = "Join thousands of teams building with ORIGIN.",
  ctaLabel = "Start Free Trial",
  ctaHref = "#",
  variant = "gradient",
  alignment = "center",
}: Record<string, any>) {
  const bgMap: Record<string, string> = {
    default: "bg-card",
    gradient: "bg-gradient-to-r from-primary to-primary/80 text-white",
    outlined: "border-2 border-primary",
  };

  return (
    <section className={`px-6 py-16 ${bgMap[variant] || bgMap.gradient}`} data-testid="block-cta">
      <div className={`mx-auto max-w-4xl ${alignment === "center" ? "text-center" : "text-left"}`}>
        <h2 className={`text-2xl font-bold mb-3 ${variant === "gradient" ? "text-white" : ""}`}>{headline}</h2>
        {description && (
          <p className={`mb-6 ${variant === "gradient" ? "text-white/80" : "text-muted-foreground"}`}>{description}</p>
        )}
        <a href={ctaHref || "#"}>
          <Button size="lg" variant={variant === "gradient" ? "secondary" : "default"} data-testid="button-cta-action">
            {ctaLabel}
          </Button>
        </a>
      </div>
    </section>
  );
}

export function RichTextBlock({
  content = "",
  maxWidth = "medium",
  alignment = "left",
}: Record<string, any>) {
  const widthMap: Record<string, string> = {
    narrow: "max-w-xl",
    medium: "max-w-3xl",
    wide: "max-w-5xl",
    full: "max-w-full",
  };
  const alignMap: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const lines = (content || "").split("\n");
  const rendered = lines.map((line: string, idx: number) => {
    if (line.startsWith("## ")) return <h2 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={idx} className="text-lg font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <li key={idx} className="ml-4 list-disc text-sm">{line.slice(2)}</li>;
    if (line.trim() === "") return <br key={idx} />;
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
    return <p key={idx} className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
  });

  return (
    <section className="px-6 py-8" data-testid="block-rich-text">
      <div className={`mx-auto ${widthMap[maxWidth] || widthMap.medium} ${alignMap[alignment] || alignMap.left}`}>
        {rendered}
      </div>
    </section>
  );
}

export function DividerBlock({
  variant = "line",
  spacing = "medium",
  width = "full",
}: Record<string, any>) {
  const spacingMap: Record<string, string> = {
    small: "py-4",
    medium: "py-8",
    large: "py-12",
    xlarge: "py-16",
  };
  const widthMap: Record<string, string> = {
    full: "w-full",
    half: "w-1/2 mx-auto",
    third: "w-1/3 mx-auto",
  };

  if (variant === "space") {
    return <div className={spacingMap[spacing] || spacingMap.medium} data-testid="block-divider" />;
  }

  const styleMap: Record<string, string> = {
    line: "border-t border-border",
    dashed: "border-t border-dashed border-border",
    dotted: "border-t border-dotted border-border",
    gradient: "",
  };

  return (
    <div className={`${spacingMap[spacing] || spacingMap.medium}`} data-testid="block-divider">
      {variant === "gradient" ? (
        <div className={`h-px ${widthMap[width] || widthMap.full}`} style={{ background: "linear-gradient(to right, transparent, hsl(var(--border)), transparent)" }} />
      ) : (
        <hr className={`${styleMap[variant] || styleMap.line} ${widthMap[width] || widthMap.full}`} />
      )}
    </div>
  );
}

export function SpacerBlock({
  height = "md",
}: Record<string, any>) {
  const heightMap: Record<string, string> = {
    xs: "h-2",
    sm: "h-4",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
    "2xl": "h-24",
  };

  return (
    <div className={heightMap[height] || heightMap.md} aria-hidden="true" data-testid="block-spacer" />
  );
}

export const componentRenderMap: Record<string, React.ComponentType<any>> = {
  hero: HeroBlock,
  "feature-grid": FeatureGridBlock,
  testimonials: TestimonialsBlock,
  pricing: PricingBlock,
  faq: FaqBlock,
  gallery: GalleryBlock,
  cta: CtaBlock,
  "rich-text": RichTextBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
};
