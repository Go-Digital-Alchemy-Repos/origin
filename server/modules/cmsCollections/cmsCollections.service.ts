import { db } from "../../db";
import { collections, collectionItems, collectionItemRevisions } from "@shared/schema";
import type {
  Collection,
  CollectionItem,
  CollectionItemRevision,
} from "@shared/schema";
import { eq, and, desc, ilike, sql, inArray } from "drizzle-orm";

const MAX_REVISIONS = 10;

async function getNextItemVersion(itemId: string): Promise<number> {
  const [result] = await db
    .select({ maxVersion: sql<number>`COALESCE(MAX(${collectionItemRevisions.version}), 0)` })
    .from(collectionItemRevisions)
    .where(eq(collectionItemRevisions.itemId, itemId));
  return (result?.maxVersion ?? 0) + 1;
}

async function pruneItemRevisions(itemId: string): Promise<void> {
  const revs = await db
    .select({ id: collectionItemRevisions.id })
    .from(collectionItemRevisions)
    .where(eq(collectionItemRevisions.itemId, itemId))
    .orderBy(desc(collectionItemRevisions.version));

  if (revs.length > MAX_REVISIONS) {
    const idsToDelete = revs.slice(MAX_REVISIONS).map((r) => r.id);
    await db.delete(collectionItemRevisions).where(inArray(collectionItemRevisions.id, idsToDelete));
  }
}

async function createItemRevision(
  itemId: string,
  dataJson: unknown,
  userId: string | null,
  note?: string,
): Promise<CollectionItemRevision> {
  const version = await getNextItemVersion(itemId);
  const [rev] = await db
    .insert(collectionItemRevisions)
    .values({
      itemId,
      version,
      dataJson: dataJson ?? {},
      createdByUserId: userId,
      note: note ?? null,
    })
    .returning();
  await pruneItemRevisions(itemId);
  return rev;
}

