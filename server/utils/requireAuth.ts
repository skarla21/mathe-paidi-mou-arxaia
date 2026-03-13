import type { H3Event } from "h3";

export function requireAuth(event: H3Event): string {
  const auth = event.context.auth;
  if (!auth?.userId) {
    throw createError({ statusCode: 401, message: "Authentication required" });
  }
  return auth.userId;
}
