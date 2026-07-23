import Link from "next/link";
import { listPublicPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function Home() {
  const posts = await listPublicPosts();

  return (
    <>
      <section className="intro">
        <p className="eyebrow">Notes & reflections</p>
        <h1>Small observations,<br />kept with intention.</h1>
        <p className="intro-copy">
          A personal record of ideas, lessons, and moments I want to remember.
        </p>
      </section>

      <section aria-labelledby="entries-heading" className="entries-section">
        <div className="section-heading">
          <h2 id="entries-heading">Journal</h2>
          <span>{posts.length} {posts.length === 1 ? "entry" : "entries"}</span>
        </div>

        {posts.length ? (
          <ul className="post-list">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/posts/${post.slug}`} className="post-row">
                  <span>{post.title}</span>
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <span className="empty-mark">✦</span>
            <h3>The first page is waiting.</h3>
            <p>Public entries will appear here when they’re ready to share.</p>
          </div>
        )}
      </section>
    </>
  );
}
