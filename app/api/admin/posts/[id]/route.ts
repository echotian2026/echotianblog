import { isAdminRequest } from "@/lib/admin-auth";
import { deletePost, updatePost } from "@/lib/posts";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const { id } = await params;
  const payload = (await request.json()) as {
    title?: string;
    content?: string;
    publishedAt?: string;
    isPrivate?: boolean;
  };
  const post = await updatePost(id, payload);
  return post
    ? Response.json({ post })
    : Response.json({ error: "Post not found." }, { status: 404 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const { id } = await params;
  return (await deletePost(id))
    ? Response.json({ deleted: true })
    : Response.json({ error: "Post not found." }, { status: 404 });
}
