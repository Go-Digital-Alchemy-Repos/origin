import { db } from "../../db";
import { siteKits, siteKitAssets, marketplaceItems } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedKit(kit: {
  name: string;
  slug: string;
  description: string;
  marketplaceName: string;
  marketplaceSlug: string;
  marketplaceDescription: string;
  marketplaceLongDescription: string;
  tags: string[];
  assets: Array<{
    assetType: string;
    assetRef: string;
    label: string;
    configJson: Record<string, unknown>;
    sortOrder: number;
  }>;
}) {
  const [existing] = await db
    .select()
    .from(siteKits)
    .where(eq(siteKits.slug, kit.slug));

  if (existing) {
    console.log(`  Skipping "${kit.name}" — already exists`);
    return;
  }

  const [siteKit] = await db
    .insert(siteKits)
    .values({
      name: kit.name,
      slug: kit.slug,
      description: kit.description,
      version: "1.0.0",
      status: "published",
      metadataJson: { industry: kit.tags[2] || "general", assetCount: kit.assets.length },
    })
    .returning();

  for (const asset of kit.assets) {
    await db.insert(siteKitAssets).values({
      siteKitId: siteKit.id,
      assetType: asset.assetType,
      assetRef: asset.assetRef,
      label: asset.label,
      configJson: asset.configJson,
      sortOrder: asset.sortOrder,
    });
  }

  const [mpItem] = await db
    .insert(marketplaceItems)
    .values({
      type: "site-kit",
      name: kit.marketplaceName,
      slug: kit.marketplaceSlug,
      description: kit.marketplaceDescription,
      longDescription: kit.marketplaceLongDescription,
      icon: "package",
      author: "ORIGIN",
      isFree: true,
      price: 0,
      billingType: "free",
      version: "1.0.0",
      status: "published",
      category: "site-kit",
      tags: kit.tags,
      metadata: {
        siteKitId: siteKit.id,
        is_onboarding_eligible: true,
        is_featured: true,
        display_badge: "Free",
      },
    })
    .returning();

  await db
    .update(siteKits)
    .set({ marketplaceItemId: mpItem.id, updatedAt: new Date() })
    .where(eq(siteKits.id, siteKit.id));

  console.log(`  Seeded "${kit.name}" with ${kit.assets.length} assets`);
}

