import { EditableHomepage } from "./components/EditableHomepage";
import { getHomepageContent } from "@/lib/homepage";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <EditableHomepage initialContent={await getHomepageContent()} />;
}
