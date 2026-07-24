import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sourcePath = process.argv[2];
if (!sourcePath) {
  throw new Error("Pass the source HTML file path.");
}

const source = fs.readFileSync(sourcePath, "utf8");
const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
const style = source.match(/<style>([\s\S]*?)<\/style>/i)?.[1];
const pageStart = source.indexOf('<div class="page">');
const injectedStart = source.indexOf('<div class="light"></div>', pageStart);
const bodyEnd = injectedStart >= 0 ? injectedStart : source.lastIndexOf("</body>");

if (!title || !style || pageStart < 0 || bodyEnd < 0) {
  throw new Error("The source HTML does not contain the expected page structure.");
}

const publicRoot = path.join(process.cwd(), "public", "work");
const imageRoot = path.join(publicRoot, "acquisition-cases");
const outputPath = path.join(publicRoot, "acquisition-cases.html");
const temporaryRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "echo-acquisition-cases-")
);

fs.mkdirSync(imageRoot, { recursive: true });

let imageNumber = 0;
let page = source.slice(pageStart, bodyEnd).trim();
page = page.replace(
  /src="data:image\/(png|jpe?g);base64,([^"]+)"/gi,
  (_match, format, encoded) => {
    imageNumber += 1;
    const number = String(imageNumber).padStart(2, "0");
    const inputExtension = format.toLowerCase() === "png" ? "png" : "jpg";
    const inputPath = path.join(temporaryRoot, `image-${number}.${inputExtension}`);
    const outputImagePath = path.join(imageRoot, `image-${number}.jpg`);
    const preserveOriginal = ["09", "11", "12"].includes(number);

    fs.writeFileSync(inputPath, Buffer.from(encoded, "base64"));
    if (preserveOriginal) {
      fs.copyFileSync(inputPath, outputImagePath);
    } else {
      execFileSync("/usr/bin/sips", [
        "-Z",
        "1600",
        "-s",
        "format",
        "jpeg",
        "-s",
        "formatOptions",
        "78",
        inputPath,
        "--out",
        outputImagePath,
      ]);
    }

    return `src="/work/acquisition-cases/image-${number}.jpg"`;
  }
);

const importedHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="田畅的获客项目案例集">
  <title>${title} · Echo Tian</title>
  <style>
${style}
  .site-back {
    width: fit-content;
    margin-bottom: 24px;
    display: inline-flex;
    color: var(--accent-deep);
    font-size: 13px;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--accent) 35%, transparent);
    text-underline-offset: 3px;
  }
  .site-back:hover { color: var(--accent); }
  .page-editor-actions {
    position: fixed;
    z-index: 1000;
    top: 18px;
    right: 18px;
    display: none;
    align-items: center;
    gap: 8px;
    padding: 6px;
    border: 1px solid rgba(168, 85, 247, .2);
    border-radius: 10px;
    background: rgba(12, 7, 20, .9);
    box-shadow: 0 8px 30px rgba(12, 7, 20, .18);
    backdrop-filter: blur(12px);
  }
  .page-editor-actions.is-visible { display: flex; }
  .page-editor-actions button {
    padding: 7px 11px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #e9d5ff;
    font: 600 12px/1 system-ui, sans-serif;
    cursor: pointer;
  }
  .page-editor-actions button:hover { background: rgba(168, 85, 247, .22); }
  .page-editor-status {
    min-width: 42px;
    padding-left: 5px;
    color: #c4b5fd;
    font: 11px/1 system-ui, sans-serif;
  }
  body.page-is-editing [data-edit-key] {
    border-radius: 3px;
    outline: 1px dashed rgba(168, 85, 247, .5);
    outline-offset: 2px;
    cursor: text;
  }
  body.page-is-editing [data-edit-key]:focus {
    outline: 2px solid #a855f7;
    background: rgba(168, 85, 247, .08);
  }
  </style>
</head>
<body>
${page.replace(
  '<div class="page">',
  '<div class="page">\\n  <a class="site-back" href="/">← Echo Tian</a>'
)}
<div class="page-editor-actions" aria-label="Page editing controls">
  <span class="page-editor-status" aria-live="polite"></span>
  <button type="button" data-edit-action>Edit text</button>
</div>
<script>
(() => {
  const slug = "acquisition-cases";
  const targets = document.querySelectorAll(
    ".page-header h1, .page-header .name, .section-head h2, " +
    ".section-head .desc, .kpi-card .num, .kpi-card .label, " +
    ".kpi-card .delta, .content-card h4, .content-card li, .page-footer"
  );
  let fieldNumber = 0;
  const fields = [];
  let savedContent = {};
  let editing = false;

  targets.forEach((target) => {
    Array.from(target.childNodes).forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
      fieldNumber += 1;
      const span = document.createElement("span");
      span.dataset.editKey = "text-" + fieldNumber;
      span.textContent = node.textContent;
      node.replaceWith(span);
      fields.push(span);
    });
  });

  const actions = document.querySelector(".page-editor-actions");
  const button = actions.querySelector("[data-edit-action]");
  const status = actions.querySelector(".page-editor-status");

  function applyContent(content) {
    fields.forEach((field) => {
      const value = content[field.dataset.editKey];
      if (typeof value === "string") field.textContent = value;
    });
  }

  function setEditing(next) {
    editing = next;
    document.body.classList.toggle("page-is-editing", next);
    fields.forEach((field) => {
      field.contentEditable = next ? "true" : "false";
      field.spellcheck = true;
    });
    button.textContent = next ? "Save" : "Edit text";
    status.textContent = next ? "Editing" : "";
  }

  async function save() {
    status.textContent = "Saving…";
    const content = Object.fromEntries(
      fields.map((field) => [field.dataset.editKey, field.textContent])
    );
    const response = await fetch("/api/work-pages/" + slug, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to save.");
    savedContent = result.content;
    setEditing(false);
    status.textContent = "Saved";
    window.setTimeout(() => { status.textContent = ""; }, 1800);
  }

  button.addEventListener("click", async () => {
    if (!editing) {
      setEditing(true);
      return;
    }
    try {
      await save();
    } catch (error) {
      status.textContent = "Not saved";
      window.alert(error instanceof Error ? error.message : "Unable to save.");
    }
  });

  document.addEventListener("click", (event) => {
    if (editing && event.target.closest("a")) event.preventDefault();
  });

  Promise.all([
    fetch("/api/work-pages/" + slug, { cache: "no-store" }).then((response) =>
      response.ok ? response.json() : { content: {} }
    ),
    fetch("/api/admin/session", { cache: "no-store" }).then((response) =>
      response.ok ? response.json() : { authenticated: false }
    )
  ]).then(([pageData, session]) => {
    savedContent = pageData.content || {};
    applyContent(savedContent);
    if (session.authenticated) actions.classList.add("is-visible");
  }).catch(() => {});
})();
</script>
</body>
</html>
`;

fs.writeFileSync(outputPath, importedHtml);
fs.rmSync(temporaryRoot, { recursive: true, force: true });

console.log(
  `Imported ${imageNumber} images into ${path.relative(process.cwd(), outputPath)}`
);
