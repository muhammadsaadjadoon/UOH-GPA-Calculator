import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const json = (data, status = 200, headers = {}) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
export const validEmail = (email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
export const emailKey = (email) => crypto.createHash("sha256").update(normalizeEmail(email)).digest("hex");

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHex) {
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function sessionSecret() {
  const store = getStore("uoh-config");
  let secret = await store.get("session-secret");
  if (secret) return secret;
  secret = crypto.randomBytes(48).toString("base64url");
  await store.set("session-secret", secret);
  return secret;
}

const cookieName = "uoh_session";
const thirtyDays = 60 * 60 * 24 * 30;

export async function signSession(user) {
  const secret = await sessionSecret();
  const payload = Buffer.from(JSON.stringify({
    uid: user.id,
    emailKey: user.emailKey,
    exp: Math.floor(Date.now() / 1000) + thirtyDays,
  })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const secret = await sessionSecret();
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function cookieValue(req, name = cookieName) {
  const raw = req.headers.get("cookie") || "";
  const parts = raw.split(";").map((x) => x.trim());
  const hit = parts.find((x) => x.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

export const sessionCookie = (token) =>
  `${cookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=${thirtyDays}; HttpOnly; Secure; SameSite=Lax`;

export const clearSessionCookie = () =>
  `${cookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export async function currentUser(req) {
  const session = await verifySessionToken(cookieValue(req));
  if (!session) return null;
  const store = getStore("uoh-users");
  const user = await store.get(`email/${session.emailKey}`, { type: "json" });
  if (!user || user.id !== session.uid) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    emailKey: session.emailKey,
  };
}

export function publicUser(user) {
  if (!user) return null;
  return { id: user.id, full_name: user.full_name, email: user.email, created_at: user.created_at };
}

export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(req.url).origin;
}
