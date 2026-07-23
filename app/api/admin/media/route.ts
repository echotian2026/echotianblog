import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/admin-auth";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");
  if (!isImage && !isAudio) {
    return Response.json(
      { error: "Only image and audio files are supported." },
      { status: 400 }
    );
  }

  const limit = isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > limit) {
    return Response.json(
      { error: `${isImage ? "Images" : "Audio files"} must be smaller than ${limit / 1024 / 1024} MB.` },
      { status: 400 }
    );
  }

  const runtime = env as unknown as { MEDIA?: R2Bucket };
  if (!runtime.MEDIA) {
    return Response.json({ error: "Media storage is unavailable." }, { status: 503 });
  }

  const key = `${isImage ? "images" : "audio"}/${crypto.randomUUID()}-${safeName(file.name) || "upload"}`;
  await runtime.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  });

  return Response.json({
    url: `/api/media/${key}`,
    name: file.name,
    kind: isImage ? "image" : "audio",
  });
}
