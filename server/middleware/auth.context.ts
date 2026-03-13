import { Auth } from "@auth/core";
import { getAuthOptions } from "../utils/authOptions";

export default defineEventHandler(async (event) => {
  if (event.path?.startsWith("/api/auth")) {
    return;
  }

  const authOptions = getAuthOptions();
  const url = new URL("/api/auth/session", getRequestURL(event).origin);
  const authRequest = new Request(url.toString(), {
    method: "GET",
    headers: (event.node.req.headers as unknown) as HeadersInit,
  });

  const response = await Auth(authRequest, authOptions);

  if (!response.ok) {
    event.context.auth = { userId: null, isAdmin: false };
    return;
  }

  const session = (await response.json()) as { user?: { id?: string; isAdmin?: boolean } } | null;
  const user = session?.user;

  event.context.auth = {
    userId: user?.id ?? null,
    isAdmin: Boolean(user?.isAdmin),
  };
});
