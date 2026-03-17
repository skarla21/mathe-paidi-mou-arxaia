import { Auth } from "@auth/core";
import { getAuthOptions } from "../../utils/authOptions";

export default defineEventHandler(async (event) => {
  const authOptions = getAuthOptions();
  const request = event.node.req;
  const url = getRequestURL(event);

  const hasBody = !["GET", "HEAD"].includes(request.method || "");
  const authRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers as unknown as HeadersInit,
    body: hasBody ? (request as any) : undefined,
    ...(hasBody && { duplex: "half" as const }),
  });

  const response = await Auth(authRequest, authOptions);

  const setCookieHeader = response.headers.get("set-cookie");
  if (setCookieHeader) {
    event.node.res.setHeader("Set-Cookie", setCookieHeader);
  }

  return response;
});
