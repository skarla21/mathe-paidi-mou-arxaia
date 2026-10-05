import { serverSupabaseService } from "../../utils/supabaseServer";
import { requireAdmin } from "../../utils/requireAdmin";
import { randomUUID } from "node:crypto";
import { storedFileName } from "../../utils/safeStorageName";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

function validateMagicBytes(data: Buffer, mimeType: string): boolean {
  const bytes = new Uint8Array(data);
  if (mimeType === "application/pdf") {
    const header = new TextDecoder().decode(data.slice(0, 5));
    return header === "%PDF-";
  }
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8;
  }
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  return false;
}

const IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

function isNameTaken(error: { message?: string; status?: number; statusCode?: string | number }): boolean {
  const status = Number(error.status ?? error.statusCode);
  if (status === 409) return true;
  return /already exists|duplicate/i.test(error.message ?? "");
}

async function uploadUnique(
  supabase: SupabaseClient,
  folder: string,
  filename: string,
  mimeType: string,
  data: Buffer,
) {
  let lastError: unknown = new Error("Could not allocate a storage name");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const path = `${folder}/${storedFileName(filename, mimeType, randomUUID().slice(0, 8))}`;
    const { data: upload, error } = await supabase.storage.from("uploads").upload(path, data, {
      contentType: mimeType,
      upsert: false,
    });
    if (!error && upload) return upload;
    lastError = error ?? lastError;
    if (!error || !isNameTaken(error)) throw error ?? lastError;
  }
  throw lastError;
}

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const formData = await readMultipartFormData(event);
  if (!formData?.length) {
    throw createError({ statusCode: 400, message: "No file uploaded" });
  }
  const file = formData.find((f) => f.name === "file" && f.data);
  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, message: "Invalid file" });
  }
  const target =
    formData.find((f) => f.name === "target")?.data?.toString() || "lesson";
  const entity =
    formData.find((f) => f.name === "entity")?.data?.toString() || "chapter";

  const isImage = target === "image";
  const mimeType = (file.type || "") as (typeof ALLOWED_TYPES)[number];

  if (isImage) {
    const imgMime = mimeType as (typeof IMAGE_TYPES)[number];
    if (!IMAGE_TYPES.includes(imgMime)) {
      throw createError({
        statusCode: 400,
        message: "Images: only JPG and PNG allowed",
      });
    }
  } else if (!ALLOWED_TYPES.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      message: "Only PDF, JPG, and PNG allowed",
    });
  }

  if (!validateMagicBytes(file.data, mimeType)) {
    throw createError({ statusCode: 400, message: "Invalid file format" });
  }
  const maxSize =
    mimeType === "application/pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
  if (file.data.length > maxSize) {
    const limit = mimeType === "application/pdf" ? "50MB" : "20MB";
    throw createError({
      statusCode: 400,
      message: `File too large (max ${limit})`,
    });
  }
  const supabase = serverSupabaseService();
  const folder = isImage ? "entity-images" : "lesson-content";
  const entityPrefix = entity.replace(/[\\/]/g, "").replace(/[^A-Za-z0-9-]/g, "") || "item";
  const filename = isImage ? `${entityPrefix}-${file.filename}` : file.filename;
  let upload;
  try {
    upload = await uploadUnique(
      supabase,
      folder,
      filename,
      mimeType || "application/pdf",
      file.data,
    );
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Upload failed";
    console.error("[admin/upload] storage", message);
    throw createError({ statusCode: 500, message: "Κάτι πήγε στραβά" });
  }
  const { data: urlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(upload.path);
  return { path: upload.path, url: urlData.publicUrl };
});
