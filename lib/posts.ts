import { and, desc, eq } from "drizzle-orm";
import { getD1, getDb } from "@/db";
import { posts } from "@/db/schema";

export type JournalPost = typeof posts.$inferSelect;
export type PostInput = {
  title: string;
  slug?: string;
  content: string;
  publishedAt: string;
  mood: "sad" | "neutral" | "happy";
  isPrivate: boolean;
};

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  if (!schemaReady) {
    const d1 = getD1();
    schemaReady = (async () => {
      await d1.batch([
        d1.prepare(`
          CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            published_at TEXT NOT NULL,
            mood TEXT NOT NULL DEFAULT 'neutral',
            is_private INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),
        d1.prepare(
          "CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC)"
        ),
      ]);

      const columns = await d1.prepare("PRAGMA table_info(posts)").all<{
        name: string;
      }>();
      if (!columns.results.some((column) => column.name === "mood")) {
        await d1
          .prepare("ALTER TABLE posts ADD COLUMN mood TEXT NOT NULL DEFAULT 'neutral'")
          .run();
      }
    })();
  }
  return schemaReady;
}

export function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `entry-${Date.now()}`;
}

export async function listPublicPosts() {
  await ensureSchema();
  return getDb()
    .select()
    .from(posts)
    .where(eq(posts.isPrivate, false))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
}

export async function listAllPosts() {
  await ensureSchema();
  return getDb()
    .select()
    .from(posts)
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
}

export async function getPublicPost(slug: string) {
  await ensureSchema();
  const [post] = await getDb()
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.isPrivate, false)))
    .limit(1);
  return post ?? null;
}

async function uniqueSlug(title: string, requested?: string, ignoreId?: string) {
  const base = slugify(requested || title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [match] = await getDb()
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, candidate))
      .limit(1);
    if (!match || match.id === ignoreId) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function createPost(input: PostInput) {
  await ensureSchema();
  const slug = await uniqueSlug(input.title, input.slug);
  const [post] = await getDb()
    .insert(posts)
    .values({
      id: crypto.randomUUID(),
      slug,
      title: input.title,
      content: input.content,
      publishedAt: input.publishedAt,
      mood: input.mood,
      isPrivate: input.isPrivate,
    })
    .returning();
  return post;
}

export async function updatePost(id: string, input: Partial<PostInput>) {
  await ensureSchema();
  const [existing] = await getDb()
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (!existing) return null;

  const slug =
    input.title || input.slug
      ? await uniqueSlug(
          input.title ?? existing.title,
          input.slug ?? existing.slug,
          id
        )
      : existing.slug;

  const [post] = await getDb()
    .update(posts)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt }
        : {}),
      ...(input.mood !== undefined ? { mood: input.mood } : {}),
      ...(input.isPrivate !== undefined
        ? { isPrivate: input.isPrivate }
        : {}),
      slug,
    })
    .where(eq(posts.id, id))
    .returning();
  return post ?? null;
}

export async function deletePost(id: string) {
  await ensureSchema();
  const deleted = await getDb()
    .delete(posts)
    .where(eq(posts.id, id))
    .returning({ id: posts.id });
  return deleted.length > 0;
}
