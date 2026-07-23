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
  gratitudeBody: string;
  introTwoMiddle: string;
  becomingLabel: string;
  becomingBody: string;
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
  gratitudeBody: `<p>我想提醒自己，感恩不是忽略那些真实存在的难过，也不是强迫自己在任何时候都保持积极。它更像是一种重新看见的能力：当生活变得拥挤、混乱，甚至让人怀疑自己时，仍然能找到一些没有离开的东西。</p>
<p>我感谢家人的爱，感谢被需要，也感谢有人愿意接住真实的我。感谢身体仍然带着我去看世界，感谢那些看似普通却安稳的日子，也感谢曾经跌倒的自己没有真的放弃。</p>
<p>有些时候，我会只看见没有做到的事，只记得自己的迟疑、失误和不够好。于是我要练习把注意力拉回来：记住已经拥有的，记住曾经得到的善意，也记住自己已经走过的路。</p>
<p>感恩不会替我解决问题，但它能让我重新获得一点力量。那一点力量足够让我从自我否定里站起来，再往前走一步。</p>`,
  introTwoMiddle:
    "。及时把自己从偶尔的崩溃和自我否定中拉出来；要勇敢，要行动，尽量发挥主观能动性，把控生活中可选部分的选择权，",
  becomingLabel: "成为自己想成为的人",
  becomingBody: `<p>成为自己想成为的人，不是某一天突然抵达一个完美的终点。它发生在很多很小的选择里：面对害怕时是否愿意行动，感到混乱时是否仍然诚实，以及能不能为真正重要的事情留下时间。</p>
<p>我想要的自由，并不是没有责任，也不是永远随心所欲。它是尽量保留对生活中可选部分的选择权，是知道自己为什么做一件事，也愿意承担选择带来的结果。</p>
<p>我希望自己持续成长，也持续建立内在安全感。少一些被外界评价牵着走，多一些对自己感受和判断的信任。崩溃和怀疑都可以发生，但它们不必替我做最终决定。</p>
<p>要勇敢，要行动。发挥主观能动性，不把人生完全交给惯性。成为自己想成为的人，就是一次又一次，选择更接近那个自己的方向。</p>`,
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
