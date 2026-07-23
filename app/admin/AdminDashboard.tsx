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
  tagsText: string;
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
  tagsText: "",
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
    tagsText: draft.tagsText,
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
  const editorRef = useRef<HTMLDivElement>(null);
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
    if (!authenticated || !draft.title.trim()) return;

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
              tags: savingDraft.tagsText,
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

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.innerHTML === draft.content) return;
    editor.innerHTML = draft.content;
  }, [draft.content, draft.id]);

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
      tagsText: post.tags.join(", "),
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

  function commitEditor() {
    const content = editorRef.current?.innerHTML ?? "";
    setDraft((current) => ({ ...current, content }));
  }

  function runEditorCommand(command: string, value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    commitEditor();
  }

  function colorSelection(color: "purple" | "pink" | "gold") {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (
      range.collapsed ||
      !editor.contains(range.commonAncestorContainer)
    ) {
      return;
    }

    const span = document.createElement("span");
    span.dataset.color = color;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.addRange(nextRange);
    commitEditor();
  }

  function addLink() {
    const url = window.prompt("Paste a link");
    if (!url) return;
    runEditorCommand("createLink", url);
  }

  function insertHtml(html: string) {
    runEditorCommand("insertHTML", html);
  }

  function escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
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
      const name = escapeHtml(data.name ?? (kind === "image" ? "image" : "recording"));
      const url = escapeHtml(data.url);
      insertHtml(
        kind === "image"
          ? `<p><img src="${url}" alt="${name}"></p><p><br></p>`
          : `<p><a href="${url}">audio:${name}</a></p><p><br></p>`
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
      {draft.id && (
        <div className="admin-utility-row">
          <button className="text-button" type="button" onClick={() => newEntry()}>
            Add another entry
          </button>
        </div>
      )}

      <div className="editor">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={draft.title}
          onChange={(event) => {
            const title = event.target.value;
            setDraft({ ...draft, title });
            if (!title.trim()) setSaveState("idle");
          }}
          placeholder="Title"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
          autoFocus
        />

        <div className="autosave-row">
          <span>
            {saveState === "idle" && "Autosave begins when you add a title"}
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

        <div className="editor-row editor-settings-row">
          <div>
            <label htmlFor="section">Section</label>
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
              <optgroup label="My Writing">
                <option value="writing">Journal</option>
                <option value="insights">Insights</option>
              </optgroup>
              <optgroup label="My Work">
                <option value="work">My Work</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label htmlFor="tags">
              Tags <span>comma separated · # optional</span>
            </label>
            <input
              id="tags"
              value={draft.tagsText}
              onChange={(event) =>
                setDraft({ ...draft, tagsText: event.target.value })
              }
              placeholder="growth, family, travel"
              autoCapitalize="none"
              spellCheck={false}
            />
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
          <span>Rich text + browser spellcheck</span>
        </div>
        <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("bold")}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("insertUnorderedList")}
            title="Bullet list"
          >
            • List
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={addLink}
            title="Add link"
          >
            Link
          </button>
          <span className="toolbar-divider" />
          <button
            type="button"
            className="text-color-dot gold"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => colorSelection("gold")}
            title="Gold text"
            aria-label="Gold text"
          />
          <button
            type="button"
            className="text-color-dot pink"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => colorSelection("pink")}
            title="Pink text"
            aria-label="Pink text"
          />
          <button
            type="button"
            className="text-color-dot purple"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => colorSelection("purple")}
            title="Purple text"
            aria-label="Purple text"
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
        <div
          ref={editorRef}
          id="content"
          className="rich-text-editor"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Entry"
          data-placeholder="Begin here…"
          onInput={commitEditor}
          suppressContentEditableWarning
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
        />
        <p className="editor-help">
          Select text, then choose Bold or a text color. What you see here is
          how it will appear in the published entry.
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
                      {post.section === "work"
                        ? "My Work · Entry"
                        : post.section === "insights"
                          ? "My Writing · Insights"
                          : "My Writing · Journal"}
                    </span>
                    <span className="post-mood" aria-label={`Mood: ${post.mood}`}>
                      {moods.find((mood) => mood.value === post.mood)?.emoji ?? "😐"}
                    </span>
                    <time>{displayDate(post.publishedAt)}</time>
                  </div>
                  <strong>{post.title}</strong>
                  {post.tags.length > 0 && (
                    <span className="manage-tags">
                      {post.tags.map((tag) => `#${tag}`).join(" ")}
                    </span>
                  )}
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
