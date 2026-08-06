import Link from "next/link";
import { AdminEntryLink } from "@/app/components/AdminEntryLink";
import { hasAdminPageSession } from "@/lib/admin-page-auth";
import { listAllPosts, listPublicPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function InsightsPage() {
  const isAdmin = await hasAdminPageSession();
  const posts = isAdmin
    ? await listAllPosts("insights")
    : await listPublicPosts("insights");

  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">My writing</p>
      <h1>Insights</h1>
      <p className="directory-intro">那些值得反复提醒自己的事。</p>
      <AdminEntryLink section="insights" label="Add entry" />
      <ul className="directory-list">
        <li>
          <Link href="/insights/gratitude" className="inline-link">
            The things I’ve been grateful for
          </Link>
          <time dateTime="2026-07-23">Jul 23, 2026</time>
        </li>
        <li>
          <Link href="/insights/becoming" className="inline-link">
            成为自己想成为的人
          </Link>
          <time dateTime="2026-07-23">Jul 23, 2026</time>
        </li>
        {posts.map((post) => (
          <li key={post.id}>
            <span className="directory-entry-title">
              <Link href={`/posts/${post.slug}`} className="inline-link">
                {post.title}
              </Link>
              {post.isPrivate && <span className="directory-private-badge">🔒 Private</span>}
            </span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
