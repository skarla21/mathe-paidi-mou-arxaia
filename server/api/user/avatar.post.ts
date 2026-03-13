import { serverSupabaseService } from "../../utils/supabaseServer";
import { requireAuth } from "../../utils/requireAuth";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: "File too large (max 2MB)" });
  }

  const ext = EXT_MAP[file.type ?? ""] || "jpg";
  const path = `avatars/${userId}/${Date.now()}.${ext}`;

  const supabase = serverSupabaseService();
  const { data: upload, error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(path, file.data, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw createError({ statusCode: 500, message: uploadError.message });
  }

  const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(upload.path);
  const avatar_url = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url })
    .eq("id", userId);

  if (updateError) {
    throw createError({ statusCode: 500, message: updateError.message });
  }

  return { avatar_url };
});
