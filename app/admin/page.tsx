import { AdminDashboard } from "./AdminDashboard";
import type { PostSection } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const params = await searchParams;
  const initialSection: PostSection =
    params.section === "work"
      ? "work"
      : params.section === "insights"
        ? "insights"
        : "writing";
  return <AdminDashboard initialSection={initialSection} />;
}
