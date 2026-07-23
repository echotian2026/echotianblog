import Link from "next/link";

export default function Home() {
  return (
    <div className="home-page">
      <section className="bio" aria-label="About me">
        <h1 className="home-name">Echo Tian</h1>
        <p>
          hello，我是 Echo。这里放一些我在生活中看过、想过、做过，且想表达的东西，当作我来过这个世界的记录。
        </p>
        <p>
          我追求自由，希望自己持续成长，持续建立内在安全感，也希望 always remind
          myself of{" "}
          <Link href="/insights/gratitude" className="inline-link">
            the things I’ve been grateful for
          </Link>
          。及时把自己从偶尔的崩溃和自我否定中拉出来；要勇敢，要行动，尽量发挥主观能动性，
          把控生活中可选部分的选择权，
          <Link href="/insights/becoming" className="inline-link">
            成为自己想成为的人
          </Link>
          。
        </p>
        <p>
          除了我是我自己，我还是女儿、妻子和母亲。我爱我的家人。
        </p>
      </section>

      <section className="text-section" aria-labelledby="writing-heading">
        <h2 id="writing-heading">My writing</h2>
        <ul className="text-list">
          <li><Link href="/journal" className="inline-link">Journal</Link></li>
          <li><Link href="/insights" className="inline-link">Insights</Link></li>
        </ul>
      </section>

      <section className="text-section" aria-labelledby="work-heading">
        <h2 id="work-heading">My work</h2>
        <ul className="text-list">
          <li><Link href="/work/skills" className="inline-link">Skills</Link></li>
          <li><Link href="/work/business" className="inline-link">Business</Link></li>
        </ul>
      </section>

      <p className="contact-line">
        Reach out if interested —{" "}
        <a
          href="https://x.com/echo_tian"
          className="inline-link"
          target="_blank"
          rel="noreferrer"
        >
          @echo_tian
        </a>
        {" "}or{" "}
        <a href="mailto:echochangtian@163.com" className="inline-link">
          echochangtian@163.com
        </a>
        .
      </p>
    </div>
  );
}
