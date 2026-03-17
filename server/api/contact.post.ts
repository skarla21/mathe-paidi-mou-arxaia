import { sendContactEmail } from "../utils/email";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; message: string }>(event);

  if (!body.email || !body.message) {
    throw createError({
      statusCode: 400,
      message: "Email and message are required",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw createError({ statusCode: 400, message: "Invalid email address" });
  }

  const config = useRuntimeConfig();
  const contactEmail = (config.contactEmail as string) || "antwnis_skarlatos@yahoo.com";
  const subject = "Μήνυμα από το mathe-paidi-mou-arxaia.com!";

  const html = `
    <p><strong>Από:</strong> ${escapeHtml(body.email)}</p>
    <p><strong>Μήνυμα:</strong></p>
    <p>${escapeHtml(body.message).replace(/\n/g, "<br>")}</p>
  `;

  try {
    await sendContactEmail({
      to: contactEmail,
      replyTo: body.email,
      subject,
      html,
    });
  } catch (e) {
    console.error("[contact] Resend error:", e);
    throw createError({ statusCode: 502, message: "Failed to send message" });
  }

  return { success: true };
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
