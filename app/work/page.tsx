import Link from "next/link";
import { AdminEntryLink } from "@/app/components/AdminEntryLink";
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

export default async function WorkPage() {
  const posts = await listPublicPosts("work");

  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">My work</p>
      <h1>Work</h1>
      <p className="directory-intro">
        Projects, business experiments, and things I am building.
      </p>
      <AdminEntryLink section="work" label="Add entry" />

      <ul className="directory-list">
        <li>
          <Link href="/work/acquisition-cases.html" className="inline-link">
            获客项目案例集
          </Link>
          <span className="directory-item-note">Case study</span>
        </li>
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
    </section>
  );
}
