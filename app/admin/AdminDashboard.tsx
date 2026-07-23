"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { JournalPost } from "@/lib/posts";

type Draft = {
  id?: string;
  title: string;
  content: string;
  publishedAt: string;
  isPrivate: boolean;
};

const freshDraft = (): Draft => ({
  title: "",
  content: "",
  publishedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16),
  isPrivate: false,
});

function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [draft, setDraft] = useState<Draft>(freshDraft);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    const response = await fetch("/api/admin/posts", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = (await response.json()) as { posts: JournalPost[] };
    setPosts(data.posts);
  }, []);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (data: { authenticated: boolean }) => {
        setAuthenticated(data.authenticated);
        setAuthChecked(true);
        if (data.authenticated) await loadPosts();
      });
  }, [loadPosts]);

  const editing = useMemo(
    () => posts.find((post) => post.id === draft.id),
    [draft.id, posts]
  );

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Unable to unlock the journal.");
      return;
    }
    setPassword("");
    setAuthenticated(true);
    await loadPosts();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch(
      draft.id ? `/api/admin/posts/${draft.id}` : "/api/admin/posts",
      {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          publishedAt: new Date(draft.publishedAt).toISOString(),
          isPrivate: draft.isPrivate,
        }),
      }
    );
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to save this entry.");
      return;
    }
    setDraft(freshDraft());
    setMessage(draft.id ? "Entry updated." : "Entry saved.");
    await loadPosts();
  }

  function edit(post: JournalPost) {
    setDraft({
      id: post.id,
      title: post.title,
      content: post.content,
      publishedAt: localDate(post.publishedAt),
      isPrivate: post.isPrivate,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePrivacy(post: JournalPost) {
    await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrivate: !post.isPrivate }),
    });
    await loadPosts();
  }

  async function remove(post: JournalPost) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    if (draft.id === post.id) setDraft(freshDraft());
    await loadPosts();
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setPosts([]);
    setDraft(freshDraft());
  }

  if (!authChecked) {
    return <div className="admin-loading">Opening your journal…</div>;
  }

  if (!authenticated) {
    return (
      <section className="login-card">
        <div className="lock-orb" aria-hidden="true">✦</div>
        <p className="eyebrow">Private space</p>
        <h1>Welcome back.</h1>
        <p>Enter your password to write and manage journal entries.</p>
        <form onSubmit={login}>
          <label htmlFor="password">Admin password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••"
            required
            autoFocus
          />
          <button className="primary-button" type="submit">Unlock journal</button>
        </form>
        {message && <p className="form-message error">{message}</p>}
        {process.env.NODE_ENV === "development" && (
          <p className="preview-hint">Local preview password: journal-preview</p>
        )}
      </section>
    );
  }

  return (
    <div className="admin">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Private workspace</p>
          <h1>{editing ? "Edit entry" : "New entry"}</h1>
        </div>
        <button className="text-button" type="button" onClick={logout}>Lock journal</button>
      </div>

      <form className="editor" onSubmit={save}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="What’s on your mind?"
          required
        />

        <label htmlFor="content">Entry <span>Markdown supported</span></label>
        <textarea
          id="content"
          value={draft.content}
          onChange={(event) => setDraft({ ...draft, content: event.target.value })}
          placeholder={"Begin here…\n\n## A thought worth keeping"}
          rows={13}
        />

        <div className="editor-row">
          <div>
            <label htmlFor="publishedAt">Date & time</label>
            <input
              id="publishedAt"
              type="datetime-local"
              value={draft.publishedAt}
              onChange={(event) =>
                setDraft({ ...draft, publishedAt: event.target.value })
              }
              required
            />
          </div>
          <label className="privacy-control">
            <input
              type="checkbox"
              checked={draft.isPrivate}
              onChange={(event) =>
                setDraft({ ...draft, isPrivate: event.target.checked })
              }
            />
            <span className="switch" aria-hidden="true"><span /></span>
            <span><strong>Keep this entry private</strong><small>Only visible to me</small></span>
          </label>
        </div>

        <div className="editor-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : draft.id ? "Update entry" : "Save entry"}
          </button>
          {draft.id && (
            <button className="secondary-button" type="button" onClick={() => setDraft(freshDraft())}>
              Cancel
            </button>
          )}
          {message && <p className="form-message">{message}</p>}
        </div>
      </form>

      <section className="manage" aria-labelledby="manage-title">
        <div className="section-heading">
          <h2 id="manage-title">All entries</h2>
          <span>{posts.length} total</span>
        </div>
        {posts.length ? (
          <ul className="manage-list">
            {posts.map((post) => (
              <li key={post.id}>
                <div className="manage-copy">
                  <div>
                    <span className={`status-badge ${post.isPrivate ? "private" : "public"}`}>
                      {post.isPrivate ? "🔒 Private" : "🌐 Public"}
                    </span>
                    <time>{displayDate(post.publishedAt)}</time>
                  </div>
                  <strong>{post.title}</strong>
                </div>
                <div className="manage-actions">
                  <button type="button" onClick={() => edit(post)}>Edit</button>
                  <button type="button" onClick={() => togglePrivacy(post)}>
                    Make {post.isPrivate ? "public" : "private"}
                  </button>
                  <button type="button" className="danger" onClick={() => remove(post)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="manage-empty">No entries yet. Your first one starts above.</p>
        )}
      </section>
    </div>
  );
}
