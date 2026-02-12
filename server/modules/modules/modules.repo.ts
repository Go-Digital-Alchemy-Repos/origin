import { db } from "../../db";
import { originModules } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { InsertModule } from "@shared/schema";

class ModulesRepo {
  async findAll() {
    return db.select().from(originModules);
  }

  async findBySlug(slug: string) {
    const [mod] = await db.select().from(originModules).where(eq(originModules.slug, slug));
    return mod ?? null;
  }

  async create(data: InsertModule) {
    const [mod] = await db.insert(originModules).values(data).returning();
    return mod;
  }

  async count() {
    const result = await db.select().from(originModules);
    return result.length;
  }
}

export const modulesRepo = new ModulesRepo();
