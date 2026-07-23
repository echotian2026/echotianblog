import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { getPublicPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  return post ? { title: post.title } : { title: "Entry not found" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) notFound();

  return (
    <article className="article">
      <Link href="/" className="back-link">← All entries</Link>
      <header className="article-header">
        <p className="eyebrow">Journal entry</p>
        <h1>{post.title}</h1>
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </header>
      <div className="prose prose-purple dark:prose-invert">
        <Markdown>{post.content}</Markdown>
      </div>
    </article>
  );
}
