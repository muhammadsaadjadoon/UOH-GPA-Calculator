import { getStore } from "@netlify/blobs";
import { currentUser, json, publicUser, sameOrigin } from "./lib/core.mjs";

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

const emptyProfile = () => ({
  student_id: "",
  program: "",
  semester: null,
  target_cgpa: null,
  bio: "",
  avatar_data: "",
  updated_at: null,
});

const normalizeProfile = (profile) => ({
  student_id: profile?.student_id || "",
  program: profile?.program || "",
  semester: Number.isInteger(profile?.semester) ? profile.semester : null,
  target_cgpa: Number.isFinite(profile?.target_cgpa) ? profile.target_cgpa : null,
  bio: profile?.bio || "",
  avatar_data: profile?.avatar_data || "",
  updated_at: profile?.updated_at || null,
});

const validAvatar = (value) => {
  if (!value) return true;
  if (value.length > 450000) return false;
  return /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value);
};

export default async (req) => {
  const sessionUser = await currentUser(req);
  if (!sessionUser) return json({ error: "Sign in to manage your profile." }, 401);

  const usersStore = getStore("uoh-users");
  const profilesStore = getStore("uoh-profiles");
  const userKey = `email/${sessionUser.emailKey}`;

  const user = await usersStore.get(userKey, { type: "json" });
  if (!user || user.id !== sessionUser.id) {
    return json({ error: "Account could not be found." }, 404);
  }

  if (req.method === "GET") {
    const storedProfile = await profilesStore.get(user.id, { type: "json" });
    return json({
      user: publicUser(user),
      profile: storedProfile ? normalizeProfile(storedProfile) : emptyProfile(),
    });
  }

  if (req.method !== "PUT") {
    return json({ error: "Method not allowed." }, 405);
  }

  if (!sameOrigin(req)) return json({ error: "Invalid request origin." }, 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid profile data." }, 400);
  }

  const fullName = String(body.full_name || "").trim();
  const studentId = cleanText(body.student_id, 40);
  const program = cleanText(body.program, 80);
  const bio = cleanText(body.bio, 180);
  const avatarData = String(body.avatar_data || "");

  if (fullName.length < 2 || fullName.length > 70) {
    return json({ error: "Enter a valid full name." }, 400);
  }

  let semester = null;
  if (body.semester !== null && body.semester !== "") {
    semester = Number(body.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 16) {
      return json({ error: "Semester must be between 1 and 16." }, 400);
    }
  }

  let targetCgpa = null;
  if (body.target_cgpa !== null && body.target_cgpa !== "") {
    targetCgpa = Number(body.target_cgpa);
    if (!Number.isFinite(targetCgpa) || targetCgpa < 0 || targetCgpa > 4) {
      return json({ error: "Target CGPA must be between 0.00 and 4.00." }, 400);
    }
    targetCgpa = Math.round(targetCgpa * 100) / 100;
  }

  if (!validAvatar(avatarData)) {
    return json({ error: "Profile photo is invalid or too large." }, 400);
  }

  const updatedUser = {
    ...user,
    full_name: fullName,
  };

  const profile = {
    student_id: studentId,
    program,
    semester,
    target_cgpa: targetCgpa,
    bio,
    avatar_data: avatarData,
    updated_at: new Date().toISOString(),
  };

  await Promise.all([
    usersStore.setJSON(userKey, updatedUser),
    profilesStore.setJSON(user.id, profile),
  ]);

  return json({
    ok: true,
    user: publicUser(updatedUser),
    profile,
  });
};

export const config = { path: "/api/profile" };
