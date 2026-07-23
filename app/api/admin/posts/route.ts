import { isAdminRequest } from "@/lib/admin-auth";
import { createPost, listAllPosts } from "@/lib/posts";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  return Response.json({ posts: await listAllPosts() });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const payload = (await request.json()) as {
    title?: string;
    content?: string;
    publishedAt?: string;
    mood?: "sad" | "neutral" | "happy";
    isPrivate?: boolean;
  };
  const title = payload.title?.trim() ?? "";
  if (!title) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const post = await createPost({
    title,
    content: payload.content ?? "",
    publishedAt: payload.publishedAt || new Date().toISOString(),
    mood: payload.mood ?? "neutral",
    isPrivate: Boolean(payload.isPrivate),
  });
  return Response.json({ post }, { status: 201 });
}
