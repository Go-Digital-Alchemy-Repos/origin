import { db } from "../../db";
import {
  workspaceOnboarding,
  sites,
  pages,
  forms,
  marketplaceInstalls,
  collections,
  memberships,
  siteDomains,
  entitlements,
  migrationJobs,
  collectionItems,
  pageRevisions,
} from "@shared/schema";
import type { WorkspaceOnboarding, OnboardingChecklist } from "@shared/schema";
import { eq, and, gt, isNotNull, count, sql } from "drizzle-orm";

export async function getOnboardingState(workspaceId: string): Promise<WorkspaceOnboarding | null> {
  const [row] = await db
    .select()
    .from(workspaceOnboarding)
    .where(eq(workspaceOnboarding.workspaceId, workspaceId));
  return row ?? null;
}

export async function ensureOnboardingState(workspaceId: string): Promise<WorkspaceOnboarding> {
  const existing = await getOnboardingState(workspaceId);
  if (existing) return existing;

  const [row] = await db
    .insert(workspaceOnboarding)
    .values({ workspaceId })
    .onConflictDoNothing()
    .returning();
  if (row) return row;

  const [fallback] = await db
    .select()
    .from(workspaceOnboarding)
    .where(eq(workspaceOnboarding.workspaceId, workspaceId));
  return fallback;
}

export async function advanceWizardStep(
  workspaceId: string,
  step: string,
  data?: { firstSiteId?: string },
): Promise<WorkspaceOnboarding> {
  await ensureOnboardingState(workspaceId);
  const updateValues: Record<string, unknown> = {
    wizardStep: step,
    updatedAt: new Date(),
  };
  if (data?.firstSiteId) {
    updateValues.firstSiteId = data.firstSiteId;
  }
  const [row] = await db
    .update(workspaceOnboarding)
    .set(updateValues)
    .where(eq(workspaceOnboarding.workspaceId, workspaceId))
    .returning();
  return row;
}

export async function completeWizard(workspaceId: string): Promise<WorkspaceOnboarding> {
  await ensureOnboardingState(workspaceId);
  const checklist = await recomputeChecklist(workspaceId);
  const [row] = await db
    .update(workspaceOnboarding)
    .set({
      wizardCompleted: true,
      wizardStep: "completed",
      checklistJson: checklist,
      firstPublishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workspaceOnboarding.workspaceId, workspaceId))
    .returning();
  return row;
}

export async function dismissChecklist(workspaceId: string): Promise<WorkspaceOnboarding> {
  const [row] = await db
    .update(workspaceOnboarding)
    .set({ dismissed: true, updatedAt: new Date() })
    .where(eq(workspaceOnboarding.workspaceId, workspaceId))
    .returning();
  return row;
}

export async function recomputeChecklist(workspaceId: string): Promise<OnboardingChecklist> {
  const state = await ensureOnboardingState(workspaceId);

  const [
    sitesList,
    formsList,
    installsList,
    collectionsList,
    membersList,
    domainsList,
    entitlementRow,
    migrationsList,
  ] = await Promise.all([
    db.select().from(sites).where(eq(sites.workspaceId, workspaceId)),
    db.select({ id: forms.id }).from(forms).where(eq(forms.workspaceId, workspaceId)).limit(1),
    db.select().from(marketplaceInstalls).where(and(eq(marketplaceInstalls.workspaceId, workspaceId), eq(marketplaceInstalls.enabled, true))),
    db.select({ id: collections.id }).from(collections).where(eq(collections.workspaceId, workspaceId)).limit(1),
    db.select({ id: memberships.id }).from(memberships).where(eq(memberships.workspaceId, workspaceId)),
    db.select().from(siteDomains).where(isNotNull(siteDomains.verifiedAt)).limit(1),
    db.select().from(entitlements).where(eq(entitlements.workspaceId, workspaceId)),
    db.select({ id: migrationJobs.id }).from(migrationJobs).where(eq(migrationJobs.workspaceId, workspaceId)).limit(1),
  ]);

  const hasSites = sitesList.length > 0;
  const firstSiteId = state.firstSiteId || (sitesList[0]?.id ?? null);

  let hasPublishedPage = false;
  let hasEditedPage = false;
  if (hasSites) {
    const siteIds = sitesList.map((s) => s.id);
    const publishedPages = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.workspaceId, workspaceId), eq(pages.status, "PUBLISHED")))
      .limit(1);
    hasPublishedPage = publishedPages.length > 0;

    const revisionsCount = await db
      .select({ cnt: count() })
      .from(pageRevisions)
      .innerJoin(pages, eq(pageRevisions.pageId, pages.id))
      .where(and(eq(pages.workspaceId, workspaceId), gt(pageRevisions.version, 1)));
    hasEditedPage = (revisionsCount[0]?.cnt ?? 0) > 0;
  }

  const hasSiteKit = installsList.some((i) => true);

  let hasBlogPost = false;
  if (collectionsList.length > 0) {
    const blogCollection = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.workspaceId, workspaceId), eq(collections.slug, "blog-posts")))
      .limit(1);
    if (blogCollection.length > 0) {
      const blogItems = await db
        .select({ id: collectionItems.id })
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, blogCollection[0].id))
        .limit(1);
      hasBlogPost = blogItems.length > 0;
    }
  }

  const ent = entitlementRow[0];
  const features = (ent?.features as string[]) ?? [];
  const hasCrm = features.includes("crm") || installsList.some((i: any) => i.slug === "crm-suite");

  const checklist: OnboardingChecklist = {
    created_first_site: hasSites,
    installed_site_kit: installsList.length > 0,
    edited_first_page: hasEditedPage,
    published_first_page: hasPublishedPage,
    connected_custom_domain: domainsList.length > 0,
    created_first_form: formsList.length > 0,
    created_first_collection: collectionsList.length > 0,
    created_first_blog_post: hasBlogPost,
    installed_marketplace_item: installsList.length > 0,
    invited_team_member: membersList.length > 1,
    enabled_crm: hasCrm,
    created_first_client_site: sitesList.length > 1,
    opened_platform_studio: false,
    started_wp_import: migrationsList.length > 0,
  };

  if (firstSiteId && firstSiteId !== state.firstSiteId) {
    await db
      .update(workspaceOnboarding)
      .set({ firstSiteId, checklistJson: checklist, updatedAt: new Date() })
      .where(eq(workspaceOnboarding.workspaceId, workspaceId));
  } else {
    await db
      .update(workspaceOnboarding)
      .set({ checklistJson: checklist, updatedAt: new Date() })
      .where(eq(workspaceOnboarding.workspaceId, workspaceId));
  }

  return checklist;
}
