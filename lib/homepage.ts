import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabaseClient";

export type HomepageContent = {
  name: string;
  introLead: string;
  introTwoBefore: string;
  gratitudeLabel: string;
  introTwoMiddle: string;
  becomingLabel: string;
  introTwoAfter: string;
  family: string;
  writingHeading: string;
  journalLabel: string;
  insightsLabel: string;
  workHeading: string;
  skillsLabel: string;
  businessLabel: string;
  contactPrefix: string;
  xLabel: string;
  xUrl: string;
  email: string;
};

export const defaultHomepageContent: HomepageContent = {
  name: "Echo Tian",
  introLead:
    "hello，我是 Echo。这里放一些我在生活中看过、想过、做过，且想表达的东西，当作我来过这个世界的记录。",
  introTwoBefore:
    "我追求自由，希望自己持续成长，持续建立内在安全感，也希望 always remind myself of",
  gratitudeLabel: "the things I’ve been grateful for",
  introTwoMiddle:
    "。及时把自己从偶尔的崩溃和自我否定中拉出来；要勇敢，要行动，尽量发挥主观能动性，把控生活中可选部分的选择权，",
  becomingLabel: "成为自己想成为的人",
  introTwoAfter: "。",
  family: "除了我是我自己，我还是女儿、妻子和母亲。我爱我的家人。",
  writingHeading: "My writing",
  journalLabel: "Journal",
  insightsLabel: "Insights",
  workHeading: "My work",
  skillsLabel: "Skills",
  businessLabel: "Business",
  contactPrefix: "Reach out if interested —",
  xLabel: "@echo_tian",
  xUrl: "https://x.com/echo_tian",
  email: "echochangtian@163.com",
};

function normalizeHomepageContent(value: unknown): HomepageContent {
  if (!value || typeof value !== "object") return defaultHomepageContent;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(defaultHomepageContent).map(([key, fallback]) => [
      key,
      typeof record[key] === "string" ? record[key] : fallback,
    ])
  ) as HomepageContent;
}

export async function getHomepageContent() {
  if (!isSupabaseConfigured) return defaultHomepageContent;
  const { data, error } = await supabase
    .from("homepage_content")
    .select("content")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data?.content) return defaultHomepageContent;
  const value =
    typeof data.content === "string"
      ? JSON.parse(data.content)
      : data.content;
  return normalizeHomepageContent(value);
}

export async function updateHomepageContent(value: unknown) {
  const content = normalizeHomepageContent(value);
  const { error } = await getSupabaseAdmin()
    .from("homepage_content")
    .upsert({
      id: 1,
      content,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
  return content;
}
