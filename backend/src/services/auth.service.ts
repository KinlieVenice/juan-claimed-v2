import { OAuth2Client } from "google-auth-library";
import { prisma } from "../utils/prisma.js";
import { comparePassword, hashPassword, omitPassHash } from "../utils/password.js";
import { signAuthToken } from "../utils/jwt.util.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const EGOV_PARTNER_CODE = process.env.EGOV_PARTNER_CODE as string;
const EGOV_PARTNER_SECRET = process.env.EGOV_PARTNER_SECRET as string;
const EGOV_TOKEN_URL = "https://oauth.e.gov.ph/api/token";
const EGOV_PROFILE_URL = "https://oauth.e.gov.ph/api/partner/sso_authentication";

// Shape of the "data" object in eGov App SSO API v2's sso_authentication response —
// only the fields this service actually reads are declared; the real payload carries
// more (address components, PSGC codes, passport{}) that a later "sync default fields
// from eGov" pass can read once that work is scoped.
interface EgovProfile {
  uniqid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  photo?: string;
}

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

// eGov App SSO API v2 — https://e.gov.ph/developers#api-tabs. exchangeCode is issued by
// the eGov app itself (no registered redirect/callback URL yet, so the frontend currently
// collects it via a dev-mode paste-in rather than a real redirect flow — swapping that
// later doesn't change anything here). Two server-to-server calls, in order:
//   1. exchange it (+ partner_code/partner_secret) for a one-time access_token
//   2. use that access_token to fetch the applicant's eGov profile
const exchangeEgovCodeForAccessToken = async (exchangeCode: string): Promise<string> => {
  const form = new FormData();
  form.set("partner_code", EGOV_PARTNER_CODE);
  form.set("partner_secret", EGOV_PARTNER_SECRET);
  form.set("scope", "SSO_AUTHENTICATION");
  form.set("exchange_code", exchangeCode);

  const response = await fetch(EGOV_TOKEN_URL, { method: "POST", body: form });
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.access_token) {
    console.error("[AuthService] eGov token exchange failed:", response.status, body);
    throw new Error("INVALID_CREDENTIALS: Could not verify eGovPH account.");
  }

  return body.access_token as string;
};

const fetchEgovProfile = async (accessToken: string): Promise<EgovProfile> => {
  const response = await fetch(EGOV_PROFILE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json().catch(() => null);
  const profile = body?.data as EgovProfile | undefined;

  if (!response.ok || !profile?.uniqid || !profile.email) {
    console.error("[AuthService] eGov profile fetch failed:", response.status, body);
    throw new Error("INVALID_CREDENTIALS: Could not verify eGovPH account.");
  }

  return profile;
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

export const loginWithEgov = async (exchangeCode: string) => {
  const accessToken = await exchangeEgovCodeForAccessToken(exchangeCode);
  const profile = await fetchEgovProfile(accessToken);

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

  return { token: signAuthToken(user.id), user: omitPassHash(user) };
};
