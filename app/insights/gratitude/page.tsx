import type { Metadata } from "next";
import { EditableInsight } from "@/app/components/EditableInsight";
import { getHomepageContent } from "@/lib/homepage";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHomepageContent();
  return { title: content.gratitudeLabel };
}

export default async function GratitudePage() {
  const content = await getHomepageContent();

  return (
    <EditableInsight
      kind="gratitude"
      initialContent={content}
      publishedAt="2026-07-23T08:00:00.000Z"
      city="Shanghai"
    />
  );
}
