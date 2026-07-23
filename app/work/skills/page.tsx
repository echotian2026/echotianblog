import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Skills" };

export default function SkillsPage() {
  return (
    <section className="directory-page">
      <Link href="/" className="back-link">← Home</Link>
      <p className="eyebrow">My work</p>
      <h1>Skills</h1>
      <p className="directory-intro">
        Product strategy, AI products, financial research, customer operations,
        commercialization, and turning complicated systems into useful experiences.
      </p>
    </section>
  );
}
