import type { H3Event } from "h3";

export function requireAdmin(event: H3Event): void {
  const auth = event.context.auth;
  if (!auth?.userId || !auth?.isAdmin) {
    throw createError({ statusCode: 403, message: "Admin access required" });
  }
}
