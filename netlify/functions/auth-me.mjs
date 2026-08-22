import { currentUser, json, publicUser } from "./lib/core.mjs";
export default async (req) => {
  const user = await currentUser(req);
  return json({ authenticated: Boolean(user), user: publicUser(user) });
};
export const config = { path: "/api/auth/me", method: "GET" };
