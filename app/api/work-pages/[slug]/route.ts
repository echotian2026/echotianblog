import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_SLUGS = new Set(["acquisition-cases"]);
const MAX_FIELDS = 500;
const MAX_FIELD_LENGTH = 5_000;

function invalidSlug(slug: string) {
  return !ALLOWED_SLUGS.has(slug);
}

function normalizeContent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid page content.");
  }

  const entries = Object.entries(value);
  if (entries.length > MAX_FIELDS) {
    throw new Error("Page content has too many editable fields.");
  }

  return Object.fromEntries(
    entries.map(([key, text]) => {
      if (
        !/^text-\d+$/.test(key) ||
        typeof text !== "string" ||
        text.length > MAX_FIELD_LENGTH
      ) {
        throw new Error("Invalid editable field.");
      }
      return [key, text];
    })
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  if (invalidSlug(slug)) {
    return Response.json({ error: "Page not found." }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("work_page_content")
    .select("content")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ content: data?.content ?? {} });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  if (invalidSlug(slug)) {
    return Response.json({ error: "Page not found." }, { status: 404 });
  }

  try {
    const payload = (await request.json()) as { content?: unknown };
    const content = normalizeContent(payload.content);
    const { error } = await getSupabaseAdmin()
      .from("work_page_content")
      .upsert(
        { slug, content, updated_at: new Date().toISOString() },
        { onConflict: "slug" }
      );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ content });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save this page.",
      },
      { status: 400 }
    );
  }
}
