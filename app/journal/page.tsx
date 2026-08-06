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

export default async function JournalPage() {
  const isAdmin = await hasAdminPageSession();
  const posts = isAdmin
    ? await listAllPosts("writing")
    : await listPublicPosts("writing");

  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">My writing</p>
      <h1>Journal</h1>
      <p className="directory-intro">
        一些生活里看过、想过、做过，且想表达的东西。
      </p>
      <AdminEntryLink section="writing" label="Add entry" />

      {posts.length ? (
        <ul className="directory-list">
          <li>
            <Link href="/journal/example" className="inline-link">
              Entry page preview
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
      ) : (
        <ul className="directory-list">
          <li>
            <Link href="/journal/example" className="inline-link">
              Entry page preview
            </Link>
            <time dateTime="2026-07-23">Jul 23, 2026</time>
          </li>
        </ul>
      )}
    </section>
  );
}
