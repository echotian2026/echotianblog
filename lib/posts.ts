import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabaseClient";

type Mood = "sad" | "neutral" | "happy";
export type PostSection = "writing" | "insights" | "work";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  content: string;
  published_at: string;
  mood: Mood;
  section: PostSection;
  city: string;
  is_private: boolean;
  created_at: string;
};

export type JournalPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  publishedAt: string;
  mood: Mood;
  section: PostSection;
  city: string;
  isPrivate: boolean;
  createdAt: string;
};

export type PostInput = {
  title: string;
  slug?: string;
  content: string;
  publishedAt: string;
  mood: Mood;
  section: PostSection;
  city: string;
  isPrivate: boolean;
};

function fromRow(row: PostRow): JournalPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    publishedAt: row.published_at,
    mood: row.mood,
    section: row.section ?? "writing",
    city: row.city,
    isPrivate: row.is_private,
    createdAt: row.created_at,
  };
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

export async function listPublicPosts(section?: PostSection) {
  if (!isSupabaseConfigured) return [];
  let query = supabase
    .from("posts")
    .select("*")
    .eq("is_private", false)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (section) query = query.eq("section", section);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(fromRow);
}

export async function listAllPosts() {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(fromRow);
}

export async function getPublicPost(slug: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_private", false)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as PostRow) : null;
}

async function uniqueSlug(title: string, requested?: string, ignoreId?: string) {
  const admin = getSupabaseAdmin();
  const base = slugify(requested || title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await admin
      .from("posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || data.id === ignoreId) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function createPost(input: PostInput) {
  const slug = await uniqueSlug(input.title, input.slug);
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .insert({
      slug,
      title: input.title,
      content: input.content,
      published_at: input.publishedAt,
      mood: input.mood,
      section: input.section,
      city: input.city,
      is_private: input.isPrivate,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as PostRow);
}

export async function updatePost(id: string, input: Partial<PostInput>) {
  const admin = getSupabaseAdmin();
  const { data: existing, error: existingError } = await admin
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (!existing) return null;

  const current = existing as PostRow;
  const slug =
    input.title || input.slug
      ? await uniqueSlug(
          input.title ?? current.title,
          input.slug ?? current.slug,
          id
        )
      : current.slug;

  const { data, error } = await admin
    .from("posts")
    .update({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.publishedAt !== undefined
        ? { published_at: input.publishedAt }
        : {}),
      ...(input.mood !== undefined ? { mood: input.mood } : {}),
      ...(input.section !== undefined ? { section: input.section } : {}),
      ...(input.isPrivate !== undefined
        ? { is_private: input.isPrivate }
        : {}),
      slug,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as PostRow);
}

export async function deletePost(id: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}
