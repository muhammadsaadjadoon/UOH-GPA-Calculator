import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { currentUser, json, sameOrigin } from "./lib/core.mjs";

export default async (req) => {
  const user = await currentUser(req);
  if (!user) return json({ error: "Sign in to use account history." }, 401);
  const store = getStore("uoh-history");
  const prefix = `${user.id}/`;

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix });
    const entries = await Promise.all(blobs.map((blob) => store.get(blob.key, { type: "json" })));
    const items = entries.filter(Boolean).sort((a,b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 50);
    return json({ items });
  }

  if (!sameOrigin(req)) return json({ error: "Invalid request origin." }, 403);

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid history data." }, 400); }
    const type = String(body.type || "").toLowerCase();
    if (!['gpa','cgpa'].includes(type)) return json({ error: "Invalid result type." }, 400);
    const item = {
      id: crypto.randomUUID(), type,
      value: Number(body.value), totalCredits: Number(body.totalCredits), totalQP: Number(body.totalQP),
      count: Number.parseInt(body.count, 10), letter: String(body.letter || '').slice(0,4),
      timestamp: new Date().toISOString(),
    };
    if (![item.value, item.totalCredits, item.totalQP, item.count].every(Number.isFinite)) {
      return json({ error: "Invalid history data." }, 400);
    }
    if (item.value < 0 || item.value > 4) return json({ error: "Invalid result value." }, 400);
    if (item.totalCredits <= 0 || item.totalCredits > 1000) return json({ error: "Invalid credit total." }, 400);
    if (item.totalQP < 0 || item.totalQP > item.totalCredits * 4.001) return json({ error: "Invalid quality-point total." }, 400);
    if (item.count < 1 || item.count > 100) return json({ error: "Invalid item count." }, 400);
    if (!/^(?:A-?|B[+-]?|C\+?|D|F)$/.test(item.letter)) return json({ error: "Invalid letter grade." }, 400);

    await store.setJSON(`${prefix}${item.id}`, item);
    return json({ ok: true }, 201);
  }

  if (req.method === "DELETE") {
    const { blobs } = await store.list({ prefix });
    await Promise.all(blobs.map((blob) => store.delete(blob.key)));
    return json({ ok: true });
  }

  return json({ error: "Method not allowed." }, 405);
};
export const config = { path: "/api/history" };
