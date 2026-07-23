"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { JournalPost, PostSection } from "@/lib/posts";

type Mood = "sad" | "neutral" | "happy";
type Draft = {
  id?: string;
  title: string;
  content: string;
  publishedAt: string;
  mood: Mood;
  section: PostSection;
  isPrivate: boolean;
};

const moods: Array<{ value: Mood; emoji: string; label: string }> = [
  { value: "sad", emoji: "☹️", label: "不开心" },
  { value: "neutral", emoji: "😐", label: "一般" },
  { value: "happy", emoji: "😊", label: "开心" },
];

const freshDraft = (section: PostSection = "writing"): Draft => ({
  title: "",
  content: "",
  publishedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16),
  mood: "neutral",
  section,
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

function snapshot(draft: Draft) {
  return JSON.stringify({
    id: draft.id,
    title: draft.title,
    content: draft.content,
    publishedAt: draft.publishedAt,
    mood: draft.mood,
    section: draft.section,
    isPrivate: draft.isPrivate,
  });
}

export function AdminDashboard({
  initialSection,
}: {
  initialSection: PostSection;
}) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [draft, setDraft] = useState<Draft>(() => freshDraft(initialSection));
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [savedAt, setSavedAt] = useState("");
  const [uploading, setUploading] = useState<"image" | "audio" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const lastSavedRef = useRef("");

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

  useEffect(() => {
    if (!authenticated || !draft.title.trim()) {
      if (!draft.title.trim()) setSaveState("idle");
      return;
    }

    const currentSnapshot = snapshot(draft);
    if (currentSnapshot === lastSavedRef.current) return;

    const timer = window.setTimeout(async () => {
      const savingDraft = draft;
      setSaveState("saving");
      setMessage("");

      try {
        const response = await fetch(
          savingDraft.id
            ? `/api/admin/posts/${savingDraft.id}`
            : "/api/admin/posts",
          {
            method: savingDraft.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: savingDraft.title,
              content: savingDraft.content,
              publishedAt: new Date(savingDraft.publishedAt).toISOString(),
              mood: savingDraft.mood,
              section: savingDraft.section,
              isPrivate: savingDraft.isPrivate,
            }),
          }
        );
        const data = (await response.json()) as {
          post?: JournalPost;
          error?: string;
        };
        if (!response.ok || !data.post) {
          throw new Error(data.error ?? "Unable to save this entry.");
        }

        const savedDraft = { ...savingDraft, id: data.post.id };
        lastSavedRef.current = snapshot(savedDraft);
        if (!savingDraft.id) {
          setDraft((current) => ({ ...current, id: data.post?.id }));
        }
        setSaveState("saved");
        setSavedAt(
          new Intl.DateTimeFormat("en", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date())
        );
        await loadPosts();
      } catch (error) {
        setSaveState("error");
        setMessage(
          error instanceof Error ? error.message : "Unable to save this entry."
        );
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [authenticated, draft, loadPosts]);

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

  function edit(post: JournalPost) {
    const nextDraft: Draft = {
      id: post.id,
      title: post.title,
      content: post.content,
      publishedAt: localDate(post.publishedAt),
      mood: post.mood,
      section: post.section,
      isPrivate: post.isPrivate,
    };
    lastSavedRef.current = snapshot(nextDraft);
    setDraft(nextDraft);
    setSaveState("saved");
    setSavedAt("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newEntry(section: PostSection = draft.section) {
    lastSavedRef.current = "";
    setDraft(freshDraft(section));
    setSaveState("idle");
    setSavedAt("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function replaceSelection(
    transform: (selected: string) => { text: string; selectStart?: number; selectEnd?: number }
  ) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const source = textarea.value;
    const selected = source.slice(start, end);
    const replacement = transform(selected);
    const content =
      source.slice(0, start) +
      replacement.text +
      source.slice(end);
    setDraft((current) => ({ ...current, content }));

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + (replacement.selectStart ?? replacement.text.length),
        start + (replacement.selectEnd ?? replacement.text.length)
      );
    });
  }

  function wrapSelection(prefix: string, suffix: string) {
    replaceSelection((selected) => ({
      text: `${prefix}${selected || "text"}${suffix}`,
      selectStart: prefix.length,
      selectEnd: prefix.length + (selected || "text").length,
    }));
  }

  function addBullets() {
    replaceSelection((selected) => ({
      text: (selected || "List item")
        .split("\n")
        .map((line) => `- ${line.replace(/^[-*]\s+/, "")}`)
        .join("\n"),
    }));
  }

  function addLink() {
    const url = window.prompt("Paste a link");
    if (!url) return;
    replaceSelection((selected) => ({
      text: `[${selected || "link text"}](${url})`,
      selectStart: 1,
      selectEnd: 1 + (selected || "link text").length,
    }));
  }

  function insertText(text: string) {
    replaceSelection(() => ({ text }));
  }

  async function uploadMedia(file: File, kind: "image" | "audio") {
    setUploading(kind);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        url?: string;
        name?: string;
        error?: string;
      };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Upload failed.");
      }
      insertText(
        kind === "image"
          ? `\n\n![${data.name ?? "image"}](${data.url})\n\n`
          : `\n\n[audio:${data.name ?? "recording"}](${data.url})\n\n`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  function handleMedia(
    event: ChangeEvent<HTMLInputElement>,
    kind: "image" | "audio"
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadMedia(file, kind);
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
    if (draft.id === post.id) newEntry();
    await loadPosts();
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setPosts([]);
    newEntry(initialSection);
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
        <div className="admin-heading-actions">
          {draft.id && (
            <button className="text-button" type="button" onClick={() => newEntry()}>
              New entry
            </button>
          )}
          <button className="text-button" type="button" onClick={logout}>
            Lock journal
          </button>
        </div>
      </div>

      <div className="editor">
        <div className="autosave-row">
          <span>
            {saveState === "idle" && "Start with a title — autosave will begin"}
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && `Saved${savedAt ? ` at ${savedAt}` : ""}`}
            {saveState === "error" && "Save interrupted"}
          </span>
          <div className="autosave-actions">
            {editing && !draft.isPrivate && (
              <Link href={`/posts/${editing.slug}`} className="inline-link">
                View entry
              </Link>
            )}
            <button
              type="button"
              className={`visibility-button ${draft.isPrivate ? "private" : "public"}`}
              onClick={() => setDraft({ ...draft, isPrivate: !draft.isPrivate })}
              aria-pressed={draft.isPrivate}
            >
              {draft.isPrivate ? "🔒 Private" : "🌐 Public"}
            </button>
          </div>
        </div>

        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="What’s on your mind?"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
        />

        <div className="editor-row">
          <div>
            <label htmlFor="section">Show this post in</label>
            <select
              id="section"
              value={draft.section}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  section: event.target.value as PostSection,
                })
              }
            >
              <option value="writing">My Writing</option>
              <option value="work">My Work</option>
            </select>
          </div>
        </div>

        <fieldset className="mood-field">
          <legend>How did today feel?</legend>
          <div className="mood-options">
            {moods.map((mood) => (
              <label
                key={mood.value}
                className={draft.mood === mood.value ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="mood"
                  value={mood.value}
                  checked={draft.mood === mood.value}
                  onChange={() => setDraft({ ...draft, mood: mood.value })}
                />
                <span aria-hidden="true">{mood.emoji}</span>
                <small>{mood.label}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="editor-label-row">
          <label htmlFor="content">Entry</label>
          <span>Markdown + browser spellcheck</span>
        </div>
        <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
          <button type="button" onClick={() => wrapSelection("**", "**")} title="Bold">
            <strong>B</strong>
          </button>
          <button type="button" onClick={addBullets} title="Bullet list">• List</button>
          <button type="button" onClick={addLink} title="Add link">Link</button>
          <span className="toolbar-divider" />
          <button
            type="button"
            className="highlight-dot yellow"
            onClick={() => wrapSelection('<mark data-color="yellow">', "</mark>")}
            title="Yellow highlight"
            aria-label="Yellow highlight"
          />
          <button
            type="button"
            className="highlight-dot pink"
            onClick={() => wrapSelection('<mark data-color="pink">', "</mark>")}
            title="Pink highlight"
            aria-label="Pink highlight"
          />
          <button
            type="button"
            className="highlight-dot purple"
            onClick={() => wrapSelection('<mark data-color="purple">', "</mark>")}
            title="Purple highlight"
            aria-label="Purple highlight"
          />
          <span className="toolbar-divider" />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading !== null}
          >
            {uploading === "image" ? "Uploading…" : "Image"}
          </button>
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={uploading !== null}
          >
            {uploading === "audio" ? "Uploading…" : "Audio"}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => handleMedia(event, "image")}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={(event) => handleMedia(event, "audio")}
          />
        </div>
        <textarea
          ref={textareaRef}
          id="content"
          value={draft.content}
          onChange={(event) => setDraft({ ...draft, content: event.target.value })}
          placeholder={"Begin here…\n\nSelect text, then use the toolbar above."}
          rows={16}
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
        />
        <p className="editor-help">
          Select text before using Bold, Link, or a highlight color. English
          corrections come from your browser and operating system.
        </p>

        <div className="editor-row single">
          <div>
            <label htmlFor="publishedAt">Date & time</label>
            <input
              id="publishedAt"
              type="datetime-local"
              value={draft.publishedAt}
              onChange={(event) =>
                setDraft({ ...draft, publishedAt: event.target.value })
              }
            />
          </div>
        </div>

        {message && <p className="form-message error">{message}</p>}
      </div>

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
                    <span className="section-badge">
                      {post.section === "work" ? "My Work" : "My Writing"}
                    </span>
                    <span className="post-mood" aria-label={`Mood: ${post.mood}`}>
                      {moods.find((mood) => mood.value === post.mood)?.emoji ?? "😐"}
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
                  <button type="button" className="danger" onClick={() => remove(post)}>
                    Delete
                  </button>
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
