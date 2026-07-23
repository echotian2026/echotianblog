"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("journal-theme");
      const nextLight = saved === "light";
      setLight(nextLight);
      document.documentElement.classList.toggle("light", nextLight);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("journal-theme", next ? "light" : "dark");
  }

  return (
    <header className="site-header">
      <nav className="nav-links" aria-label="Primary navigation">
        <Link href="/" aria-label="Home">Home</Link>
        <Link href="/admin">Admin</Link>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${light ? "dark" : "light"} mode`}
          title={`Switch to ${light ? "dark" : "light"} mode`}
        >
          {light ? "☾" : "☀"}
        </button>
      </nav>
    </header>
  );
}
