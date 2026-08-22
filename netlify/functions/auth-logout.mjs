import { clearSessionCookie, json, sameOrigin } from "./lib/core.mjs";
export default async (req) => {
  if (!sameOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
};
export const config = { path: "/api/auth/logout", method: "POST" };
