import Link from "next/link";
import type { ReactNode } from "react";

type Mood = "sad" | "neutral" | "happy";

const moodDetails: Record<Mood, { emoji: string; label: string }> = {
  sad: { emoji: "☹️", label: "不开心" },
  neutral: { emoji: "😐", label: "一般" },
  happy: { emoji: "😊", label: "开心" },
};

function dateParts(value: string) {
  const date = new Date(value);
  return {
    year: new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
    month: new Intl.DateTimeFormat("en", {
      month: "short",
      timeZone: "UTC",
    }).format(date),
    day: new Intl.DateTimeFormat("en", {
      day: "2-digit",
      timeZone: "UTC",
    }).format(date),
    weekday: new Intl.DateTimeFormat("en", {
      weekday: "long",
      timeZone: "UTC",
    }).format(date),
  };
}

export function EntryFooter({
  publishedAt,
  city,
}: {
  publishedAt: string;
  city: string;
}) {
  const age = new Date(publishedAt).getUTCFullYear() - 1988;

  return (
    <footer className="entry-footer">
      <span>{city || "Shanghai"}</span>
      <span>Age {age}</span>
    </footer>
  );
}

export function JournalEntry({
  title,
  publishedAt,
  mood,
  city,
  backHref = "/journal",
  children,
}: {
  title: string;
  publishedAt: string;
  mood: Mood;
  city: string;
  backHref?: string;
  children: ReactNode;
}) {
  const date = dateParts(publishedAt);
  const feeling = moodDetails[mood] ?? moodDetails.neutral;

  return (
    <article className="article journal-entry">
      <Link href={backHref} className="back-link">← Journal</Link>
      <header className="article-header">
        <div className="entry-meta">
          <time dateTime={publishedAt} className="entry-date">
            <span className="entry-date-year">{date.year}</span>
            <span className="entry-date-main">
              <strong>{date.month} {date.day}</strong>
              <small>{date.weekday}</small>
            </span>
          </time>
          <span className="entry-mood" aria-label={`Mood: ${feeling.label}`}>
            <span aria-hidden="true">{feeling.emoji}</span>
            {feeling.label}
          </span>
        </div>
        <h1>{title}</h1>
      </header>
      <div className="prose prose-purple dark:prose-invert entry-prose">
        {children}
      </div>
      <EntryFooter publishedAt={publishedAt} city={city} />
    </article>
  );
}
