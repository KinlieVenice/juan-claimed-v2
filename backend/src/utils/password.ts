import bcrypt from "bcrypt";
import { randomInt } from "node:crypto";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// Excludes visually-ambiguous characters (0/O, 1/I/l) since this is meant to be read off
// a screen and relayed to someone, or copy-pasted — used for reset-password's one-time
// temporary password.
const TEMP_PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export const generateTempPassword = (length = 8): string => {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += TEMP_PASSWORD_CHARS[randomInt(TEMP_PASSWORD_CHARS.length)];
  }
  return password;
};

/** Strips passHash from a DimUser (or array of them) before it ever leaves a service. */
export const omitPassHash = <T extends { passHash?: unknown }>(user: T) => {
  const { passHash: _omit, ...safeUser } = user;
  return safeUser;
};
