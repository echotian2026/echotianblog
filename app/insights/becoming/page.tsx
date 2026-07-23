import type { Metadata } from "next";
import Link from "next/link";
import { EntryFooter } from "@/app/components/JournalEntry";
import { ShareButton } from "@/app/components/ShareButton";

export const metadata: Metadata = {
  title: "成为自己想成为的人",
};

export default function BecomingPage() {
  return (
    <article className="essay">
      <div className="article-topbar">
        <Link href="/insights" className="back-link">← Insights</Link>
        <ShareButton title="成为自己想成为的人" />
      </div>
      <header>
        <p className="eyebrow">A note to myself</p>
        <h1>成为自己想成为的人</h1>
      </header>
      <div className="essay-body">
        <p>
          成为自己想成为的人，不是某一天突然抵达一个完美的终点。它发生在很多很小的选择里：
          面对害怕时是否愿意行动，感到混乱时是否仍然诚实，以及能不能为真正重要的事情留下时间。
        </p>
        <p>
          我想要的自由，并不是没有责任，也不是永远随心所欲。它是尽量保留对生活中可选部分的选择权，
          是知道自己为什么做一件事，也愿意承担选择带来的结果。
        </p>
        <p>
          我希望自己持续成长，也持续建立内在安全感。少一些被外界评价牵着走，多一些对自己感受和判断的
          信任。崩溃和怀疑都可以发生，但它们不必替我做最终决定。
        </p>
        <p>
          要勇敢，要行动。发挥主观能动性，不把人生完全交给惯性。成为自己想成为的人，就是一次又一次，
          选择更接近那个自己的方向。
        </p>
      </div>
      <EntryFooter
        publishedAt="2026-07-23T08:00:00.000Z"
        city="Shanghai"
      />
    </article>
  );
}
