import { db } from "../../db";
import { collections, collectionItems, collectionItemRevisions, pages, pageRevisions, sites } from "@shared/schema";
import type { Collection, CollectionItem, CollectionItemRevision } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const BLOG_COLLECTION_SLUG = "blog-posts";

export const BLOG_POST_SCHEMA = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", required: true },
  { key: "excerpt", label: "Excerpt", type: "textarea", required: false, description: "Short summary for blog listing and SEO description" },
  { key: "body", label: "Body", type: "richtext", required: true, description: "Main article content" },
  { key: "featured_image", label: "Featured Image", type: "image", required: false, description: "Hero image URL for the post" },
  { key: "author", label: "Author", type: "text", required: false },
  { key: "category", label: "Category", type: "select", required: false, options: ["General", "News", "Tutorial", "Case Study", "Announcement"] },
  { key: "tags", label: "Tags", type: "text", required: false, description: "Comma-separated tags" },
  { key: "published_date", label: "Published Date", type: "date", required: false },
  { key: "seo_title", label: "SEO Title", type: "text", required: false, description: "Override title for search engines" },
  { key: "seo_description", label: "SEO Description", type: "textarea", required: false, description: "Meta description for search results" },
  { key: "og_image", label: "OG Image", type: "image", required: false, description: "Social sharing image override" },
];

export interface PublishedBlogPost {
  id: string;
  itemId: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string;
  publishedDate: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  updatedAt: Date | null;
}

function extractPostData(dataJson: any): Omit<PublishedBlogPost, "id" | "itemId" | "updatedAt"> {
  return {
    title: dataJson?.title || "Untitled",
    slug: dataJson?.slug || "",
    excerpt: dataJson?.excerpt || "",
    body: dataJson?.body || "",
    featuredImage: dataJson?.featured_image || "",
    author: dataJson?.author || "",
    category: dataJson?.category || "",
    tags: dataJson?.tags || "",
    publishedDate: dataJson?.published_date || "",
    seoTitle: dataJson?.seo_title || "",
    seoDescription: dataJson?.seo_description || "",
    ogImage: dataJson?.og_image || "",
  };
}

export const blogService = {
  async verifySiteOwnership(siteId: string, workspaceId: string): Promise<boolean> {
    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.workspaceId, workspaceId)))
      .limit(1);
    return !!site;
  },

  async findBlogCollection(siteId: string): Promise<Collection | null> {
    const [col] = await db
      .select()
      .from(collections)
      .where(and(eq(collections.siteId, siteId), eq(collections.slug, BLOG_COLLECTION_SLUG)))
      .limit(1);
    return col ?? null;
  },

  async setupBlog(siteId: string, workspaceId: string, userId: string): Promise<{ collection: Collection; page: { id: string } }> {
    const existing = await blogService.findBlogCollection(siteId);
    if (existing) {
      throw new Error("Blog collection already exists for this site");
    }

    const [collection] = await db
      .insert(collections)
      .values({
        name: "Blog Posts",
        slug: BLOG_COLLECTION_SLUG,
        description: "Blog posts for your site. Each item represents one article.",
        schemaJson: BLOG_POST_SCHEMA,
        siteId,
        workspaceId,
      })
      .returning();

    const blogPageContent = {
      schemaVersion: 1,
      data: {
        content: [
          {
            type: "hero",
            props: {
              headline: "Blog",
              subheading: "Latest articles, news, and insights",
              alignment: "center",
              minHeight: "small",
            },
          },
        ],
        root: {},
      },
    };

    const existingPage = await db
      .select()
      .from(pages)
      .where(and(eq(pages.siteId, siteId), eq(pages.slug, "blog")))
      .limit(1);

    let pageId: string;
    if (existingPage.length > 0) {
      pageId = existingPage[0].id;
    } else {
      const [page] = await db
        .insert(pages)
        .values({
          title: "Blog",
          slug: "blog",
          siteId,
          workspaceId,
          status: "PUBLISHED",
          publishedAt: new Date(),
          seoTitle: "Blog",
          seoDescription: "Read our latest articles and insights.",
        })
        .returning();
      pageId = page.id;

      const version = 1;
      await db.insert(pageRevisions).values({
        pageId,
        version,
        contentJson: blogPageContent,
        createdByUserId: userId,
        note: "Blog page created by wizard",
      });
    }

    return { collection, page: { id: pageId } };
  },

  async getPublishedPosts(siteId: string): Promise<PublishedBlogPost[]> {
    const col = await blogService.findBlogCollection(siteId);
    if (!col) return [];

    const items = await db
      .select()
      .from(collectionItems)
      .where(and(eq(collectionItems.collectionId, col.id), eq(collectionItems.status, "PUBLISHED")))
      .orderBy(desc(collectionItems.updatedAt));

    const posts: PublishedBlogPost[] = [];
    for (const item of items) {
      const [rev] = await db
        .select()
        .from(collectionItemRevisions)
        .where(eq(collectionItemRevisions.itemId, item.id))
        .orderBy(desc(collectionItemRevisions.version))
        .limit(1);

      if (rev) {
        const data = extractPostData(rev.dataJson);
        if (data.slug) {
          posts.push({
            id: rev.id,
            itemId: item.id,
            ...data,
            updatedAt: item.updatedAt,
          });
        }
      }
    }

    posts.sort((a, b) => {
      const da = a.publishedDate || a.updatedAt?.toISOString() || "";
      const db2 = b.publishedDate || b.updatedAt?.toISOString() || "";
      return db2.localeCompare(da);
    });

    return posts;
  },

  async getPublishedPost(siteId: string, postSlug: string): Promise<PublishedBlogPost | null> {
    const col = await blogService.findBlogCollection(siteId);
    if (!col) return null;

    const items = await db
      .select()
      .from(collectionItems)
      .where(and(eq(collectionItems.collectionId, col.id), eq(collectionItems.status, "PUBLISHED")));

    for (const item of items) {
      const [rev] = await db
        .select()
        .from(collectionItemRevisions)
        .where(eq(collectionItemRevisions.itemId, item.id))
        .orderBy(desc(collectionItemRevisions.version))
        .limit(1);

      if (rev) {
        const data = extractPostData(rev.dataJson);
        if (data.slug === postSlug) {
          return {
            id: rev.id,
            itemId: item.id,
            ...data,
            updatedAt: item.updatedAt,
          };
        }
      }
    }

    return null;
  },

  async getBlogStatus(siteId: string): Promise<{
    exists: boolean;
    collectionId?: string;
    totalPosts: number;
    publishedPosts: number;
  }> {
    const col = await blogService.findBlogCollection(siteId);
    if (!col) {
      return { exists: false, totalPosts: 0, publishedPosts: 0 };
    }

    const [counts] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        published: sql<number>`COUNT(*) FILTER (WHERE ${collectionItems.status} = 'PUBLISHED')`,
      })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, col.id));

    return {
      exists: true,
      collectionId: col.id,
      totalPosts: Number(counts?.total ?? 0),
      publishedPosts: Number(counts?.published ?? 0),
    };
  },
};
