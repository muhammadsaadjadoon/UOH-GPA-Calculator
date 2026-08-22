import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { emailKey, hashPassword, json, normalizeEmail, publicUser, sameOrigin, sessionCookie, signSession, validEmail } from "./lib/core.mjs";

export default async (req) => {
  if (!sameOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const full_name = String(body.full_name || "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (full_name.length < 2 || full_name.length > 70) return json({ error: "Enter your full name." }, 400);
  if (!validEmail(email) || email.length > 120) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);
  if (password.length > 128) return json({ error: "Password is too long." }, 400);

  const store = getStore("uoh-users");
  const keyHash = emailKey(email);
  const key = `email/${keyHash}`;
  if (await store.get(key)) return json({ error: "An account with this email already exists." }, 409);

  const passwordData = hashPassword(password);
  const user = {
    id: crypto.randomUUID(), full_name, email,
    password_salt: passwordData.salt,
    password_hash: passwordData.hash,
    created_at: new Date().toISOString(),
  };
  await store.setJSON(key, user);
  const token = await signSession({ ...user, emailKey: keyHash });
  return json({ ok: true, user: publicUser(user) }, 201, { "Set-Cookie": sessionCookie(token) });
};
export const config = { path: "/api/auth/register", method: "POST" };
