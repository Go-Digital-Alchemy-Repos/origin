import { db } from "../../db";
import { docEntries } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { InsertDocEntry } from "@shared/schema";

class DocsRepo {
  async findAll() {
    return db.select().from(docEntries).orderBy(docEntries.sortOrder);
  }

  async findBySlug(slug: string) {
    const [doc] = await db.select().from(docEntries).where(eq(docEntries.slug, slug));
    return doc ?? null;
  }

  async create(data: InsertDocEntry) {
    const [doc] = await db.insert(docEntries).values(data).returning();
    return doc;
  }

  async count() {
    const result = await db.select().from(docEntries);
    return result.length;
  }
}

export const docsRepo = new DocsRepo();
