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

    fs.writeFileSync(inputPath, Buffer.from(encoded, "base64"));
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
  </style>
</head>
<body>
${page.replace(
  '<div class="page">',
  '<div class="page">\\n  <a class="site-back" href="/">← Echo Tian</a>'
)}
</body>
</html>
`;

fs.writeFileSync(outputPath, importedHtml);
fs.rmSync(temporaryRoot, { recursive: true, force: true });

console.log(
  `Imported ${imageNumber} images into ${path.relative(process.cwd(), outputPath)}`
);
