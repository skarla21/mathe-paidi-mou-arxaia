import { Auth } from "@auth/core";
import { getAuthOptions } from "../utils/authOptions";

export default defineEventHandler(async (event) => {
  if (event.path?.startsWith("/api/auth")) {
    return;
  }

  event.context.auth = { userId: null, isAdmin: false };

  try {
    const authOptions = getAuthOptions();
    const url = new URL("/api/auth/session", getRequestURL(event).origin);
    const authRequest = new Request(url.toString(), {
      method: "GET",
      headers: {
        cookie: getRequestHeader(event, "cookie") ?? "",
      },
    });

    const response = await Auth(authRequest, authOptions);

    if (!response.ok) return;

    const session = (await response.json()) as { user?: { id?: string; isAdmin?: boolean } } | null;
    const user = session?.user;

    event.context.auth = {
      userId: user?.id ?? null,
      isAdmin: Boolean(user?.isAdmin),
    };
  } catch (err) {
    console.error("[auth.context] failed to resolve session:", err);
  }
});
