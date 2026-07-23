import { env } from "cloudflare:workers";

export const ADMIN_COOKIE = "purple_journal_admin";

function configuredPassword() {
  const runtime = env as unknown as { ADMIN_PASSWORD?: string };
  return (
    runtime.ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV === "development" ? "journal-preview" : "")
  );
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const entry = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

export async function verifyPassword(value: string) {
  const expected = configuredPassword();
  if (!expected || value.length !== expected.length) return false;

  let mismatch = 0;
  for (let index = 0; index < value.length; index += 1) {
    mismatch |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function authToken() {
  const password = configuredPassword();
  return password ? digest(`purple-journal:${password}`) : "";
}

export async function isAdminRequest(request: Request) {
  const expected = await authToken();
  const actual = readCookie(request, ADMIN_COOKIE);
  return Boolean(expected && actual && expected === actual);
}
