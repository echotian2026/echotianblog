"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { HomepageContent } from "@/lib/homepage";
import type { JournalPost } from "@/lib/posts";

type SaveState = "idle" | "saving" | "saved" | "error";

export function EditableHomepage({
  initialContent,
  publicPosts,
}: {
  initialContent: HomepageContent;
  publicPosts: JournalPost[];
}) {
  const [content, setContent] = useState(initialContent);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedRef = useRef(JSON.stringify(initialContent));

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean }) =>
        setAuthenticated(data.authenticated)
      )
      .catch(() => setAuthenticated(false));
  }, []);

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
        throw new Error(data.error ?? "Unable to save the homepage.");
      }
      lastSavedRef.current = JSON.stringify(data.content);
      setContent(data.content);
      setSaveState("saved");
      return true;
    } catch (error) {
      setSaveState("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to save the homepage."
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

  function update<Key extends keyof HomepageContent>(
    key: Key,
    value: HomepageContent[Key]
  ) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  function beginEditing() {
    if (!authenticated) return;
    setEditing(true);
    setSaveState("saved");
  }

  async function finishEditing() {
    if (await save(content)) setEditing(false);
  }

  return (
    <div
      className={`home-page${editing ? " homepage-editing" : ""}`}
      data-public-post-count={publicPosts.length}
    >
      <div className="homepage-edit-actions">
        {editing ? (
          <>
            <span className={`homepage-save-state ${saveState}`}>
              {saveState === "saving"
                ? "Saving…"
                : saveState === "error"
                  ? "Not saved"
                  : "Saved"}
            </span>
            <button type="button" onClick={() => void finishEditing()}>
              Done
            </button>
          </>
        ) : authenticated ? (
          <button type="button" onClick={beginEditing}>
            Edit homepage
          </button>
        ) : null}
      </div>

      <section className="bio" aria-label="About me">
        {editing ? (
          <input
            className="home-name homepage-field"
            aria-label="Name"
            value={content.name}
            onChange={(event) => update("name", event.target.value)}
          />
        ) : (
          <h1 className="home-name">{content.name}</h1>
        )}

        {editing ? (
          <textarea
            className="homepage-field homepage-paragraph"
            aria-label="Opening introduction"
            value={content.introLead}
            onChange={(event) => update("introLead", event.target.value)}
          />
        ) : (
          <p>{content.introLead}</p>
        )}

        {editing ? (
          <div className="homepage-composite-editor">
            <textarea
              className="homepage-field homepage-paragraph"
              aria-label="Introduction before gratitude link"
              value={content.introTwoBefore}
              onChange={(event) => update("introTwoBefore", event.target.value)}
            />
            <input
              className="homepage-field homepage-link-field"
              aria-label="Gratitude link text"
              value={content.gratitudeLabel}
              onChange={(event) => update("gratitudeLabel", event.target.value)}
            />
            <textarea
              className="homepage-field homepage-paragraph"
              aria-label="Introduction before becoming link"
              value={content.introTwoMiddle}
              onChange={(event) => update("introTwoMiddle", event.target.value)}
            />
            <input
              className="homepage-field homepage-link-field"
              aria-label="Becoming link text"
              value={content.becomingLabel}
              onChange={(event) => update("becomingLabel", event.target.value)}
            />
            <input
              className="homepage-field homepage-short-field"
              aria-label="Introduction ending"
              value={content.introTwoAfter}
              onChange={(event) => update("introTwoAfter", event.target.value)}
            />
          </div>
        ) : (
          <p>
            {content.introTwoBefore}{" "}
            <Link href="/insights/gratitude" className="inline-link">
              {content.gratitudeLabel}
            </Link>
            {content.introTwoMiddle}
            <Link href="/insights/becoming" className="inline-link">
              {content.becomingLabel}
            </Link>
            {content.introTwoAfter}
          </p>
        )}

        {editing ? (
          <textarea
            className="homepage-field homepage-paragraph"
            aria-label="Family introduction"
            value={content.family}
            onChange={(event) => update("family", event.target.value)}
          />
        ) : (
          <p>{content.family}</p>
        )}
      </section>

      <EditableSection
        editing={editing}
        authenticated={authenticated === true}
        heading={content.writingHeading}
        onHeading={(value) => update("writingHeading", value)}
        entries={[
          {
            href: "/journal",
            label: content.journalLabel,
            onChange: (value) => update("journalLabel", value),
          },
          {
            href: "/insights",
            label: content.insightsLabel,
            onChange: (value) => update("insightsLabel", value),
          },
        ]}
      />

      <EditableSection
        editing={editing}
        authenticated={authenticated === true}
        heading={content.workHeading}
        onHeading={(value) => update("workHeading", value)}
        dynamicEntries={publicPosts
          .filter((post) => post.section === "work")
          .map((post) => ({
            href: `/posts/${post.slug}`,
            label: post.title,
          }))}
        addHref="/admin?section=work"
        addLabel="Add work entry"
        entries={[]}
      />

      {editing ? (
        <div className="contact-line homepage-contact-editor">
          <input
            className="homepage-field"
            aria-label="Contact introduction"
            value={content.contactPrefix}
            onChange={(event) => update("contactPrefix", event.target.value)}
          />
          <input
            className="homepage-field homepage-link-field"
            aria-label="X display name"
            value={content.xLabel}
            onChange={(event) => update("xLabel", event.target.value)}
          />
          <input
            className="homepage-field"
            aria-label="X address"
            value={content.xUrl}
            onChange={(event) => update("xUrl", event.target.value)}
          />
          <input
            className="homepage-field homepage-link-field"
            aria-label="Email address"
            type="email"
            value={content.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </div>
      ) : (
        <p className="contact-line">
          {content.contactPrefix}{" "}
          <a
            href={content.xUrl}
            className="inline-link"
            target="_blank"
            rel="noreferrer"
          >
            {content.xLabel}
          </a>
          {" "}or{" "}
          <a href={`mailto:${content.email}`} className="inline-link">
            {content.email}
          </a>
          .
        </p>
      )}
      {editing && message && <p className="homepage-edit-error">{message}</p>}
    </div>
  );
}

function EditableSection({
  editing,
  authenticated,
  heading,
  onHeading,
  entries,
  dynamicEntries = [],
  addHref,
  addLabel,
}: {
  editing: boolean;
  authenticated: boolean;
  heading: string;
  onHeading: (value: string) => void;
  entries: Array<{
    href: string;
    label: string;
    onChange: (value: string) => void;
  }>;
  dynamicEntries?: Array<{ href: string; label: string }>;
  addHref?: string;
  addLabel?: string;
}) {
  return (
    <section className="text-section">
      {editing ? (
        <input
          className="homepage-field homepage-section-heading"
          aria-label="Section heading"
          value={heading}
          onChange={(event) => onHeading(event.target.value)}
        />
      ) : (
        <h2>{heading}</h2>
      )}
      <ul className="text-list">
        {entries.map((entry) => (
          <li key={entry.href}>
            {editing ? (
              <input
                className="homepage-field homepage-link-field"
                aria-label={`${heading} entry`}
                value={entry.label}
                onChange={(event) => entry.onChange(event.target.value)}
              />
            ) : (
              <Link href={entry.href} className="inline-link">
                {entry.label}
              </Link>
            )}
          </li>
        ))}
        {!editing &&
          dynamicEntries.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href} className="inline-link">
                {entry.label}
              </Link>
            </li>
          ))}
        {!editing && authenticated && addHref && addLabel && (
          <li className="add-entry-item">
            <Link href={addHref} className="add-entry-link">
              + {addLabel}
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
