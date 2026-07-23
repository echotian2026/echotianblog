"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PostSection } from "@/lib/posts";

export function AdminEntryLink({
  section,
  label = "New post",
}: {
  section: PostSection;
  label?: string;
}) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean }) =>
        setAuthenticated(data.authenticated)
      )
      .catch(() => setAuthenticated(false));
  }, []);

  if (!authenticated) return null;

  return (
    <Link href={`/admin?section=${section}`} className="add-entry-link">
      + {label}
    </Link>
  );
}
