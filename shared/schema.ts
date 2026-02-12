import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const docEntries = pgTable("doc_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull().default("developer"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocEntrySchema = createInsertSchema(docEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocEntry = z.infer<typeof insertDocEntrySchema>;
export type DocEntry = typeof docEntries.$inferSelect;

export const originModules = pgTable("origin_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  version: text("version").notNull().default("1.0.0"),
  category: text("category").notNull(),
  icon: text("icon"),
  isCore: boolean("is_core").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModuleSchema = createInsertSchema(originModules).omit({
  id: true,
  createdAt: true,
});

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type OriginModule = typeof originModules.$inferSelect;

export const docCategoryEnum = z.enum([
  "getting-started",
  "architecture",
  "modules",
  "api-reference",
  "guides",
  "help",
]);

export type DocCategory = z.infer<typeof docCategoryEnum>;
