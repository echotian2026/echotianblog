import { ADMIN_COOKIE, authToken, isAdminRequest, verifyPassword } from "@/lib/admin-auth";

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdminRequest(request) });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { password?: string };
  if (!(await verifyPassword(payload.password ?? ""))) {
    return Response.json({ error: "That password isn’t right." }, { status: 401 });
  }

  const token = await authToken();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json(
    { authenticated: true },
    {
      headers: {
        "Set-Cookie": `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure}`,
      },
    }
  );
}

export async function DELETE() {
  return Response.json(
    { authenticated: false },
    {
      headers: {
        "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure`,
      },
    }
  );
}
