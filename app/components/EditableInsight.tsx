"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { HomepageContent } from "@/lib/homepage";
import { EntryFooter } from "./JournalEntry";
import { ShareButton } from "./ShareButton";

type InsightKind = "gratitude" | "becoming";
type SaveState = "idle" | "saving" | "saved" | "error";

const essaySchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "span"],
  attributes: {
    ...defaultSchema.attributes,
    span: ["dataColor"],
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function EditableInsight({
  kind,
  initialContent,
  publishedAt,
  city,
}: {
  kind: InsightKind;
  initialContent: HomepageContent;
  publishedAt: string;
  city: string;
}) {
  const titleKey =
    kind === "gratitude" ? "gratitudeLabel" : "becomingLabel";
  const bodyKey = kind === "gratitude" ? "gratitudeBody" : "becomingBody";
  const [content, setContent] = useState(initialContent);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState<"image" | "audio" | null>(null);
  const [editorInitialBody, setEditorInitialBody] = useState(
    initialContent[bodyKey]
  );
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const lastSavedRef = useRef(JSON.stringify(initialContent));

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean }) =>
        setAuthenticated(data.authenticated)
      )
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!editing || !editorRef.current) return;
    editorRef.current.innerHTML = editorInitialBody;
  }, [editing, editorInitialBody]);

  const save = useCallback(async (nextContent: HomepageContent) => {
    const snapshot = JSON.stringify(nextContent);
    if (snapshot === lastSavedRef.current) return true;
    setSaveState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });
      const data = (await response.json()) as {
        content?: HomepageContent;
        error?: string;
      };
      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Unable to save this page.");
      }
      lastSavedRef.current = JSON.stringify(data.content);
      setContent(data.content);
      setSaveState("saved");
      return true;
    } catch (error) {
      setSaveState("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to save this page."
      );
      return false;
    }
  }, []);

  useEffect(() => {
    if (!editing) return;
    const snapshot = JSON.stringify(content);
    if (snapshot === lastSavedRef.current) return;
    const timer = window.setTimeout(() => void save(content), 700);
    return () => window.clearTimeout(timer);
  }, [content, editing, save]);

  function updateTitle(value: string) {
    setContent((current) => ({ ...current, [titleKey]: value }));
  }

  function commitEditor() {
    const value = editorRef.current?.innerHTML ?? "";
    setContent((current) => ({ ...current, [bodyKey]: value }));
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
    if (range.collapsed || !editor.contains(range.commonAncestorContainer)) return;

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
    if (url) runEditorCommand("createLink", url);
  }

  async function uploadMedia(file: File, mediaKind: "image" | "audio") {
    setUploading(mediaKind);
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
      const name = escapeHtml(
        data.name ?? (mediaKind === "image" ? "image" : "recording")
      );
      const url = escapeHtml(data.url);
      runEditorCommand(
        "insertHTML",
        mediaKind === "image"
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
    mediaKind: "image" | "audio"
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadMedia(file, mediaKind);
  }

  async function finishEditing() {
    if (await save(content)) setEditing(false);
  }

  const title = content[titleKey];
  const body = content[bodyKey];

  return (
    <article className={`essay${editing ? " essay-editing" : ""}`}>
      <div className="article-topbar">
        <Link href="/insights" className="back-link">← Insights</Link>
        <div className="article-actions">
          {editing ? (
            <>
              <span className={`homepage-save-state ${saveState}`}>
                {saveState === "saving"
                  ? "Saving…"
                  : saveState === "error"
                    ? "Not saved"
                    : "Saved"}
              </span>
              <button
                className="share-link"
                type="button"
                onClick={() => void finishEditing()}
              >
                Done
              </button>
            </>
          ) : (
            <>
              {authenticated && (
                <button
                  className="share-link"
                  type="button"
                  onClick={() => {
                    setSaveState("saved");
                    setEditorInitialBody(content[bodyKey]);
                    setEditing(true);
                  }}
                >
                  Edit
                </button>
              )}
              <ShareButton title={title} />
            </>
          )}
        </div>
      </div>

      <header>
        <p className="eyebrow">A note to myself</p>
        {editing ? (
          <input
            className="essay-title-editor"
            aria-label="Title"
            value={title}
            onChange={(event) => updateTitle(event.target.value)}
            autoCorrect="on"
            spellCheck
          />
        ) : (
          <h1>{title}</h1>
        )}
      </header>

      {editing ? (
        <div className="essay-editor">
          <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("bold")} title="Bold">
              <strong>B</strong>
            </button>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("insertUnorderedList")} title="Bullet list">
              • List
            </button>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={addLink} title="Add link">
              Link
            </button>
            <span className="toolbar-divider" />
            {(["gold", "pink", "purple"] as const).map((color) => (
              <button
                key={color}
                type="button"
                className={`text-color-dot ${color}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => colorSelection(color)}
                title={`${color} text`}
                aria-label={`${color} text`}
              />
            ))}
            <span className="toolbar-divider" />
            <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading !== null}>
              {uploading === "image" ? "Uploading…" : "Image"}
            </button>
            <button type="button" onClick={() => audioInputRef.current?.click()} disabled={uploading !== null}>
              {uploading === "audio" ? "Uploading…" : "Audio"}
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(event) => handleMedia(event, "image")} />
            <input ref={audioInputRef} type="file" accept="audio/*" hidden onChange={(event) => handleMedia(event, "audio")} />
          </div>
          <div
            ref={editorRef}
            className="rich-text-editor"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label="Essay"
            data-placeholder="Begin here…"
            onInput={commitEditor}
            suppressContentEditableWarning
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck
          />
          <p className="editor-help">
            Changes save automatically. Select text to add bold, color, or a link.
          </p>
          {message && <p className="homepage-edit-error">{message}</p>}
        </div>
      ) : (
        <div className="essay-body">
          <Markdown
            rehypePlugins={[rehypeRaw, [rehypeSanitize, essaySchema]]}
            components={{
              a({ href, children, ...props }) {
                const label = String(children);
                if (href && label.startsWith("audio:")) {
                  return (
                    <figure className="audio-attachment">
                      <audio controls preload="metadata" src={href}>
                        Your browser does not support audio playback.
                      </audio>
                      <figcaption>{label.replace(/^audio:/, "")}</figcaption>
                    </figure>
                  );
                }
                return <a href={href} {...props}>{children}</a>;
              },
            }}
          >
            {body}
          </Markdown>
        </div>
      )}
      <EntryFooter publishedAt={publishedAt} city={city} />
    </article>
  );
}
