import Link from "next/link";
import { listPublicPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await listPublicPosts();

  return (
    <div className="home-page">
      <section className="bio" aria-label="About me">
        <p>
          hello，我是 Echo。这里放一些我在生活中看过、想过、做过，且想表达的东西，当作我来过这个世界的记录。
        </p>
        <p>
          我追求自由，希望自己持续成长，持续建立内在安全感，也希望 always remind
          myself of the things I’ve been grateful for。及时把自己从偶尔的崩溃和自我否定中拉出来；
          要勇敢，要行动，尽量发挥主观能动性，把控生活中可选部分的选择权，成为自己想成为的人。
        </p>
        <p>
          除了我是我自己，我还是女儿、妻子和母亲。我爱我的家人。
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

    </div>
  );
}
