import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { getPublicPost } from "@/lib/posts";
import { JournalEntry } from "@/app/components/JournalEntry";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  return post ? { title: post.title } : { title: "Entry not found" };
}

const journalSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "mark"],
  attributes: {
    ...defaultSchema.attributes,
    mark: ["dataColor"],
  },
};

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) notFound();

  return (
    <JournalEntry
      title={post.title}
      publishedAt={post.publishedAt}
      mood={post.mood}
      city={post.city}
    >
      <Markdown
        rehypePlugins={[rehypeRaw, [rehypeSanitize, journalSchema]]}
        components={{
          a({ href, children, ...props }) {
            const label = String(children);
            if (href && label.startsWith("audio:")) {
              return (
                <figure className="audio-attachment">
                  <audio controls preload="metadata" src={href}>
                    Your browser does not support audio playback.
                  </audio>
                  <figcaption>{label.replace(/^audio:/, "")}</figcaption>
                </figure>
              );
            }
            return <a href={href} {...props}>{children}</a>;
          },
        }}
      >
        {post.content}
      </Markdown>
    </JournalEntry>
  );
}
