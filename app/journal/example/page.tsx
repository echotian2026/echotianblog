import type { Metadata } from "next";
import { JournalEntry } from "@/app/components/JournalEntry";

export const metadata: Metadata = { title: "A day worth remembering" };

export default function ExampleEntryPage() {
  return (
    <JournalEntry
      title="A day worth remembering"
      publishedAt="2026-07-23T08:00:00.000Z"
      mood="happy"
    >
      <p>
        这是文章详情页的示例。日期被拆分成年份、月日和星期，右侧会记录写下这篇日记时的心情。
      </p>
      <p>
        正文保持安静、易读的排版。你可以使用 <strong>粗体</strong>、{" "}
        <mark data-color="yellow">高亮文字</mark>、带下划线的{" "}
        <a href="https://x.com/echo_tian">外部链接</a>，也可以添加：
      </p>
      <ul>
        <li>当天发生的事情</li>
        <li>值得记住的想法</li>
        <li>图片或一段声音</li>
      </ul>
      <blockquote>
        自动保存会安静地发生，不需要寻找 Publish 或 Save 按钮。
      </blockquote>
    </JournalEntry>
  );
}
