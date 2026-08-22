import { getStore } from "@netlify/blobs";
import { emailKey, json, normalizeEmail, publicUser, sameOrigin, sessionCookie, signSession, validEmail, verifyPassword } from "./lib/core.mjs";

export default async (req) => {
  if (!sameOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email) || email.length > 120 || !password || password.length > 128) {
    return json({ error: "Email or password is incorrect." }, 401);
  }
  const keyHash = emailKey(email);
  const store = getStore("uoh-users");
  const user = await store.get(`email/${keyHash}`, { type: "json" });
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
    return json({ error: "Email or password is incorrect." }, 401);
  }
  const token = await signSession({ ...user, emailKey: keyHash });
  return json({ ok: true, user: publicUser(user) }, 200, { "Set-Cookie": sessionCookie(token) });
};
export const config = { path: "/api/auth/login", method: "POST" };
