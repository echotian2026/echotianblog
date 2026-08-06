import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, authToken } from "@/lib/admin-auth";

export async function hasAdminPageSession() {
  const expected = await authToken();
  const actual = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  return Boolean(expected && actual && expected === actual);
}
