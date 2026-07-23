import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHomepageContent } from "@/lib/homepage";
import { listPublicPostsByTag, normalizeTags } from "@/lib/posts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tag: string }> };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const normalized = normalizeTags([tag])[0];
  return { title: normalized ? `#${normalized}` : "Tag not found" };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const normalized = normalizeTags([tag])[0];
  if (!normalized) notFound();

  const [posts, homepage] = await Promise.all([
    listPublicPostsByTag(normalized),
    getHomepageContent(),
  ]);
  const fixedEntries = [
    {
      href: "/insights/gratitude",
      title: homepage.gratitudeLabel,
      tags: normalizeTags(homepage.gratitudeTags),
    },
    {
      href: "/insights/becoming",
      title: homepage.becomingLabel,
      tags: normalizeTags(homepage.becomingTags),
    },
  ].filter((entry) => entry.tags.includes(normalized));

  return (
    <section className="directory-page">
      <Link href="/tags" className="back-link">← All tags</Link>
      <p className="eyebrow">Browse by topic</p>
      <h1>#{normalized}</h1>
      <p className="directory-intro">
        {posts.length + fixedEntries.length}{" "}
        {posts.length + fixedEntries.length === 1 ? "entry" : "entries"}
      </p>
      {posts.length + fixedEntries.length > 0 ? (
        <ul className="directory-list">
          {fixedEntries.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href} className="inline-link">
                {entry.title}
              </Link>
              <time dateTime="2026-07-23">Jul 23, 2026</time>
            </li>
          ))}
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.slug}`} className="inline-link">
                {post.title}
              </Link>
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="directory-empty">No public entries use this tag yet.</p>
      )}
    </section>
  );
}
