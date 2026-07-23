"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { mottos } from "@/lib/mottos";

export function MottoFooter() {
  const pathname = usePathname();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIndex(Math.floor(Math.random() * mottos.length));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const motto = mottos[index];

  if (pathname !== "/") return null;

  return (
    <footer className="motto-footer">
      <p>{motto.zh}</p>
      <span>{motto.en}</span>
    </footer>
  );
}
