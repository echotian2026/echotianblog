import Link from "next/link";
import { listPublicPosts } from "@/lib/posts";

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
  const posts = await listPublicPosts();

  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">My writing</p>
      <h1>Journal</h1>
      <p className="directory-intro">
        一些生活里看过、想过、做过，且想表达的东西。
      </p>

      {posts.length ? (
        <ul className="directory-list">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.slug}`} className="inline-link">
                {post.title}
              </Link>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="directory-empty">第一篇还在路上。</p>
      )}
    </section>
  );
}
