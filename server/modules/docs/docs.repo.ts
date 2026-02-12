import { db } from "../../db";
import { docEntries } from "@shared/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import type { InsertDocEntry, DocEntry } from "@shared/schema";

class DocsRepo {
  async findAll() {
    return db.select().from(docEntries).orderBy(docEntries.sortOrder);
  }

  async findByType(type: string) {
    return db.select().from(docEntries).where(eq(docEntries.type, type)).orderBy(docEntries.sortOrder);
  }

  async findByCategory(category: string) {
    return db.select().from(docEntries).where(eq(docEntries.category, category)).orderBy(docEntries.sortOrder);
  }

  async findBySlug(slug: string) {
    const [doc] = await db.select().from(docEntries).where(eq(docEntries.slug, slug));
    return doc ?? null;
  }

  async findById(id: string) {
    const [doc] = await db.select().from(docEntries).where(eq(docEntries.id, id));
    return doc ?? null;
  }

  async search(query: string) {
    const pattern = `%${query}%`;
    return db
      .select()
      .from(docEntries)
      .where(
        or(
          ilike(docEntries.title, pattern),
          ilike(docEntries.content, pattern),
          ilike(docEntries.category, pattern)
        )
      )
      .orderBy(docEntries.sortOrder);
  }

  async findPublishedByType(type: string) {
    return db
      .select()
      .from(docEntries)
      .where(and(eq(docEntries.type, type), eq(docEntries.isPublished, true)))
      .orderBy(docEntries.sortOrder);
  }

  async create(data: InsertDocEntry) {
    const [doc] = await db.insert(docEntries).values(data).returning();
    return doc;
  }

  async update(id: string, data: Partial<InsertDocEntry>) {
    const [doc] = await db
      .update(docEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(docEntries.id, id))
      .returning();
    return doc ?? null;
  }

  async delete(id: string) {
    const [doc] = await db.delete(docEntries).where(eq(docEntries.id, id)).returning();
    return doc ?? null;
  }

  async count() {
    const result = await db.select().from(docEntries);
    return result.length;
  }
}

export const docsRepo = new DocsRepo();
