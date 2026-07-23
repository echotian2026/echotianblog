import { EditableHomepage } from "./components/EditableHomepage";
import { getHomepageContent } from "@/lib/homepage";
import { listPublicPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [initialContent, publicPosts] = await Promise.all([
    getHomepageContent(),
    listPublicPosts(),
  ]);
  return (
    <EditableHomepage
      initialContent={initialContent}
      publicPostCount={publicPosts.length}
    />
  );
}
