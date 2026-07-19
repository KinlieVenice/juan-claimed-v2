import { OAuth2Client } from "google-auth-library";
import { prisma } from "../utils/prisma.js";
import { comparePassword, omitPassHash } from "../utils/password.js";
import { signAuthToken } from "../utils/jwt.util.js";

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
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
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
