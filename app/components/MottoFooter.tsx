"use client";

import { useEffect, useState } from "react";
import { mottos } from "@/lib/mottos";

export function MottoFooter() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * mottos.length));
  }, []);

  const motto = mottos[index];

  return (
    <footer className="motto-footer">
      <p>{motto.zh}</p>
      <span>{motto.en}</span>
    </footer>
  );
}
