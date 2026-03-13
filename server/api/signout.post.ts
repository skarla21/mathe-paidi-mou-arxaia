export default defineEventHandler((event) => {
  // JWT sessions have no server-side state — clearing the cookie is sufficient.
  // __Secure- and __Host- prefixed cookies require the Secure attribute in the
  // clearing directive; without it browsers silently ignore the Set-Cookie header.
  const cookiesToClear = [
    `authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
    `__Secure-authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`,
    `__Host-authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`,
  ];

  event.node.res.setHeader("Set-Cookie", cookiesToClear);
  return { success: true };
});
