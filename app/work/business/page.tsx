import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Business" };

export default function BusinessPage() {
  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">My work</p>
      <h1>Business</h1>
      <p className="directory-intro">
        Selected projects, collaborations, and business experiments will live here.
      </p>
    </section>
  );
}
