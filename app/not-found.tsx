import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">404 · Not found</p>
      <h1>This page is private,<br />or it never existed.</h1>
      <p>There’s nothing to see here—but the public journal is just a step away.</p>
      <Link href="/" className="primary-button">Return to journal</Link>
    </section>
  );
}
