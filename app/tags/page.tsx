import Link from "next/link";
import { getHomepageContent } from "@/lib/homepage";
import { listPublicPosts, normalizeTags } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tags",
};

export default async function TagsPage() {
  const [posts, homepage] = await Promise.all([
    listPublicPosts(),
    getHomepageContent(),
  ]);
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  for (const tag of normalizeTags(homepage.gratitudeTags)) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  for (const tag of normalizeTags(homepage.becomingTags)) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  const tags = [...counts.entries()].sort(
    ([tagA, countA], [tagB, countB]) =>
      countB - countA || tagA.localeCompare(tagB)
  );

  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">Browse by topic</p>
      <h1>Tags</h1>
      <p className="directory-intro">
        按照标签找到写过的生活、想法和经历。
      </p>
      {tags.length > 0 ? (
        <ul className="tag-cloud">
          {tags.map(([tag, count]) => (
            <li key={tag}>
              <Link href={`/tags/${encodeURIComponent(tag)}`}>
                <span>#{tag}</span>
                <small>{count}</small>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="directory-empty">
          Tags will appear here after you add them to an entry.
        </p>
      )}
    </section>
  );
}
