import type { Metadata } from "next";
import Link from "next/link";
import { EntryFooter } from "@/app/components/JournalEntry";
import { ShareButton } from "@/app/components/ShareButton";

export const metadata: Metadata = {
  title: "The things I’ve been grateful for",
};

export default function GratitudePage() {
  return (
    <article className="essay">
      <div className="article-topbar">
        <Link href="/insights" className="back-link">← Insights</Link>
        <ShareButton title="The things I’ve been grateful for" />
      </div>
      <header>
        <p className="eyebrow">A note to myself</p>
        <h1>The things I’ve been grateful for</h1>
      </header>
      <div className="essay-body">
        <p>
          我想提醒自己，感恩不是忽略那些真实存在的难过，也不是强迫自己在任何时候都保持积极。
          它更像是一种重新看见的能力：当生活变得拥挤、混乱，甚至让人怀疑自己时，仍然能找到一些
          没有离开的东西。
        </p>
        <p>
          我感谢家人的爱，感谢被需要，也感谢有人愿意接住真实的我。感谢身体仍然带着我去看世界，
          感谢那些看似普通却安稳的日子，也感谢曾经跌倒的自己没有真的放弃。
        </p>
        <p>
          有些时候，我会只看见没有做到的事，只记得自己的迟疑、失误和不够好。于是我要练习把注意力
          拉回来：记住已经拥有的，记住曾经得到的善意，也记住自己已经走过的路。
        </p>
        <p>
          感恩不会替我解决问题，但它能让我重新获得一点力量。那一点力量足够让我从自我否定里站起来，
          再往前走一步。
        </p>
      </div>
      <EntryFooter
        publishedAt="2026-07-23T08:00:00.000Z"
        city="Shanghai"
      />
    </article>
  );
}