export const cmsCollectionsService = {
  async getCollectionsBySite(
    siteId: string,
    workspaceId: string,
    opts?: { search?: string },
  ): Promise<Collection[]> {
    const conditions = [eq(collections.siteId, siteId), eq(collections.workspaceId, workspaceId)];
    if (opts?.search) conditions.push(ilike(collections.name, `%${opts.search}%`));
    return db
      .select()
      .from(collections)
      .where(and(...conditions))
      .orderBy(desc(collections.updatedAt));
  },

  async getCollection(collectionId: string): Promise<Collection | undefined> {
    const [col] = await db.select().from(collections).where(eq(collections.id, collectionId));
    return col ?? undefined;
  },

  async getCollectionForWorkspace(collectionId: string, workspaceId: string): Promise<Collection | undefined> {
    const [col] = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.workspaceId, workspaceId)));
    return col ?? undefined;
  },

  async createCollection(data: {
    name: string;
    slug: string;
    description?: string;
    schemaJson?: unknown[];
    siteId: string;
    workspaceId: string;
  }): Promise<Collection> {
    const [col] = await db
      .insert(collections)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        schemaJson: data.schemaJson ?? [],
        siteId: data.siteId,
        workspaceId: data.workspaceId,
      })
      .returning();
    return col;
  },

  async updateCollection(
    collectionId: string,
    data: { name?: string; slug?: string; description?: string; schemaJson?: unknown[] },
  ): Promise<Collection> {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.slug !== undefined) updateFields.slug = data.slug;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.schemaJson !== undefined) updateFields.schemaJson = data.schemaJson;

    const [col] = await db.update(collections).set(updateFields).where(eq(collections.id, collectionId)).returning();
    return col;
  },

  async deleteCollection(collectionId: string): Promise<void> {
    await db.delete(collections).where(eq(collections.id, collectionId));
  },

  async getItems(
    collectionId: string,
    opts?: { status?: string },
  ): Promise<(CollectionItem & { latestRevision?: CollectionItemRevision })[]> {
    const conditions = [eq(collectionItems.collectionId, collectionId)];
    if (opts?.status) conditions.push(eq(collectionItems.status, opts.status));

    const items = await db
      .select()
      .from(collectionItems)
      .where(and(...conditions))
      .orderBy(desc(collectionItems.updatedAt));

    const withRevisions = await Promise.all(
      items.map(async (item) => {
        const latestRevision = await cmsCollectionsService.getLatestItemRevision(item.id);
        return { ...item, latestRevision };
      }),
    );
    return withRevisions;
  },

  async getItem(itemId: string): Promise<CollectionItem | undefined> {
    const [item] = await db.select().from(collectionItems).where(eq(collectionItems.id, itemId));
    return item ?? undefined;
  },

  async getItemForCollection(itemId: string, collectionId: string): Promise<CollectionItem | undefined> {
    const [item] = await db
      .select()
      .from(collectionItems)
      .where(and(eq(collectionItems.id, itemId), eq(collectionItems.collectionId, collectionId)));
    return item ?? undefined;
  },

  async createItem(
    collectionId: string,
    userId: string,
    dataJson?: unknown,
  ): Promise<{ item: CollectionItem; revision: CollectionItemRevision }> {
    const [item] = await db
      .insert(collectionItems)
      .values({ collectionId, status: "DRAFT" })
      .returning();

    const revision = await createItemRevision(item.id, dataJson ?? {}, userId, "Initial creation");
    return { item, revision };
  },

  async updateItem(
    itemId: string,
    dataJson: unknown,
    userId: string,
    note?: string,
  ): Promise<{ item: CollectionItem; revision: CollectionItemRevision }> {
    const [item] = await db
      .update(collectionItems)
      .set({ updatedAt: new Date() })
      .where(eq(collectionItems.id, itemId))
      .returning();

    const revision = await createItemRevision(itemId, dataJson ?? {}, userId, note ?? "Draft save");
    return { item, revision };
  },

  async publishItem(
    itemId: string,
    userId: string,
    dataJson?: unknown,
  ): Promise<{ item: CollectionItem; revision: CollectionItemRevision }> {
    const latestData = dataJson ?? (await cmsCollectionsService.getLatestItemRevision(itemId))?.dataJson ?? {};

    const [item] = await db
      .update(collectionItems)
      .set({ status: "PUBLISHED", updatedAt: new Date() })
      .where(eq(collectionItems.id, itemId))
      .returning();

    const revision = await createItemRevision(itemId, latestData, userId, "Published");
    return { item, revision };
  },

  async rollbackItem(
    itemId: string,
    revisionId: string,
    userId: string,
  ): Promise<{ item: CollectionItem; revision: CollectionItemRevision }> {
    const [sourceRev] = await db
      .select()
      .from(collectionItemRevisions)
      .where(and(eq(collectionItemRevisions.id, revisionId), eq(collectionItemRevisions.itemId, itemId)));

    if (!sourceRev) throw new Error("Revision not found");

    const [item] = await db
      .update(collectionItems)
      .set({ updatedAt: new Date() })
      .where(eq(collectionItems.id, itemId))
      .returning();

    const revision = await createItemRevision(
      itemId,
      sourceRev.dataJson,
      userId,
      `Rollback to v${sourceRev.version}`,
    );

    return { item, revision };
  },

  async getItemRevisions(itemId: string): Promise<CollectionItemRevision[]> {
    return db
      .select()
      .from(collectionItemRevisions)
      .where(eq(collectionItemRevisions.itemId, itemId))
      .orderBy(desc(collectionItemRevisions.version));
  },

  async getLatestItemRevision(itemId: string): Promise<CollectionItemRevision | undefined> {
    const [rev] = await db
      .select()
      .from(collectionItemRevisions)
      .where(eq(collectionItemRevisions.itemId, itemId))
      .orderBy(desc(collectionItemRevisions.version))
      .limit(1);
    return rev ?? undefined;
  },

  async deleteItem(itemId: string): Promise<void> {
    await db.delete(collectionItems).where(eq(collectionItems.id, itemId));
  },
};
