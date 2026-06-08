import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";

export const runtime = "nodejs";

const bucketName = "nammaraitha-images";
const maxFileSize = 6 * 1024 * 1024;

function safeFileName(name: string) {
  const [baseName = "image", extension = "jpg"] = name.split(/\.(?=[^.]+$)/);
  return `${baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image"}.${extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if ("error" in auth) {
    return auth.error;
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const target = String(formData?.get("target") ?? "uploads").replace(/[^a-z0-9-]/gi, "-");

  if (!(file instanceof File)) {
    return apiError("Please choose an image file.", 400);
  }

  if (!file.type.startsWith("image/")) {
    return apiError("Only image uploads are supported.", 400);
  }

  if (file.size > maxFileSize) {
    return apiError("Image is too large. Keep it under 6 MB.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${target}/${auth.user.id}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await auth.supabase.storage.from(bucketName).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false
  });

  if (error) {
    return apiError(`Image upload failed: ${error.message}`, 500);
  }

  const { data } = auth.supabase.storage.from(bucketName).getPublicUrl(path);

  return apiOk({
    success: true,
    url: data.publicUrl,
    path
  });
}
