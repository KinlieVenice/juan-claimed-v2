import bcrypt from "bcrypt";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Strips passHash from a DimUser (or array of them) before it ever leaves a service. */
export const omitPassHash = <T extends { passHash?: unknown }>(user: T) => {
  const { passHash: _omit, ...safeUser } = user;
  return safeUser;
};
