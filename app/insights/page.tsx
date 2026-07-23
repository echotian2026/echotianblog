import Link from "next/link";

export default function InsightsPage() {
  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">My writing</p>
      <h1>Insights</h1>
      <p className="directory-intro">那些值得反复提醒自己的事。</p>
      <ul className="directory-list">
        <li>
          <Link href="/insights/gratitude" className="inline-link">
            The things I’ve been grateful for
          </Link>
        </li>
        <li>
          <Link href="/insights/becoming" className="inline-link">
            成为自己想成为的人
          </Link>
        </li>
      </ul>
    </section>
  );
}
