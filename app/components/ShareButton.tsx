"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [label, setLabel] = useState("Share link");

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setLabel("Link copied");
      window.setTimeout(() => setLabel("Share link"), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button type="button" className="share-link" onClick={() => void share()}>
      {label}
    </button>
  );
}
