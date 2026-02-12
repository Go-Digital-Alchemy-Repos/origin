import { Router } from "express";
import { z } from "zod";
import OpenAI from "openai";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { buildWorkspaceContext } from "./context-builder";
import { promptTemplates, getTemplate, buildPrompt } from "./prompt-templates";

const contextRequestBody = z.object({
  templateId: z.string().optional().default("general-assistant"),
});

const chatRequestBody = z.object({
  message: z.string().min(1).max(4000),
  templateId: z.string().optional().default("general-assistant"),
});

export function aiCopilotRoutes(): Router {
  const router = Router();

  router.get("/templates", requireAuth(), (_req, res) => {
    const summaries = promptTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    }));
    res.json(summaries);
  });

  router.get("/context", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const ctx = await buildWorkspaceContext(workspaceId);
      res.json(ctx);
    } catch (err) {
      next(err);
    }
  });

  router.post("/context/preview", requireAuth(), requireWorkspaceContext(), validateBody(contextRequestBody), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const { templateId } = req.body;
      const template = getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: { message: "Template not found", code: "NOT_FOUND" } });
      }
      const ctx = await buildWorkspaceContext(workspaceId);
      const prompt = buildPrompt(template, ctx, "(preview — no user message)");
      res.json({
        templateId: template.id,
        templateName: template.name,
        systemMessage: prompt.systemMessage,
        contextSummary: {
          featureCount: ctx.workspace.features.length,
          installedAppCount: ctx.installedApps.length,
          siteCount: ctx.sites.length,
          totalPageCount: ctx.sites.reduce((sum, s) => sum + s.pageCount, 0),
          collectionCount: ctx.collections.length,
          menuCount: ctx.menus.length,
          capabilities: ctx.capabilities,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/chat", requireAuth(), requireWorkspaceContext(), validateBody(chatRequestBody), async (req, res, next) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: {
            message: "AI Copilot requires an OpenAI API key. Please configure OPENAI_API_KEY in your environment.",
            code: "AI_NOT_CONFIGURED",
          },
        });
      }

      const workspaceId = getWorkspaceId(req)!;
      const { message, templateId } = req.body;

      const template = getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: { message: "Template not found", code: "NOT_FOUND" } });
      }

      const ctx = await buildWorkspaceContext(workspaceId);
      const prompt = buildPrompt(template, ctx, message);

      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt.systemMessage },
          { role: "user", content: prompt.userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });

      const assistantMessage = completion.choices?.[0]?.message?.content ?? "No response generated.";

      res.json({
        message: assistantMessage,
        templateUsed: template.id,
        contextSummary: {
          capabilities: ctx.capabilities,
          siteCount: ctx.sites.length,
          installedAppCount: ctx.installedApps.length,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/suggest", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const ctx = await buildWorkspaceContext(workspaceId);
      const suggestions = generateSuggestions(ctx);
      res.json({ suggestions });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

interface Suggestion {
  type: string;
  title: string;
  description: string;
  action?: string;
}

function generateSuggestions(ctx: import("./context-builder").WorkspaceContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (ctx.capabilities.includes("crm")) {
    const hasFormPages = ctx.sites.some((s) =>
      s.pages.some((p) => (p.title ?? "").toLowerCase().includes("contact") || (p.slug ?? "").includes("contact")),
    );
    if (!hasFormPages) {
      suggestions.push({
        type: "lead-capture",
        title: "Add a contact form for lead capture",
        description:
          "Your CRM is active but no contact pages were found. Create a contact page with a lead capture form to start collecting leads.",
        action: "Create a new page with a form component",
      });
    }
    suggestions.push({
      type: "crm-workflow",
      title: "Set up lead nurturing workflow",
      description:
        "With CRM enabled, you can track leads through your sales pipeline. Consider adding status tracking and follow-up reminders.",
    });
  } else {
    suggestions.push({
      type: "upsell",
      title: "Enable CRM for lead management",
      description:
        "Install the CRM Suite from the Marketplace to track leads, manage contacts, and build customer relationships.",
      action: "Visit Marketplace to install CRM Suite",
    });
  }

  if (ctx.capabilities.includes("blog")) {
    const totalPages = ctx.sites.reduce((sum, s) => sum + s.pageCount, 0);
    if (totalPages > 0 && ctx.collections.length === 0) {
      suggestions.push({
        type: "content",
        title: "Start your blog",
        description:
          "You have pages but no blog posts yet. Start publishing blog content to drive organic traffic and establish authority.",
        action: "Set up your blog via the Blog wizard",
      });
    }
  }

  if (ctx.capabilities.includes("seo")) {
    const draftPages = ctx.sites.flatMap((s) => s.pages.filter((p) => p.status === "DRAFT"));
    if (draftPages.length > 0) {
      suggestions.push({
        type: "seo",
        title: `Publish ${draftPages.length} draft page(s)`,
        description:
          "You have draft pages that aren't visible to search engines. Review and publish them to improve your site's SEO coverage.",
      });
    }
  }

  if (ctx.menus.length === 0 && ctx.sites.length > 0) {
    suggestions.push({
      type: "navigation",
      title: "Set up site navigation",
      description:
        "No navigation menus are configured. Add a header and footer menu to help visitors find your content.",
      action: "Create navigation menus",
    });
  }

  if (ctx.sites.length === 0) {
    suggestions.push({
      type: "getting-started",
      title: "Create your first site",
      description:
        "Get started by creating a site. You can choose a Site Kit from the Marketplace for a head start.",
      action: "Create a new site",
    });
  }

  return suggestions;
}
