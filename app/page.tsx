import Link from "next/link";
import { listPublicPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await listPublicPosts();

  return (
    <div className="home-page">
      <section className="bio" aria-label="About me">
        <p>
          I’m Echo, a product builder working at the intersection of{" "}
          <span className="inline-link">financial markets</span>,{" "}
          <span className="inline-link">artificial intelligence</span>, and
          everyday decision-making. I like turning complicated systems into
          products that feel calm, useful, and easy to understand.
        </p>
        <p>
          I’m currently exploring how research tools can help people think more
          clearly—not just move faster. Previously, I worked across product
          strategy, customer operations, and commercialization. I’m based in
          Shanghai and remain endlessly curious about markets, software, and
          how people form conviction.
        </p>
      </section>

      <section className="text-section" aria-labelledby="writing-heading">
        <h2 id="writing-heading">My writing</h2>
        {posts.length ? (
          <ul className="text-list">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/posts/${post.slug}`} className="inline-link">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="text-list">
            <li><span className="inline-link">Product taste is a compounding advantage</span></li>
            <li><span className="inline-link">What markets teach us about uncertainty</span></li>
            <li><span className="inline-link">Building tools that help people think</span></li>
          </ul>
        )}
      </section>

      <section className="text-section" aria-labelledby="work-heading">
        <h2 id="work-heading">My work</h2>
        <p>
          I build <span className="inline-link">AI-native financial products</span>,
          shape the research and data experiences behind them, and help teams
          translate new technology into products customers can trust.
        </p>
        <p>
          My favorite problems sit between product, business, and behavior:
          finding the useful signal, making complexity legible, and creating a
          path from an early idea to something people return to.
        </p>
      </section>

      <section className="text-section" aria-labelledby="history-heading">
        <h2 id="history-heading">My history</h2>
        <ul className="history-list">
          <li>
            <span>Now</span>
            <p>Building products and research systems around financial AI.</p>
          </li>
          <li>
            <span>Before</span>
            <p>Led product operations, customer growth, and commercialization work.</p>
          </li>
          <li>
            <span>Always</span>
            <p>Writing, learning, and looking for clearer ways to explain difficult things.</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
