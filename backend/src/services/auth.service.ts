import { OAuth2Client } from "google-auth-library";
import { prisma } from "../utils/prisma.js";
import { comparePassword, hashPassword, omitPassHash } from "../utils/password.js";
import { signAuthToken } from "../utils/jwt.util.js";
import { mintAccessToken, fetchProfile } from "./egovApi.service.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const loginWithPassword = async (username: string, password: string) => {
  const user = await prisma.dimUser.findFirst({
    where: { username, deletedAt: null },
    include: { scope: true, group: true },
  });

  if (!user || !user.active || !user.passHash) {
    throw new Error("INVALID_CREDENTIALS: Incorrect username or password.");
  }

  const passwordMatches = await comparePassword(password, user.passHash);
  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS: Incorrect username or password.");
  }

  return { token: signAuthToken(user.id), user: omitPassHash(user) };
};

const deriveUniqueUsername = async (email: string): Promise<string> => {
  const base = (email.split("@")[0] || "user").replace(/[^a-zA-Z0-9_.]/g, "") || "user";
  let candidate = base;
  let suffix = 0;

  while (await prisma.dimUser.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  return candidate;
};

export const loginWithGoogle = async (idToken: string) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("[AuthService] Google ID token verification failed:", error);
    throw new Error("INVALID_CREDENTIALS: Could not verify Google account.");
  }

  if (!payload?.sub || !payload.email) {
    throw new Error("INVALID_CREDENTIALS: Could not verify Google account.");
  }

  let user = await prisma.dimUser.findFirst({
    where: { googleId: payload.sub, deletedAt: null },
    include: { scope: true, group: true },
  });

  if (!user) {
    const username = await deriveUniqueUsername(payload.email);
    user = await prisma.dimUser.create({
      data: {
        username,
        email: payload.email,
        firstName: payload.given_name || payload.name || "Google",
        lastName: payload.family_name || "User",
        role: "USER",
        googleId: payload.sub,
        avatarUrl: payload.picture ?? null,
        scopeId: null,
        groupId: null,
        psgcCode: null,
      },
      include: { scope: true, group: true },
    });
  }

  if (!user.active) {
    throw new Error("FORBIDDEN: This account has been deactivated.");
  }

  return { token: signAuthToken(user.id), user: omitPassHash(user) };
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.dimUser.findFirst({ where: { id: userId, deletedAt: null } });

  if (!user || !user.active || !user.passHash) {
    throw new Error("INVALID_CREDENTIALS: Could not verify current password.");
  }

  const passwordMatches = await comparePassword(currentPassword, user.passHash);
  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS: Could not verify current password.");
  }

  const passHash = await hashPassword(newPassword);
  const updatedUser = await prisma.dimUser.update({
    where: { id: userId },
    data: { passHash, forceResetPassword: false },
    include: { scope: true, group: true },
  });

  return omitPassHash(updatedUser);
};

// eGov App SSO API v2 — https://e.gov.ph/developers#api-tabs. exchangeCode is issued by
// the eGov app itself (no registered redirect/callback URL yet, so the frontend currently
// collects it via a dev-mode paste-in rather than a real redirect flow — swapping that
// later doesn't change anything here). The actual HTTP calls live in egovApi.service.ts;
// this just translates its failures into the app's INVALID_CREDENTIALS error convention.
export const loginWithEgov = async (exchangeCode: string) => {
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    const accessToken = await mintAccessToken(exchangeCode);
    profile = await fetchProfile(accessToken);
  } catch (error) {
    throw new Error("INVALID_CREDENTIALS: Could not verify eGovPH account.");
  }

  let user = await prisma.dimUser.findFirst({
    where: { egovId: profile.uniqid, deletedAt: null },
    include: { scope: true, group: true },
  });

  if (!user) {
    const username = await deriveUniqueUsername(profile.email);
    user = await prisma.dimUser.create({
      data: {
        username,
        email: profile.email,
        firstName: profile.first_name || "eGovPH",
        lastName: profile.last_name || "User",
        role: "USER",
        egovId: profile.uniqid,
        avatarUrl: profile.photo ?? null,
        scopeId: null,
        groupId: null,
        psgcCode: null,
      },
      include: { scope: true, group: true },
    });
  }

  if (!user.active) {
    throw new Error("FORBIDDEN: This account has been deactivated.");
  }

  // The raw eGov profile carries a lot more than DimUser has columns for (address, PSGC
  // codes, birth_date, signature, ...). Not persisted anywhere yet — handed back as-is so
  // the frontend can hold onto it (session state) until how to use it is decided.
  return { token: signAuthToken(user.id), user: omitPassHash(user), egovProfile: profile };
};
