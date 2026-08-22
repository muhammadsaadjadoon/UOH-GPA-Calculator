import { getStore } from "@netlify/blobs";
import { currentUser, json, sameOrigin } from "./lib/core.mjs";

export default async (req, context) => {
  if (req.method !== 'DELETE') return json({ error: "Method not allowed." }, 405);
  if (!sameOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  const user = await currentUser(req);
  if (!user) return json({ error: "Sign in to use account history." }, 401);
  const id = String(context.params?.id || '').trim();
  if (!/^[0-9a-f-]{20,50}$/i.test(id)) return json({ error: "Invalid history item." }, 400);
  const store = getStore("uoh-history");
  await store.delete(`${user.id}/${id}`);
  return json({ ok: true });
};
export const config = { path: "/api/history/:id", method: "DELETE" };
