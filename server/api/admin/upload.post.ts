import { serverSupabaseService } from "../../utils/supabaseServer";
import { requireAdmin } from "../../utils/requireAdmin";
import { safeStorageName } from "../../utils/safeStorageName";

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
  const safeName = safeStorageName(file.filename);
  const path = isImage
    ? `entity-images/${entity}-${Date.now()}-${safeName}`
    : `lesson-content/${Date.now()}-${safeName}`;
  const { data: upload, error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(path, file.data, {
      contentType: mimeType || "application/pdf",
      upsert: false,
    });
  if (uploadError) {
    console.error("[admin/upload] storage", uploadError.message);
    throw createError({ statusCode: 500, message: "Κάτι πήγε στραβά" });
  }
  const { data: urlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(upload.path);
  return { path: upload.path, url: urlData.publicUrl };
});