export async function seedStarterKits() {
  console.log("Seeding starter kits...");

  await seedKit({
    name: "Contractor / Home Services",
    slug: "contractor-home-services",
    description: "A complete website kit for contractors, handymen, and home service professionals. Includes service listings, before/after gallery, service area maps, and lead capture forms.",
    marketplaceName: "Contractor / Home Services Starter Kit",
    marketplaceSlug: "starter-kit-contractor-home-services",
    marketplaceDescription: "Launch your home services business online with a professional website featuring service listings, testimonials, and lead generation forms.",
    marketplaceLongDescription: "Everything you need to establish a strong online presence for your contracting or home services business. This kit includes a polished homepage with hero section, a services grid showcasing your specialties, before/after project gallery, customer testimonials, service area information, FAQ section, and a lead capture contact form. Built with warm earth tones and a professional layout that builds trust with homeowners.",
    tags: ["site-kit", "starter", "contractor", "home-services"],
    assets: [
      {
        assetType: "theme_preset",
        assetRef: "theme-contractor",
        label: "Contractor Theme",
        sortOrder: 0,
        configJson: {
          light: {
            surface: "#ffffff",
            text: "#1e293b",
            accent: "#d97706",
            accentForeground: "#ffffff",
            muted: "#f8f5f0",
            mutedForeground: "#64748b",
            border: "#e2e0db",
          },
          dark: {
            surface: "#1a1a2e",
            text: "#f1f5f9",
            accent: "#f59e0b",
            accentForeground: "#1a1a2e",
            muted: "#262640",
            mutedForeground: "#94a3b8",
            border: "#3b3b5c",
          },
          layout: {
            headerStyle: "transparent",
            footerStyle: "dark",
            containerMax: "1200px",
            sectionSpacing: "80px",
            buttonRadius: "6px",
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-home",
        label: "Home",
        sortOrder: 1,
        configJson: {
          title: "Home",
          slug: "home",
          seoTitle: "Home | Professional Home Services",
          seoDescription: "Trusted local contractors delivering fast, reliable home services. Plumbing, electrical, HVAC, roofing, painting, and landscaping.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Fast, Reliable Service in Your Area",
                  subheading: "From plumbing repairs to full renovations, our licensed professionals deliver quality craftsmanship you can count on. Serving homeowners since 2005.",
                  ctaLabel: "Request a Free Quote",
                  ctaHref: "/contact",
                  secondaryCtaLabel: "View Our Services",
                  secondaryCtaHref: "/services",
                  alignment: "center",
                  minHeight: "large",
                },
              },
              {
                type: "ServicesGrid",
                props: {
                  title: "Our Services",
                  subtitle: "Comprehensive home solutions backed by licensed, insured professionals.",
                  items: [
                    { icon: "wrench", title: "Plumbing", description: "Leak repairs, pipe installation, water heater service, and drain cleaning." },
                    { icon: "zap", title: "Electrical", description: "Panel upgrades, wiring, lighting installation, and safety inspections." },
                    { icon: "thermometer", title: "HVAC", description: "Heating and cooling installation, maintenance, and 24/7 emergency repairs." },
                    { icon: "home", title: "Roofing", description: "Roof repairs, replacements, gutter installation, and storm damage restoration." },
                    { icon: "paintbrush", title: "Painting", description: "Interior and exterior painting, staining, power washing, and color consultation." },
                    { icon: "trees", title: "Landscaping", description: "Lawn care, garden design, hardscaping, irrigation, and seasonal maintenance." },
                  ],
                },
              },
              {
                type: "Stats",
                props: {
                  title: "Trusted by Homeowners",
                  items: [
                    { value: "2,500+", label: "Projects Completed" },
                    { value: "18", label: "Years of Experience" },
                    { value: "4.9", label: "Average Rating" },
                    { value: "100%", label: "Licensed & Insured" },
                  ],
                },
              },
              {
                type: "Testimonials",
                props: {
                  heading: "What Our Clients Say",
                  layout: "grid",
                  columns: "3",
                  showRating: true,
                  testimonials: [
                    { name: "Robert M.", role: "Homeowner", quote: "They fixed our burst pipe within two hours of calling. Incredible response time and fair pricing.", rating: 5 },
                    { name: "Lisa K.", role: "Property Manager", quote: "We use them for all our rental properties. Consistently reliable work across plumbing, electrical, and HVAC.", rating: 5 },
                    { name: "James T.", role: "Homeowner", quote: "The roof replacement was done in a day and looks fantastic. Professional crew from start to finish.", rating: 5 },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Ready to Get Started?",
                  description: "Request a free, no-obligation quote today. We respond within 2 hours during business hours.",
                  ctaLabel: "Request a Quote",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-about",
        label: "About",
        sortOrder: 2,
        configJson: {
          title: "About",
          slug: "about",
          seoTitle: "About Us | Professional Home Services",
          seoDescription: "Learn about our team of licensed professionals with 18+ years of experience delivering quality home services.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Built on Trust, Driven by Quality",
                  subheading: "Since 2005, we've been the go-to home service provider for families across the region. Every project reflects our commitment to craftsmanship and customer satisfaction.",
                  ctaLabel: "Meet Our Team",
                  ctaHref: "#team",
                  alignment: "center",
                  minHeight: "medium",
                },
              },
              {
                type: "FeatureList",
                props: {
                  title: "Why Choose Us",
                  items: [
                    { icon: "shield-check", title: "Licensed & Insured", description: "Every technician is fully licensed, bonded, and insured for your protection." },
                    { icon: "clock", title: "On-Time Guarantee", description: "We respect your schedule. If we're late, your service call is free." },
                    { icon: "badge-check", title: "Satisfaction Guaranteed", description: "We stand behind every job with a 1-year workmanship warranty." },
                    { icon: "phone", title: "24/7 Emergency Service", description: "Burst pipe at midnight? We've got you covered with round-the-clock emergency response." },
                  ],
                },
              },
              {
                type: "Stats",
                props: {
                  title: "Our Track Record",
                  items: [
                    { value: "2,500+", label: "Projects Completed" },
                    { value: "18+", label: "Years in Business" },
                    { value: "50+", label: "Team Members" },
                    { value: "98%", label: "Client Satisfaction" },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Let's Discuss Your Project",
                  description: "Whether it's a small repair or a major renovation, we're here to help.",
                  ctaLabel: "Get in Touch",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-services",
        label: "Services",
        sortOrder: 3,
        configJson: {
          title: "Services",
          slug: "services",
          seoTitle: "Our Services | Professional Home Services",
          seoDescription: "Comprehensive home services including plumbing, electrical, HVAC, roofing, painting, and landscaping. Licensed professionals, fair pricing.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Services You Can Count On",
                  subheading: "From emergency repairs to planned renovations, our licensed professionals handle it all with precision and care.",
                  ctaLabel: "Request a Quote",
                  ctaHref: "/contact",
                  alignment: "center",
                  minHeight: "medium",
                },
              },
              {
                type: "ServicesGrid",
                props: {
                  title: "What We Offer",
                  subtitle: "Full-service home solutions for every need.",
                  items: [
                    { icon: "wrench", title: "Plumbing", description: "Complete plumbing services from leak detection to full bathroom remodels. Emergency service available 24/7." },
                    { icon: "zap", title: "Electrical", description: "Residential electrical work including panel upgrades, outlet installation, and whole-home rewiring." },
                    { icon: "thermometer", title: "HVAC", description: "Keep your home comfortable year-round with our heating and cooling installation, repair, and maintenance." },
                    { icon: "home", title: "Roofing", description: "Protect your investment with expert roof repairs, replacements, and preventative maintenance programs." },
                    { icon: "paintbrush", title: "Painting", description: "Transform your space with professional interior and exterior painting. Free color consultations included." },
                    { icon: "trees", title: "Landscaping", description: "Create your dream outdoor space with custom landscape design, installation, and ongoing maintenance." },
                  ],
                },
              },
              {
                type: "Gallery",
                props: {
                  heading: "Before & After",
                  layout: "grid",
                  columns: "3",
                  enableLightbox: true,
                  aspectRatio: "landscape",
                  images: [],
                },
              },
              {
                type: "FAQ",
                props: {
                  heading: "Common Questions",
                  subheading: "Answers to our most frequently asked questions.",
                  showSearch: false,
                  allowMultiple: false,
                  items: [
                    { question: "Are you licensed and insured?", answer: "Yes, all of our technicians are fully licensed, bonded, and insured. We carry comprehensive liability and workers' compensation coverage." },
                    { question: "Do you offer free estimates?", answer: "Absolutely. We provide free, no-obligation estimates for all projects. Contact us to schedule a visit." },
                    { question: "What areas do you serve?", answer: "We serve the greater metropolitan area and surrounding communities within a 30-mile radius." },
                    { question: "Do you offer emergency services?", answer: "Yes, we offer 24/7 emergency services for plumbing, electrical, and HVAC issues. Call our emergency line anytime." },
                    { question: "What payment methods do you accept?", answer: "We accept all major credit cards, checks, and offer financing options for larger projects." },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Request a Quote",
                  description: "Tell us about your project and we'll provide a free estimate within 24 hours.",
                  ctaLabel: "Get Your Free Quote",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-contact",
        label: "Contact",
        sortOrder: 4,
        configJson: {
          title: "Contact",
          slug: "contact",
          seoTitle: "Contact Us | Professional Home Services",
          seoDescription: "Get in touch for a free estimate. Call us or fill out our contact form and we'll respond within 2 hours.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Get in Touch",
                  subheading: "Ready for your project to begin? Fill out the form below and we'll get back to you within 2 business hours.",
                  alignment: "center",
                  minHeight: "small",
                },
              },
              {
                type: "ContactForm",
                props: {
                  title: "Request a Quote",
                  subtitle: "Tell us about your project and a member of our team will follow up promptly.",
                  formRef: "contact-form",
                },
              },
              {
                type: "LocationMap",
                props: {
                  title: "Service Area",
                  description: "We proudly serve the greater metropolitan area and surrounding communities within a 30-mile radius.",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-hero",
        label: "Contractor Hero",
        sortOrder: 10,
        configJson: {
          componentSlug: "hero",
          presetName: "Contractor Hero",
          props: {
            headline: "Fast, Reliable Service in Your Area",
            subheading: "From plumbing repairs to full renovations, our licensed professionals deliver quality craftsmanship you can count on.",
            ctaLabel: "Request a Free Quote",
            ctaHref: "/contact",
            secondaryCtaLabel: "View Our Services",
            secondaryCtaHref: "/services",
            alignment: "center",
            minHeight: "large",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-services-grid",
        label: "Home Services Grid",
        sortOrder: 11,
        configJson: {
          componentSlug: "feature-grid",
          presetName: "Home Services Grid",
          props: {
            heading: "Our Services",
            subheading: "Comprehensive home solutions backed by licensed, insured professionals.",
            columns: "3",
            variant: "cards",
            features: [
              { icon: "wrench", title: "Plumbing", description: "Leak repairs, pipe installation, water heater service, and drain cleaning." },
              { icon: "zap", title: "Electrical", description: "Panel upgrades, wiring, lighting installation, and safety inspections." },
              { icon: "thermometer", title: "HVAC", description: "Heating and cooling installation, maintenance, and 24/7 emergency repairs." },
              { icon: "home", title: "Roofing", description: "Roof repairs, replacements, gutter installation, and storm damage restoration." },
              { icon: "paintbrush", title: "Painting", description: "Interior and exterior painting, staining, power washing, and color consultation." },
              { icon: "trees", title: "Landscaping", description: "Lawn care, garden design, hardscaping, irrigation, and seasonal maintenance." },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-before-after",
        label: "Before & After Gallery",
        sortOrder: 12,
        configJson: {
          componentSlug: "gallery",
          presetName: "Before & After Gallery",
          props: {
            heading: "Before & After",
            layout: "grid",
            columns: "3",
            enableLightbox: true,
            aspectRatio: "landscape",
            images: [],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-testimonials",
        label: "Client Testimonials",
        sortOrder: 13,
        configJson: {
          componentSlug: "testimonials",
          presetName: "Contractor Testimonials",
          props: {
            heading: "What Our Clients Say",
            layout: "grid",
            columns: "3",
            showRating: true,
            testimonials: [
              { name: "Robert M.", role: "Homeowner", quote: "They fixed our burst pipe within two hours of calling. Incredible response time and fair pricing.", rating: 5 },
              { name: "Lisa K.", role: "Property Manager", quote: "We use them for all our rental properties. Consistently reliable work across plumbing, electrical, and HVAC.", rating: 5 },
              { name: "James T.", role: "Homeowner", quote: "The roof replacement was done in a day and looks fantastic. Professional crew from start to finish.", rating: 5 },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-service-area",
        label: "Service Area",
        sortOrder: 14,
        configJson: {
          componentSlug: "location-map",
          presetName: "Service Area Map",
          props: {
            title: "Our Service Area",
            description: "We proudly serve the greater metropolitan area and surrounding communities within a 30-mile radius. Contact us to confirm availability in your neighborhood.",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-faq",
        label: "Contractor FAQ",
        sortOrder: 15,
        configJson: {
          componentSlug: "faq",
          presetName: "Contractor FAQ",
          props: {
            heading: "Frequently Asked Questions",
            subheading: "Answers to common questions about our services.",
            showSearch: false,
            allowMultiple: false,
            items: [
              { question: "Are you licensed and insured?", answer: "Yes, all of our technicians are fully licensed, bonded, and insured. We carry comprehensive liability and workers' compensation coverage." },
              { question: "Do you offer free estimates?", answer: "Absolutely. We provide free, no-obligation estimates for all projects. Contact us to schedule a visit." },
              { question: "What areas do you serve?", answer: "We serve the greater metropolitan area and surrounding communities within a 30-mile radius." },
              { question: "Do you offer emergency services?", answer: "Yes, we offer 24/7 emergency services for plumbing, electrical, and HVAC issues. Call our emergency line anytime." },
              { question: "What payment methods do you accept?", answer: "We accept all major credit cards, checks, and offer financing options for larger projects." },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-cta",
        label: "Request a Quote CTA",
        sortOrder: 16,
        configJson: {
          componentSlug: "cta",
          presetName: "Request a Quote",
          props: {
            headline: "Ready to Get Started?",
            description: "Request a free, no-obligation quote today. We respond within 2 hours during business hours.",
            ctaLabel: "Request a Quote",
            ctaHref: "/contact",
            variant: "gradient",
            alignment: "center",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-contact-form",
        label: "Contact Form Section",
        sortOrder: 17,
        configJson: {
          componentSlug: "contact-form",
          presetName: "Contractor Contact Form",
          props: {
            title: "Request a Quote",
            subtitle: "Fill out the form below and a member of our team will get back to you within 2 business hours.",
            formRef: "contact-form",
          },
        },
      },
      {
        assetType: "menu",
        assetRef: "menu-header",
        label: "Header Navigation",
        sortOrder: 20,
        configJson: {
          name: "Header Navigation",
          slot: "header",
          items: [
            { label: "Home", target: "/", type: "page", sortOrder: 0 },
            { label: "About", target: "/about", type: "page", sortOrder: 1 },
            { label: "Services", target: "/services", type: "page", sortOrder: 2 },
            { label: "Contact", target: "/contact", type: "page", sortOrder: 3 },
          ],
        },
      },
      {
        assetType: "menu",
        assetRef: "menu-footer",
        label: "Footer Navigation",
        sortOrder: 21,
        configJson: {
          name: "Footer Navigation",
          slot: "footer",
          items: [
            { label: "Contact", target: "/contact", type: "page", sortOrder: 0 },
            { label: "Privacy Policy", target: "/privacy", type: "page", sortOrder: 1 },
          ],
        },
      },
      {
        assetType: "form",
        assetRef: "form-contact",
        label: "Contact Form",
        sortOrder: 25,
        configJson: {
          name: "Contact Form",
          fields: [
            { id: "name", type: "text", label: "Full Name", required: true },
            { id: "email", type: "email", label: "Email Address", required: true },
            { id: "phone", type: "phone", label: "Phone Number", required: false },
            {
              id: "service_needed",
              type: "select",
              label: "Service Needed",
              required: false,
              options: ["Plumbing", "Electrical", "HVAC", "Roofing", "Painting", "Landscaping", "Other"],
            },
            { id: "message", type: "textarea", label: "Project Details", required: false },
          ],
          settings: {
            submitLabel: "Request a Quote",
            successMessage: "Thank you! We'll be in touch within 2 business hours.",
            honeypotEnabled: true,
            rateLimitPerMinute: 5,
          },
        },
      },
      {
        assetType: "seo_defaults",
        assetRef: "seo-defaults",
        label: "SEO Defaults",
        sortOrder: 30,
        configJson: {
          titleSuffix: "| Professional Home Services",
          defaultIndexable: true,
          robotsTxt: "User-agent: *\nAllow: /\nSitemap: /sitemap.xml",
        },
      },
    ],
  });

  await seedKit({
    name: "Professional Services",
    slug: "professional-services",
    description: "A polished website kit for consulting firms, accounting practices, law offices, and professional service providers. Features team profiles, case studies, and consultation booking.",
    marketplaceName: "Professional Services Starter Kit",
    marketplaceSlug: "starter-kit-professional-services",
    marketplaceDescription: "Establish credibility and attract clients with a professional website featuring team profiles, service descriptions, case studies, and consultation booking.",
    marketplaceLongDescription: "Designed for consulting firms, accounting practices, legal advisories, and other professional service providers. This kit includes a sophisticated homepage with credibility highlights, comprehensive services overview, team/leadership section, case study showcases, client testimonials, FAQ, and a consultation booking form. Built with corporate blue tones that convey trust and professionalism.",
    tags: ["site-kit", "starter", "professional-services", "consulting"],
    assets: [
      {
        assetType: "theme_preset",
        assetRef: "theme-professional",
        label: "Professional Theme",
        sortOrder: 0,
        configJson: {
          light: {
            surface: "#ffffff",
            text: "#0f172a",
            accent: "#0d9488",
            accentForeground: "#ffffff",
            muted: "#f0f4f8",
            mutedForeground: "#64748b",
            border: "#e2e8f0",
          },
          dark: {
            surface: "#0c1524",
            text: "#f1f5f9",
            accent: "#2dd4bf",
            accentForeground: "#0c1524",
            muted: "#1a2744",
            mutedForeground: "#94a3b8",
            border: "#2d3f5e",
          },
          layout: {
            headerStyle: "standard",
            footerStyle: "columns",
            containerMax: "1200px",
            sectionSpacing: "80px",
            buttonRadius: "6px",
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-home",
        label: "Home",
        sortOrder: 1,
        configJson: {
          title: "Home",
          slug: "home",
          seoTitle: "Home | Expert Professional Services",
          seoDescription: "Strategic consulting, accounting, legal advisory, and business solutions. Trusted by leading organizations for over a decade.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Strategic Solutions for Growing Businesses",
                  subheading: "We partner with ambitious organizations to deliver consulting, strategy, and operational excellence. Trusted by 500+ businesses across industries.",
                  ctaLabel: "Book a Consultation",
                  ctaHref: "/contact",
                  secondaryCtaLabel: "Our Services",
                  secondaryCtaHref: "/services",
                  alignment: "center",
                  minHeight: "large",
                },
              },
              {
                type: "Stats",
                props: {
                  title: "Proven Results",
                  items: [
                    { value: "500+", label: "Clients Served" },
                    { value: "$2.1B", label: "Client Revenue Managed" },
                    { value: "95%", label: "Client Retention Rate" },
                    { value: "12+", label: "Years of Excellence" },
                  ],
                },
              },
              {
                type: "ServicesGrid",
                props: {
                  title: "What We Do",
                  subtitle: "Comprehensive professional services tailored to your business needs.",
                  items: [
                    { icon: "compass", title: "Consulting", description: "Data-driven insights and actionable recommendations to optimize operations and accelerate growth." },
                    { icon: "target", title: "Strategy", description: "Long-term strategic planning, market analysis, and competitive positioning for sustainable advantage." },
                    { icon: "calculator", title: "Tax & Accounting", description: "Full-service tax planning, bookkeeping, auditing, and financial reporting for businesses of all sizes." },
                    { icon: "scale", title: "Legal Advisory", description: "Corporate law, contract negotiation, regulatory compliance, and intellectual property protection." },
                    { icon: "users", title: "HR Solutions", description: "Talent acquisition, organizational design, compensation planning, and employee development programs." },
                    { icon: "server", title: "IT Management", description: "Technology strategy, infrastructure optimization, cybersecurity, and digital transformation initiatives." },
                  ],
                },
              },
              {
                type: "Testimonials",
                props: {
                  heading: "Client Testimonials",
                  layout: "grid",
                  columns: "3",
                  showRating: true,
                  testimonials: [
                    { name: "David Chen", role: "CEO, TechVentures Inc.", quote: "Their strategic guidance helped us scale from $5M to $25M in revenue in just three years. An indispensable partner.", rating: 5 },
                    { name: "Sarah Williams", role: "CFO, Meridian Group", quote: "The tax and accounting team saved us over $400K in the first year alone. Exceptional expertise and attention to detail.", rating: 5 },
                    { name: "Michael Torres", role: "Founder, Apex Dynamics", quote: "From legal structuring to HR consulting, they've been our one-stop partner for scaling responsibly.", rating: 5 },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Let's Build Your Growth Strategy",
                  description: "Schedule a complimentary 30-minute consultation to discuss how we can help your business thrive.",
                  ctaLabel: "Book a Consultation",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-about",
        label: "About",
        sortOrder: 2,
        configJson: {
          title: "About",
          slug: "about",
          seoTitle: "About Us | Expert Professional Services",
          seoDescription: "Meet the team of experienced professionals dedicated to helping businesses grow, optimize, and succeed.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Experience Meets Innovation",
                  subheading: "Founded in 2012, we bring together seasoned professionals across consulting, finance, legal, and technology to deliver integrated solutions that drive results.",
                  ctaLabel: "Our Story",
                  ctaHref: "#story",
                  alignment: "center",
                  minHeight: "medium",
                },
              },
              {
                type: "FeatureList",
                props: {
                  title: "Our Values",
                  items: [
                    { icon: "handshake", title: "Integrity First", description: "We build relationships on transparency, honesty, and accountability in every engagement." },
                    { icon: "lightbulb", title: "Innovation", description: "We combine proven methodologies with cutting-edge approaches to deliver superior outcomes." },
                    { icon: "bar-chart-3", title: "Results-Driven", description: "Every recommendation is backed by data and measured against clear performance benchmarks." },
                    { icon: "heart", title: "Client-Centric", description: "Your success is our success. We invest in understanding your business as deeply as you do." },
                  ],
                },
              },
              {
                type: "TeamGrid",
                props: {
                  title: "Leadership Team",
                  subtitle: "Guided by experienced professionals with decades of combined industry expertise.",
                  members: [
                    { name: "Alexandra Reid", title: "Managing Partner", bio: "20+ years in management consulting. Former McKinsey principal." },
                    { name: "Jonathan Park", title: "Head of Tax & Accounting", bio: "CPA with 15 years of experience in corporate tax strategy and compliance." },
                    { name: "Catherine Nguyen", title: "Legal Director", bio: "JD from Columbia Law. Specializes in corporate governance and M&A." },
                    { name: "Marcus Brown", title: "Technology Lead", bio: "Former CTO at three startups. Expert in digital transformation and cloud architecture." },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Partner With Us",
                  description: "Discover how our team can help your organization achieve its goals.",
                  ctaLabel: "Schedule a Call",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-services",
        label: "Services",
        sortOrder: 3,
        configJson: {
          title: "Services",
          slug: "services",
          seoTitle: "Our Services | Expert Professional Services",
          seoDescription: "Consulting, strategy, tax & accounting, legal advisory, HR solutions, and IT management. Tailored to your business.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Comprehensive Business Solutions",
                  subheading: "We deliver integrated professional services designed to address every aspect of your business, from strategy and operations to compliance and technology.",
                  ctaLabel: "Get Started",
                  ctaHref: "/contact",
                  alignment: "center",
                  minHeight: "medium",
                },
              },
              {
                type: "ServicesGrid",
                props: {
                  title: "Our Expertise",
                  subtitle: "Deep industry knowledge combined with cross-functional capabilities.",
                  items: [
                    { icon: "compass", title: "Consulting", description: "Operational assessments, process optimization, change management, and performance improvement programs tailored to your industry." },
                    { icon: "target", title: "Strategy", description: "Market entry analysis, competitive positioning, growth roadmaps, and M&A advisory to fuel your next phase of expansion." },
                    { icon: "calculator", title: "Tax & Accounting", description: "Tax planning and compliance, audit preparation, management reporting, and CFO-as-a-service for growing businesses." },
                    { icon: "scale", title: "Legal Advisory", description: "Corporate structuring, contract drafting and review, regulatory compliance, and dispute resolution." },
                    { icon: "users", title: "HR Solutions", description: "Executive search, compensation benchmarking, organizational design, and employee engagement programs." },
                    { icon: "server", title: "IT Management", description: "Technology roadmapping, cloud migration, cybersecurity frameworks, and managed IT services." },
                  ],
                },
              },
              {
                type: "FAQ",
                props: {
                  heading: "Frequently Asked Questions",
                  subheading: "Common questions about our services and engagement process.",
                  showSearch: false,
                  allowMultiple: false,
                  items: [
                    { question: "How do engagements typically begin?", answer: "We start with a complimentary 30-minute consultation to understand your needs. From there, we develop a tailored proposal with clear scope, timeline, and pricing." },
                    { question: "Do you work with businesses of all sizes?", answer: "Yes, we serve startups, mid-market companies, and enterprise organizations. Our services scale to match your needs and budget." },
                    { question: "What industries do you specialize in?", answer: "We have deep expertise in technology, healthcare, financial services, manufacturing, and professional services, though our methodologies apply across all sectors." },
                    { question: "How do you measure success?", answer: "Every engagement begins with defined KPIs and success metrics. We provide regular progress reports and adjust our approach as needed to ensure we meet your objectives." },
                    { question: "Can we engage for a single project or on retainer?", answer: "Both options are available. We offer project-based engagements, monthly retainers, and fractional executive services to suit your preferences." },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Book a Consultation",
                  description: "Let's discuss how our expertise can support your business objectives. First consultation is complimentary.",
                  ctaLabel: "Schedule Now",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-contact",
        label: "Contact",
        sortOrder: 4,
        configJson: {
          title: "Contact",
          slug: "contact",
          seoTitle: "Contact Us | Expert Professional Services",
          seoDescription: "Schedule a complimentary consultation or get in touch with our team. We respond within one business day.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Start the Conversation",
                  subheading: "Fill out the form below and one of our partners will reach out within one business day to schedule your complimentary consultation.",
                  alignment: "center",
                  minHeight: "small",
                },
              },
              {
                type: "ContactForm",
                props: {
                  title: "Book a Consultation",
                  subtitle: "Tell us about your business and what you're looking to achieve. We'll match you with the right team.",
                  formRef: "contact-form",
                },
              },
              {
                type: "LocationMap",
                props: {
                  title: "Our Office",
                  description: "Located in the heart of the financial district. Available for in-person and virtual meetings.",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-hero",
        label: "Professional Hero",
        sortOrder: 10,
        configJson: {
          componentSlug: "hero",
          presetName: "Professional Hero",
          props: {
            headline: "Strategic Solutions for Growing Businesses",
            subheading: "We partner with ambitious organizations to deliver consulting, strategy, and operational excellence.",
            ctaLabel: "Book a Consultation",
            ctaHref: "/contact",
            secondaryCtaLabel: "Our Services",
            secondaryCtaHref: "/services",
            alignment: "center",
            minHeight: "large",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-services-grid",
        label: "Professional Services Grid",
        sortOrder: 11,
        configJson: {
          componentSlug: "feature-grid",
          presetName: "Professional Services Grid",
          props: {
            heading: "What We Do",
            subheading: "Comprehensive professional services tailored to your business needs.",
            columns: "3",
            variant: "cards",
            features: [
              { icon: "compass", title: "Consulting", description: "Data-driven insights and actionable recommendations to optimize operations." },
              { icon: "target", title: "Strategy", description: "Long-term strategic planning and competitive positioning." },
              { icon: "calculator", title: "Tax & Accounting", description: "Full-service tax planning, bookkeeping, and financial reporting." },
              { icon: "scale", title: "Legal Advisory", description: "Corporate law, contract negotiation, and regulatory compliance." },
              { icon: "users", title: "HR Solutions", description: "Talent acquisition, organizational design, and employee development." },
              { icon: "server", title: "IT Management", description: "Technology strategy, infrastructure optimization, and cybersecurity." },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-team",
        label: "Leadership Team",
        sortOrder: 12,
        configJson: {
          componentSlug: "team-grid",
          presetName: "Leadership Team",
          props: {
            title: "Leadership Team",
            subtitle: "Guided by experienced professionals with decades of combined expertise.",
            members: [
              { name: "Alexandra Reid", title: "Managing Partner", bio: "20+ years in management consulting." },
              { name: "Jonathan Park", title: "Head of Tax & Accounting", bio: "CPA with 15 years of corporate tax experience." },
              { name: "Catherine Nguyen", title: "Legal Director", bio: "Specializes in corporate governance and M&A." },
              { name: "Marcus Brown", title: "Technology Lead", bio: "Expert in digital transformation and cloud architecture." },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-case-studies",
        label: "Case Studies",
        sortOrder: 13,
        configJson: {
          componentSlug: "feature-grid",
          presetName: "Case Studies",
          props: {
            heading: "Case Studies",
            subheading: "Real results from real client partnerships.",
            columns: "3",
            variant: "cards",
            features: [
              { icon: "trending-up", title: "5x Revenue Growth", description: "Helped a SaaS startup scale from $2M to $10M ARR through strategic positioning and operational optimization." },
              { icon: "shield-check", title: "Regulatory Compliance", description: "Guided a healthcare company through complex compliance requirements, avoiding $1.2M in potential penalties." },
              { icon: "rocket", title: "Digital Transformation", description: "Led a mid-market manufacturer's digital overhaul, reducing operational costs by 35% within 18 months." },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-testimonials",
        label: "Client Testimonials",
        sortOrder: 14,
        configJson: {
          componentSlug: "testimonials",
          presetName: "Professional Testimonials",
          props: {
            heading: "Client Testimonials",
            layout: "grid",
            columns: "3",
            showRating: true,
            testimonials: [
              { name: "David Chen", role: "CEO, TechVentures Inc.", quote: "Their strategic guidance helped us scale from $5M to $25M in revenue in just three years.", rating: 5 },
              { name: "Sarah Williams", role: "CFO, Meridian Group", quote: "The tax team saved us over $400K in the first year. Exceptional expertise.", rating: 5 },
              { name: "Michael Torres", role: "Founder, Apex Dynamics", quote: "From legal structuring to HR consulting, they've been our one-stop partner.", rating: 5 },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-faq",
        label: "Professional FAQ",
        sortOrder: 15,
        configJson: {
          componentSlug: "faq",
          presetName: "Professional FAQ",
          props: {
            heading: "Frequently Asked Questions",
            subheading: "Common questions about our services and engagement process.",
            showSearch: false,
            allowMultiple: false,
            items: [
              { question: "How do engagements typically begin?", answer: "We start with a complimentary 30-minute consultation to understand your needs." },
              { question: "Do you work with businesses of all sizes?", answer: "Yes, from startups to enterprise organizations. Our services scale to match your needs." },
              { question: "What industries do you specialize in?", answer: "Technology, healthcare, financial services, manufacturing, and professional services." },
              { question: "How do you measure success?", answer: "Every engagement begins with defined KPIs and regular progress reports." },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-cta",
        label: "Consultation CTA",
        sortOrder: 16,
        configJson: {
          componentSlug: "cta",
          presetName: "Book a Consultation",
          props: {
            headline: "Let's Build Your Growth Strategy",
            description: "Schedule a complimentary 30-minute consultation to discuss how we can help your business thrive.",
            ctaLabel: "Book a Consultation",
            ctaHref: "/contact",
            variant: "gradient",
            alignment: "center",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-contact-form",
        label: "Consultation Form",
        sortOrder: 17,
        configJson: {
          componentSlug: "contact-form",
          presetName: "Professional Contact Form",
          props: {
            title: "Book a Consultation",
            subtitle: "Tell us about your business and we'll match you with the right team.",
            formRef: "contact-form",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-stats",
        label: "Credibility Stats",
        sortOrder: 18,
        configJson: {
          componentSlug: "stats",
          presetName: "Credibility Highlights",
          props: {
            title: "Proven Results",
            items: [
              { value: "500+", label: "Clients Served" },
              { value: "$2.1B", label: "Client Revenue Managed" },
              { value: "95%", label: "Client Retention Rate" },
              { value: "12+", label: "Years of Excellence" },
            ],
          },
        },
      },
      {
        assetType: "menu",
        assetRef: "menu-header",
        label: "Header Navigation",
        sortOrder: 20,
        configJson: {
          name: "Header Navigation",
          slot: "header",
          items: [
            { label: "Home", target: "/", type: "page", sortOrder: 0 },
            { label: "About", target: "/about", type: "page", sortOrder: 1 },
            { label: "Services", target: "/services", type: "page", sortOrder: 2 },
            { label: "Contact", target: "/contact", type: "page", sortOrder: 3 },
          ],
        },
      },
      {
        assetType: "menu",
        assetRef: "menu-footer",
        label: "Footer Navigation",
        sortOrder: 21,
        configJson: {
          name: "Footer Navigation",
          slot: "footer",
          items: [
            { label: "Contact", target: "/contact", type: "page", sortOrder: 0 },
            { label: "Privacy Policy", target: "/privacy", type: "page", sortOrder: 1 },
          ],
        },
      },
      {
        assetType: "form",
        assetRef: "form-contact",
        label: "Contact Form",
        sortOrder: 25,
        configJson: {
          name: "Contact Form",
          fields: [
            { id: "name", type: "text", label: "Full Name", required: true },
            { id: "email", type: "email", label: "Email Address", required: true },
            { id: "company", type: "text", label: "Company Name", required: false },
            { id: "phone", type: "phone", label: "Phone Number", required: false },
            {
              id: "service_interest",
              type: "select",
              label: "Service of Interest",
              required: false,
              options: ["Consulting", "Strategy", "Tax & Accounting", "Legal Advisory", "HR Solutions", "IT Management", "Other"],
            },
            { id: "message", type: "textarea", label: "Tell Us About Your Needs", required: false },
          ],
          settings: {
            submitLabel: "Book a Consultation",
            successMessage: "Thank you! A member of our team will reach out within one business day.",
            honeypotEnabled: true,
            rateLimitPerMinute: 5,
          },
        },
      },
      {
        assetType: "seo_defaults",
        assetRef: "seo-defaults",
        label: "SEO Defaults",
        sortOrder: 30,
        configJson: {
          titleSuffix: "| Expert Professional Services",
          defaultIndexable: true,
          robotsTxt: "User-agent: *\nAllow: /\nSitemap: /sitemap.xml",
        },
      },
    ],
  });

  await seedKit({
    name: "Restaurant / Hospitality",
    slug: "restaurant-hospitality",
    description: "An elegant website kit for restaurants, cafes, bars, and hospitality venues. Features menu highlights, reservation forms, events calendar, and gallery.",
    marketplaceName: "Restaurant / Hospitality Starter Kit",
    marketplaceSlug: "starter-kit-restaurant-hospitality",
    marketplaceDescription: "Create a stunning online presence for your restaurant or hospitality venue with menu showcases, reservation booking, event announcements, and beautiful galleries.",
    marketplaceLongDescription: "Crafted for restaurants, cafes, bistros, and hospitality venues that want to make a lasting impression online. This kit features an elegant homepage with reservation CTA, menu highlights organized by category, a visual gallery, hours and location information, guest testimonials, event announcements, and a reservation contact form. Built with warm, sophisticated tones of charcoal and gold that evoke an upscale dining atmosphere.",
    tags: ["site-kit", "starter", "restaurant", "hospitality"],
    assets: [
      {
        assetType: "theme_preset",
        assetRef: "theme-restaurant",
        label: "Restaurant Theme",
        sortOrder: 0,
        configJson: {
          light: {
            surface: "#fffdf9",
            text: "#1c1917",
            accent: "#b45309",
            accentForeground: "#ffffff",
            muted: "#f5f0eb",
            mutedForeground: "#78716c",
            border: "#e7e0d8",
          },
          dark: {
            surface: "#1c1917",
            text: "#faf5f0",
            accent: "#d4a574",
            accentForeground: "#1c1917",
            muted: "#292524",
            mutedForeground: "#a8a29e",
            border: "#44403c",
          },
          layout: {
            headerStyle: "transparent",
            footerStyle: "dark",
            containerMax: "1200px",
            sectionSpacing: "80px",
            buttonRadius: "4px",
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-home",
        label: "Home",
        sortOrder: 1,
        configJson: {
          title: "Home",
          slug: "home",
          seoTitle: "Home | Fine Dining & Hospitality",
          seoDescription: "Experience exceptional cuisine and warm hospitality. View our menu, make a reservation, and discover what makes our dining experience unforgettable.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "An Unforgettable Dining Experience",
                  subheading: "Crafted with locally sourced ingredients and served with warmth. Join us for breakfast, lunch, or dinner in a setting that feels like home.",
                  ctaLabel: "Make a Reservation",
                  ctaHref: "/contact",
                  secondaryCtaLabel: "View Our Menu",
                  secondaryCtaHref: "/menu",
                  alignment: "center",
                  minHeight: "large",
                },
              },
              {
                type: "MenuHighlights",
                props: {
                  title: "From Our Kitchen",
                  subtitle: "A selection of our most beloved dishes, crafted with seasonal ingredients.",
                  categories: [
                    {
                      name: "Starters",
                      items: [
                        { name: "Burrata & Heirloom Tomato", description: "Fresh burrata, vine-ripened heirloom tomatoes, basil oil, aged balsamic", price: "$16" },
                        { name: "Tuna Tartare", description: "Sushi-grade ahi tuna, avocado mousse, crispy wontons, sesame-ginger dressing", price: "$18" },
                        { name: "French Onion Soup", description: "Slow-caramelized onions, rich beef broth, gruyere crouton", price: "$14" },
                      ],
                    },
                    {
                      name: "Mains",
                      items: [
                        { name: "Pan-Seared Salmon", description: "Atlantic salmon, lemon-dill beurre blanc, roasted fingerlings, haricots verts", price: "$34" },
                        { name: "Filet Mignon", description: "8oz center-cut filet, truffle mashed potatoes, red wine reduction, asparagus", price: "$48" },
                        { name: "Wild Mushroom Risotto", description: "Arborio rice, mixed wild mushrooms, parmesan, truffle oil, micro greens", price: "$26" },
                      ],
                    },
                    {
                      name: "Desserts",
                      items: [
                        { name: "Creme Brulee", description: "Classic vanilla bean custard, caramelized sugar, fresh berries", price: "$12" },
                        { name: "Chocolate Fondant", description: "Warm dark chocolate cake, molten center, vanilla bean ice cream", price: "$14" },
                      ],
                    },
                  ],
                },
              },
              {
                type: "Gallery",
                props: {
                  heading: "Our Space",
                  layout: "grid",
                  columns: "3",
                  enableLightbox: true,
                  aspectRatio: "landscape",
                  images: [],
                },
              },
              {
                type: "Testimonials",
                props: {
                  heading: "Guest Reviews",
                  layout: "grid",
                  columns: "3",
                  showRating: true,
                  testimonials: [
                    { name: "Caroline P.", role: "Local Guide", quote: "The ambiance is magical, and the food is even better. The filet mignon was cooked to perfection. A new favorite.", rating: 5 },
                    { name: "Andrew S.", role: "Food Critic", quote: "A hidden gem with impeccable service and a menu that celebrates local ingredients beautifully.", rating: 5 },
                    { name: "Maria & Luis G.", role: "Anniversary Dinner", quote: "We celebrated our 10th anniversary here and it was absolutely perfect. Every detail was thoughtful.", rating: 5 },
                  ],
                },
              },
              {
                type: "Events",
                props: {
                  title: "Upcoming Events",
                  subtitle: "Join us for special evenings and seasonal celebrations.",
                  events: [
                    { title: "Wine Pairing Dinner", description: "A five-course tasting menu paired with selections from Napa Valley's finest vineyards.", date: "Every last Friday" },
                    { title: "Live Jazz Brunch", description: "Enjoy a leisurely weekend brunch accompanied by live jazz from local musicians.", date: "Sundays, 10am - 2pm" },
                    { title: "Chef's Table Experience", description: "An exclusive 8-course tasting menu served tableside by our executive chef. Limited to 12 guests.", date: "By reservation" },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Reserve Your Table",
                  description: "Whether it's an intimate dinner for two or a celebration with friends, we'd love to welcome you.",
                  ctaLabel: "Make a Reservation",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-about",
        label: "About",
        sortOrder: 2,
        configJson: {
          title: "About",
          slug: "about",
          seoTitle: "Our Story | Fine Dining & Hospitality",
          seoDescription: "Discover the passion behind our cuisine, our commitment to locally sourced ingredients, and the team that makes every dining experience special.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Our Story",
                  subheading: "What began as a passion for honest, seasonal cooking has grown into a beloved dining destination. Every dish tells a story of craftsmanship, community, and care.",
                  ctaLabel: "Meet the Chef",
                  ctaHref: "#team",
                  alignment: "center",
                  minHeight: "medium",
                },
              },
              {
                type: "FeatureList",
                props: {
                  title: "Our Philosophy",
                  items: [
                    { icon: "leaf", title: "Farm to Table", description: "We partner with local farms and producers to bring the freshest seasonal ingredients to your plate." },
                    { icon: "chef-hat", title: "Culinary Craft", description: "Our chefs combine classical technique with modern creativity to craft memorable dishes." },
                    { icon: "wine", title: "Curated Cellar", description: "Our sommelier hand-selects wines from around the world to complement every course." },
                    { icon: "heart", title: "Warm Hospitality", description: "From your first welcome to your last sip, we strive to make every guest feel like family." },
                  ],
                },
              },
              {
                type: "TeamGrid",
                props: {
                  title: "Meet the Team",
                  subtitle: "The talented people behind every memorable meal.",
                  members: [
                    { name: "Chef Antoine Moreau", title: "Executive Chef", bio: "Trained in Lyon, France. 15 years of culinary experience across Michelin-starred kitchens." },
                    { name: "Elena Vasquez", title: "Pastry Chef", bio: "Award-winning pastry artist known for her innovative desserts and artisan bread program." },
                    { name: "Thomas Wright", title: "General Manager", bio: "Hospitality veteran dedicated to creating seamless, memorable dining experiences." },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Experience the Difference",
                  description: "We'd love to welcome you to our table. Reserve your spot today.",
                  ctaLabel: "Make a Reservation",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-menu",
        label: "Menu",
        sortOrder: 3,
        configJson: {
          title: "Menu",
          slug: "menu",
          seoTitle: "Our Menu | Fine Dining & Hospitality",
          seoDescription: "Explore our seasonal menu featuring locally sourced ingredients, craft cocktails, and an award-winning wine list.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Our Menu",
                  subheading: "Seasonal dishes crafted with the finest local ingredients. Our menu changes with the seasons to bring you the best nature has to offer.",
                  alignment: "center",
                  minHeight: "small",
                },
              },
              {
                type: "MenuHighlights",
                props: {
                  title: "Starters",
                  categories: [
                    {
                      name: "Starters",
                      items: [
                        { name: "Burrata & Heirloom Tomato", description: "Fresh burrata, vine-ripened heirloom tomatoes, basil oil, aged balsamic", price: "$16" },
                        { name: "Tuna Tartare", description: "Sushi-grade ahi tuna, avocado mousse, crispy wontons, sesame-ginger dressing", price: "$18" },
                        { name: "French Onion Soup", description: "Slow-caramelized onions, rich beef broth, gruyere crouton", price: "$14" },
                        { name: "Roasted Beet Salad", description: "Golden and red beets, goat cheese, candied walnuts, arugula, honey vinaigrette", price: "$15" },
                      ],
                    },
                    {
                      name: "Mains",
                      items: [
                        { name: "Pan-Seared Salmon", description: "Atlantic salmon, lemon-dill beurre blanc, roasted fingerlings, haricots verts", price: "$34" },
                        { name: "Filet Mignon", description: "8oz center-cut filet, truffle mashed potatoes, red wine reduction, asparagus", price: "$48" },
                        { name: "Wild Mushroom Risotto", description: "Arborio rice, mixed wild mushrooms, parmesan, truffle oil, micro greens", price: "$26" },
                        { name: "Grilled Lamb Chops", description: "New Zealand rack, herb crust, ratatouille, rosemary jus", price: "$42" },
                        { name: "Lobster Linguine", description: "Fresh Maine lobster, cherry tomatoes, white wine, garlic, fresh herbs", price: "$38" },
                      ],
                    },
                    {
                      name: "Desserts",
                      items: [
                        { name: "Creme Brulee", description: "Classic vanilla bean custard, caramelized sugar, fresh berries", price: "$12" },
                        { name: "Chocolate Fondant", description: "Warm dark chocolate cake, molten center, vanilla bean ice cream", price: "$14" },
                        { name: "Lemon Tart", description: "Buttery shortcrust, silky lemon curd, Italian meringue, raspberry coulis", price: "$13" },
                      ],
                    },
                    {
                      name: "Drinks",
                      items: [
                        { name: "Craft Cocktails", description: "Seasonally inspired cocktails crafted by our mixologist", price: "$14-18" },
                        { name: "Wine by the Glass", description: "Curated selection of reds, whites, and roses from our cellar", price: "$12-22" },
                        { name: "Artisan Coffee & Tea", description: "Locally roasted espresso, pour-over, and premium loose leaf teas", price: "$5-8" },
                      ],
                    },
                  ],
                },
              },
              {
                type: "CTA",
                props: {
                  headline: "Ready to Dine With Us?",
                  description: "Reserve your table and let us prepare an unforgettable experience for you.",
                  ctaLabel: "Make a Reservation",
                  ctaHref: "/contact",
                  variant: "gradient",
                  alignment: "center",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "page_template",
        assetRef: "page-contact",
        label: "Contact",
        sortOrder: 4,
        configJson: {
          title: "Contact",
          slug: "contact",
          seoTitle: "Reservations & Contact | Fine Dining & Hospitality",
          seoDescription: "Make a reservation, plan a private event, or get in touch. We look forward to welcoming you.",
          contentJson: {
            root: { props: {} },
            content: [
              {
                type: "Hero",
                props: {
                  headline: "Make a Reservation",
                  subheading: "We'd love to welcome you. Fill out the form below or call us directly to reserve your table.",
                  alignment: "center",
                  minHeight: "small",
                },
              },
              {
                type: "ContactForm",
                props: {
                  title: "Reserve a Table",
                  subtitle: "Let us know when you'd like to visit and any special requests. We'll confirm your reservation within 2 hours.",
                  formRef: "contact-form",
                },
              },
              {
                type: "LocationMap",
                props: {
                  title: "Hours & Location",
                  description: "Monday - Thursday: 5:00 PM - 10:00 PM\nFriday - Saturday: 5:00 PM - 11:00 PM\nSunday Brunch: 10:00 AM - 2:00 PM\nSunday Dinner: 5:00 PM - 9:00 PM",
                },
              },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-hero",
        label: "Restaurant Hero",
        sortOrder: 10,
        configJson: {
          componentSlug: "hero",
          presetName: "Restaurant Hero",
          props: {
            headline: "An Unforgettable Dining Experience",
            subheading: "Crafted with locally sourced ingredients and served with warmth. Join us for an evening to remember.",
            ctaLabel: "Make a Reservation",
            ctaHref: "/contact",
            secondaryCtaLabel: "View Our Menu",
            secondaryCtaHref: "/menu",
            alignment: "center",
            minHeight: "large",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-menu-highlights",
        label: "Menu Highlights",
        sortOrder: 11,
        configJson: {
          componentSlug: "menu-highlights",
          presetName: "Menu Highlights",
          props: {
            title: "From Our Kitchen",
            subtitle: "A selection of our most beloved dishes.",
            categories: [
              {
                name: "Starters",
                items: [
                  { name: "Burrata & Heirloom Tomato", description: "Fresh burrata, basil oil, aged balsamic", price: "$16" },
                  { name: "Tuna Tartare", description: "Ahi tuna, avocado mousse, sesame-ginger dressing", price: "$18" },
                ],
              },
              {
                name: "Mains",
                items: [
                  { name: "Pan-Seared Salmon", description: "Lemon-dill beurre blanc, roasted fingerlings", price: "$34" },
                  { name: "Filet Mignon", description: "Truffle mashed potatoes, red wine reduction", price: "$48" },
                ],
              },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-gallery",
        label: "Restaurant Gallery",
        sortOrder: 12,
        configJson: {
          componentSlug: "gallery",
          presetName: "Restaurant Gallery",
          props: {
            heading: "Our Space",
            layout: "grid",
            columns: "3",
            enableLightbox: true,
            aspectRatio: "landscape",
            images: [],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-hours-location",
        label: "Hours & Location",
        sortOrder: 13,
        configJson: {
          componentSlug: "location-map",
          presetName: "Hours & Location",
          props: {
            title: "Hours & Location",
            description: "Monday - Thursday: 5:00 PM - 10:00 PM\nFriday - Saturday: 5:00 PM - 11:00 PM\nSunday Brunch: 10:00 AM - 2:00 PM\nSunday Dinner: 5:00 PM - 9:00 PM",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-testimonials",
        label: "Guest Reviews",
        sortOrder: 14,
        configJson: {
          componentSlug: "testimonials",
          presetName: "Restaurant Testimonials",
          props: {
            heading: "Guest Reviews",
            layout: "grid",
            columns: "3",
            showRating: true,
            testimonials: [
              { name: "Caroline P.", role: "Local Guide", quote: "The ambiance is magical, and the food is even better. A new favorite.", rating: 5 },
              { name: "Andrew S.", role: "Food Critic", quote: "A hidden gem with impeccable service and a menu that celebrates local ingredients.", rating: 5 },
              { name: "Maria & Luis G.", role: "Anniversary Dinner", quote: "We celebrated our anniversary here and it was absolutely perfect.", rating: 5 },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-events",
        label: "Events & Announcements",
        sortOrder: 15,
        configJson: {
          componentSlug: "events",
          presetName: "Restaurant Events",
          props: {
            title: "Upcoming Events",
            subtitle: "Join us for special evenings and seasonal celebrations.",
            events: [
              { title: "Wine Pairing Dinner", description: "Five-course tasting menu paired with Napa Valley wines.", date: "Every last Friday" },
              { title: "Live Jazz Brunch", description: "Weekend brunch accompanied by live jazz.", date: "Sundays, 10am - 2pm" },
              { title: "Chef's Table Experience", description: "Exclusive 8-course tasting menu. Limited to 12 guests.", date: "By reservation" },
            ],
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-cta",
        label: "Reservation CTA",
        sortOrder: 16,
        configJson: {
          componentSlug: "cta",
          presetName: "Order / Reserve",
          props: {
            headline: "Reserve Your Table",
            description: "Whether it's an intimate dinner or a celebration with friends, we'd love to welcome you.",
            ctaLabel: "Make a Reservation",
            ctaHref: "/contact",
            variant: "gradient",
            alignment: "center",
          },
        },
      },
      {
        assetType: "section_preset",
        assetRef: "section-contact-form",
        label: "Reservation Form",
        sortOrder: 17,
        configJson: {
          componentSlug: "contact-form",
          presetName: "Restaurant Contact Form",
          props: {
            title: "Reserve a Table",
            subtitle: "Let us know when you'd like to visit and any special requests.",
            formRef: "contact-form",
          },
        },
      },
      {
        assetType: "menu",
        assetRef: "menu-header",
        label: "Header Navigation",
        sortOrder: 20,
        configJson: {
          name: "Header Navigation",
          slot: "header",
          items: [
            { label: "Home", target: "/", type: "page", sortOrder: 0 },
            { label: "About", target: "/about", type: "page", sortOrder: 1 },
            { label: "Menu", target: "/menu", type: "page", sortOrder: 2 },
            { label: "Contact", target: "/contact", type: "page", sortOrder: 3 },
          ],
        },
      },
      {
        assetType: "menu",
        assetRef: "menu-footer",
        label: "Footer Navigation",
        sortOrder: 21,
        configJson: {
          name: "Footer Navigation",
          slot: "footer",
          items: [
            { label: "Contact", target: "/contact", type: "page", sortOrder: 0 },
            { label: "Privacy Policy", target: "/privacy", type: "page", sortOrder: 1 },
          ],
        },
      },
      {
        assetType: "form",
        assetRef: "form-contact",
        label: "Reservation Form",
        sortOrder: 25,
        configJson: {
          name: "Reservation Form",
          fields: [
            { id: "name", type: "text", label: "Full Name", required: true },
            { id: "email", type: "email", label: "Email Address", required: true },
            { id: "phone", type: "phone", label: "Phone Number", required: false },
            {
              id: "party_size",
              type: "select",
              label: "Party Size",
              required: false,
              options: ["1-2", "3-4", "5-6", "7+"],
            },
            { id: "date", type: "date", label: "Preferred Date", required: false },
            {
              id: "occasion",
              type: "select",
              label: "Occasion",
              required: false,
              options: ["Dinner", "Birthday", "Anniversary", "Business", "Other"],
            },
            { id: "message", type: "textarea", label: "Special Requests", required: false },
          ],
          settings: {
            submitLabel: "Reserve a Table",
            successMessage: "Thank you! We'll confirm your reservation within 2 hours.",
            honeypotEnabled: true,
            rateLimitPerMinute: 5,
          },
        },
      },
      {
        assetType: "seo_defaults",
        assetRef: "seo-defaults",
        label: "SEO Defaults",
        sortOrder: 30,
        configJson: {
          titleSuffix: "| Fine Dining & Hospitality",
          defaultIndexable: true,
          robotsTxt: "User-agent: *\nAllow: /\nSitemap: /sitemap.xml",
        },
      },
    ],
  });

  console.log("Starter kits seeding complete.");
}
