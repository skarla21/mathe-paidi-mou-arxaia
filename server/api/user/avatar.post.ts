import { serverSupabaseService } from "../../utils/supabaseServer";
import { requireAuth } from "../../utils/requireAuth";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "uploads";

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function extractStoragePathFromUrl(
  url: string,
  supabaseUrl: string,
): string | null {
  const base = supabaseUrl.replace(/\/$/, "");
  const prefix = "/storage/v1/object/public/" + BUCKET + "/";
  if (!url.startsWith(base) || !url.includes(prefix)) return null;
  const idx = url.indexOf(prefix);
  const beforeQuery = url.split("?")[0];
  if (idx < 0 || !beforeQuery) return null;
  const pathPart = beforeQuery.slice(idx + prefix.length);
  return pathPart && pathPart.startsWith("avatars/")
    ? decodeURIComponent(pathPart)
    : null;
}

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event);

  const formData = await readMultipartFormData(event);
  if (!formData?.length) {
    throw createError({ statusCode: 400, message: "No file uploaded" });
  }

  const file = formData.find((f) => f.name === "file" && f.data);
  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, message: "Invalid file" });
  }

  if (!ALLOWED_TYPES.includes(file.type || "")) {
    throw createError({
      statusCode: 400,
      message: "Only JPEG, PNG, and WebP images allowed",
    });
  }

  // Validate image magic bytes
  const bytes = new Uint8Array(file.data)
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  if (!isJpeg && !isPng && !isWebp) {
    throw createError({ statusCode: 400, message: "Invalid image file" })
  }

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: "File too large (max 2MB)" });
  }

  const supabase = serverSupabaseService();
  const config = useRuntimeConfig();
  const supabaseUrl = (config.public.supabaseUrl as string) || "";

  const { data: userRow } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  const oldPath = userRow?.avatar_url
    ? extractStoragePathFromUrl(userRow.avatar_url, supabaseUrl)
    : null;

  if (oldPath) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove([oldPath]);
    if (removeError) {
      console.warn("[avatar.post] Failed to delete old avatar:", removeError.message);
    }
  }

  const ext = EXT_MAP[file.type ?? ""] || "jpg";
  const path = `avatars/${userId}/${Date.now()}.${ext}`;

  const { data: upload, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.data, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error('[user/avatar.post] Upload failed:', uploadError.message)
    throw createError({ statusCode: 500, message: 'File upload failed' });
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(upload.path);
  const avatar_url = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url })
    .eq("id", userId);

  if (updateError) {
    console.error('[user/avatar.post] DB update failed:', updateError.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' });
  }

  return { avatar_url };
});
