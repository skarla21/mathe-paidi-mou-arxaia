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

  try {
    await $fetch("https://formsubmit.co/ajax/antwnis_skarlatos@yahoo.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: {
        email: body.email,
        message: body.message,
        _subject: "Μήνυμα από το mathe-paidi-mou-arxaia.com!",
      },
    });
  } catch {
    throw createError({ statusCode: 502, message: "Failed to send message" });
  }

  return { success: true };
});
