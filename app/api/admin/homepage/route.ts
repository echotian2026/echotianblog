import { isAdminRequest } from "@/lib/admin-auth";
import {
  getHomepageContent,
  updateHomepageContent,
} from "@/lib/homepage";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  return Response.json({ content: await getHomepageContent() });
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const payload = (await request.json()) as { content?: unknown };
  return Response.json({
    content: await updateHomepageContent(payload.content),
  });
}
